import { NextRequest } from 'next/server'
import { fal } from '@fal-ai/client'
import { runTwoPreviewFaceSwaps } from '@/lib/faceswap'
import { createAdminClientDirect } from '@/lib/supabase/server'

fal.config({ credentials: process.env.FAL_KEY })

export const maxDuration = 300

// Persist a preview output permanently in Supabase storage (fal URLs expire).
// Falls back to the fal URL if the copy fails, so the customer still sees a result.
async function persistPreview(url: string, runId: string, name: string): Promise<string> {
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`GET ${resp.status}`)
    const buffer = await resp.arrayBuffer()
    const supabase = createAdminClientDirect()
    const path = `previews/${runId}/${name}.jpg`
    const { error } = await supabase.storage
      .from('uploads')
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path)
    return publicUrl
  } catch (err) {
    console.error('[preview] Persist failed for', name, err)
    return url
  }
}

// Save the full run log (job ids, status, inputs, outputs, errors) so every
// generation is auditable even without a dedicated DB table.
async function saveRunLog(runId: string, log: object) {
  try {
    const supabase = createAdminClientDirect()
    await supabase.storage
      .from('uploads')
      .upload(`previews/${runId}/run-log.json`, new Blob([JSON.stringify(log, null, 2)]), {
        contentType: 'application/json', upsert: true,
      })
  } catch (err) {
    console.error('[preview] Run log save failed:', err)
  }
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        try { controller.enqueue(encoder.encode(JSON.stringify(data) + '\n')) } catch {}
      }

      try {
        let formData: FormData
        try { formData = await req.formData() } catch {
          send({ status: 'error', error: 'Invalid request body' })
          controller.close()
          return
        }

        const frontFile  = formData.get('front')  as File | null
        const leftFile   = formData.get('left')   as File | null
        const rightFile  = formData.get('right')  as File | null
        const bodyFile   = formData.get('body')   as File | null
        const legacyFile = formData.get('photo')  as File | null
        const style      = (formData.get('style') as string) || 'restaurant'
        const hasTattoos = formData.get('hasTattoos') === 'true'
        const tattooFile = formData.get('tattooPhoto') as File | null
        const tattooDesc = ((formData.get('tattooDesc') as string) || '').slice(0, 200)

        const front = frontFile?.size ? frontFile : legacyFile
        if (!front?.size) {
          send({ status: 'error', error: 'No photos provided' })
          controller.close()
          return
        }

        send({ status: 'uploading' })
        const [frontUrl, leftUrl, rightUrl, bodyUrl, tattooUrl] = await Promise.all([
          fal.storage.upload(front),
          leftFile?.size  ? fal.storage.upload(leftFile).catch(() => null)  : Promise.resolve(null),
          rightFile?.size ? fal.storage.upload(rightFile).catch(() => null) : Promise.resolve(null),
          bodyFile?.size  ? fal.storage.upload(bodyFile).catch(() => null)  : Promise.resolve(null),
          hasTattoos && tattooFile?.size ? fal.storage.upload(tattooFile).catch(() => null) : Promise.resolve(null),
        ])
        console.log('[preview] Uploaded refs — style:', style, 'left:', !!leftUrl, 'right:', !!rightUrl, 'body:', !!bodyUrl, 'tattoo:', !!tattooUrl)

        send({ status: 'preparing' })

        const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const result = await runTwoPreviewFaceSwaps(
          { front: frontUrl, left: leftUrl ?? undefined, right: rightUrl ?? undefined, body: bodyUrl ?? undefined },
          style,
          hasTattoos,
          (status) => send({ status }),
          tattooUrl ? { url: tattooUrl, description: tattooDesc } : undefined
        )

        send({ status: 'checking' })

        const [neutralUrl, smileUrl] = result.urls
        const failed = result.jobs.filter(j => j.status !== 'completed')

        if (!neutralUrl && !smileUrl) {
          await saveRunLog(runId, { runId, style, hasTattoos, templateId: result.templateId, jobs: result.jobs, outcome: 'both_failed' })
          send({ status: 'error', error: 'Generation failed — please try again or use different photos' })
          controller.close()
          return
        }
        if (!neutralUrl || !smileUrl) {
          // One of the two jobs failed — surface a clear error so the customer can retry.
          await saveRunLog(runId, { runId, style, hasTattoos, templateId: result.templateId, jobs: result.jobs, outcome: 'partial_failure' })
          send({ status: 'error', error: `One of your two previews failed (${failed.map(f => f.error).join('; ')}). Please tap retry.` })
          controller.close()
          return
        }

        send({ status: 'saving' })
        const [savedNeutral, savedSmile] = await Promise.all([
          persistPreview(neutralUrl, runId, 'preview-neutral'),
          persistPreview(smileUrl,   runId, 'preview-smile'),
        ])
        await saveRunLog(runId, {
          runId, style, hasTattoos, templateId: result.templateId,
          jobs: result.jobs, savedUrls: [savedNeutral, savedSmile], outcome: 'success',
        })

        send({ status: 'done', urls: [savedNeutral, savedSmile] })
        console.log('[preview] Done — run', runId)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[preview] Error:', msg)
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
