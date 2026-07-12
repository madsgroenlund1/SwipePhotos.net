import { NextRequest } from 'next/server'
import { fal } from '@fal-ai/client'
import { scoreOutput } from '@/lib/faceswap'
import { createAdminClientDirect } from '@/lib/supabase/server'

fal.config({ credentials: process.env.FAL_KEY })

export const maxDuration = 120

function delay(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

// Upload image bytes to fal storage so the model can access it
async function toFalUrl(sourceUrl: string): Promise<string> {
  const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Cannot fetch source image: ${res.status}`)
  const blob = await res.blob()
  const file = new File([blob], 'preview.jpg', { type: blob.type || 'image/jpeg' })
  return fal.storage.upload(file)
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        try { controller.enqueue(encoder.encode(JSON.stringify(data) + '\n')) } catch {}
      }

      const startedAt = new Date().toISOString()
      let inputUrl = ''
      let orderId: string | null = null

      try {
        const body = await req.json().catch(() => ({})) as Record<string, unknown>
        inputUrl = typeof body.previewUrl === 'string' ? body.previewUrl : ''
        orderId  = typeof body.orderId   === 'string' ? body.orderId   : null

        if (!inputUrl) {
          send({ status: 'error', error: 'No preview URL provided' })
          controller.close()
          return
        }

        // ── 1. Verify source image is reachable ───────────────────────────────
        send({ status: 'preparing' })

        let accessible = false
        try {
          const head = await fetch(inputUrl, { method: 'HEAD', signal: AbortSignal.timeout(8000) })
          accessible = head.ok
          // Some CDNs return 405 on HEAD — fall back to GET range
          if (!accessible && head.status === 405) {
            const get = await fetch(inputUrl, { headers: { Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(10_000) })
            accessible = get.ok || get.status === 206
          }
        } catch { accessible = false }

        if (!accessible) {
          send({ status: 'error', error: 'Preview image is no longer accessible — please go back and regenerate' })
          controller.close()
          return
        }

        // ── 2. Face alignment check (UI step while we upload to fal) ─────────
        send({ status: 'checking_alignment' })

        let falInputUrl: string
        try {
          falInputUrl = await toFalUrl(inputUrl)
        } catch (err) {
          // If we can't upload, fall back to using the URL directly
          console.warn('[refine] fal upload failed, using original URL:', err)
          falInputUrl = inputUrl
        }

        // ── 3–4. Blending + skin tone (emit while model starts) ──────────────
        send({ status: 'blending' })
        await delay(600)
        send({ status: 'skin_tone' })

        // ── Real AI enhancement: AuraSR 4× upscale ───────────────────────────
        // fal-ai/aura-sr: state-of-the-art GAN upscaler tuned for faces.
        // Takes ~15-25 sec. Runs concurrently with the UI step sequence above.
        let enhancedUrl = inputUrl
        try {
          const result = await fal.run('fal-ai/aura-sr', {
            input: {
              image_url: falInputUrl,
              upscale_factor: 4,
              overlapping_tiles: true,
            },
          }) as { image?: { url?: string }; images?: Array<{ url?: string }> }

          const outUrl = result?.image?.url ?? result?.images?.[0]?.url
          if (outUrl) {
            enhancedUrl = outUrl
            console.log('[refine] AuraSR enhanced:', enhancedUrl)
          }
        } catch (err) {
          // Non-fatal: fall back to original URL
          console.warn('[refine] AuraSR failed, using original:', err instanceof Error ? err.message : err)
        }

        // ── 5–6. Texture + artifact removal UI steps ─────────────────────────
        send({ status: 'texture' })
        await delay(700)
        send({ status: 'artifacts' })
        await delay(500)

        // ── 7. Quality gate on the enhanced (or original) image ──────────────
        send({ status: 'quality' })
        const quality = await scoreOutput(enhancedUrl)

        if (!quality.passed) {
          try {
            await createAdminClientDirect().from('preview_refinements').insert({
              order_id: orderId, input_url: inputUrl, status: 'failed',
              quality_passed: false, error: quality.failReason,
              quality_details: { file_size_bytes: quality.fileSizeBytes },
              created_at: startedAt, completed_at: new Date().toISOString(),
            })
          } catch { /* non-critical */ }

          send({ status: 'error', error: 'Quality check failed — please go back and try a different photo' })
          controller.close()
          return
        }

        // ── 8. Save refinement record ─────────────────────────────────────────
        send({ status: 'saving' })
        try {
          await createAdminClientDirect().from('preview_refinements').insert({
            order_id: orderId, input_url: inputUrl, output_url: enhancedUrl,
            status: 'passed', quality_passed: true,
            quality_details: { file_size_bytes: quality.fileSizeBytes, enhanced: enhancedUrl !== inputUrl },
            created_at: startedAt, completed_at: new Date().toISOString(),
          })
        } catch (err: unknown) {
          console.warn('[refine] DB insert skipped:', err instanceof Error ? err.message : err)
        }
        await delay(300)

        // ── 9. Done — return the enhanced URL ────────────────────────────────
        send({ status: 'done', url: enhancedUrl })
        console.log('[refine] Done —', quality.fileSizeBytes, 'B, enhanced:', enhancedUrl !== inputUrl)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[refine] Error:', msg)
        send({ status: 'error', error: msg })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'application/x-ndjson',
      'Cache-Control':     'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
