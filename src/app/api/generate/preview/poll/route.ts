import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

const MODEL = 'fal-ai/instantid'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get('ids')
  const stylesParam = searchParams.get('styles')

  if (!idsParam || !stylesParam) {
    return NextResponse.json({ error: 'Missing ids or styles' }, { status: 400 })
  }

  const requestIds = idsParam.split(',')
  const styles = stylesParam.split(',')

  const photos: Record<string, string> = {}
  let completedCount = 0

  await Promise.allSettled(
    requestIds.map(async (requestId, i) => {
      const style = styles[i]
      try {
        const status = await fal.queue.status(MODEL, { requestId, logs: false })
        const s = status.status as string

        if (s === 'COMPLETED') {
          completedCount++
          const result = await fal.queue.result(MODEL, { requestId }) as {
            images?: Array<{ url: string }>
            image?: { url: string }
          }
          const url = result?.images?.[0]?.url || result?.image?.url
          if (url) photos[style] = url
        } else if (s === 'FAILED') {
          completedCount++ // count as done even if failed
          console.error(`[preview/poll] Job ${requestId} (${style}) failed`)
        }
      } catch (err) {
        console.error(`[preview/poll] Error checking ${requestId}:`, err)
      }
    })
  )

  const done = completedCount === requestIds.length

  return NextResponse.json({ photos, done, completedCount, total: requestIds.length })
}
