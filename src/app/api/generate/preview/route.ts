import { NextRequest } from 'next/server'
import { fal } from '@fal-ai/client'
import { runTwoPreviewFaceSwaps } from '@/lib/faceswap'

fal.config({ credentials: process.env.FAL_KEY })

export const maxDuration = 300

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

        // Accept front/left/right (new) or photo/photo2 (legacy)
        const frontFile  = formData.get('front')  as File | null
        const leftFile   = formData.get('left')   as File | null
        const rightFile  = formData.get('right')  as File | null
        const legacyFile  = formData.get('photo')  as File | null
        const legacyFile2 = formData.get('photo2') as File | null
        const style      = (formData.get('style') as string) || 'restaurant'
        const hasTattoos = formData.get('hasTattoos') === 'true'

        const files: File[] = []
        if (frontFile?.size)  files.push(frontFile)
        if (leftFile?.size)   files.push(leftFile)
        if (rightFile?.size)  files.push(rightFile)
        // Legacy fallback
        if (!files.length && legacyFile?.size)  files.push(legacyFile)
        if (!files.length && legacyFile2?.size) files.push(legacyFile2)

        if (!files.length) {
          send({ status: 'error', error: 'No photos provided' })
          controller.close()
          return
        }

        send({ status: 'uploading' })
        const uploadedUrls = await Promise.all(files.map(f => fal.storage.upload(f)))
        console.log('[preview] Uploaded', uploadedUrls.length, 'photo(s), style:', style, 'hasTattoos:', hasTattoos)

        send({ status: 'preparing' })

        const urls = await runTwoPreviewFaceSwaps(
          uploadedUrls,
          style,
          hasTattoos,
          (status) => send({ status })
        )

        send({ status: 'checking' })

        if (!urls.length) {
          send({ status: 'error', error: 'Generation failed — please try a different photo' })
          controller.close()
          return
        }

        send({ status: 'saving' })
        await new Promise<void>(r => setTimeout(r, 400))

        send({ status: 'done', urls })
        console.log('[preview] Done —', urls.length, 'preview(s)')
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
