import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

export async function GET(req: NextRequest) {
  try {
    const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean) || []
    if (!ids.length) return NextResponse.json({ error: 'No IDs' }, { status: 400 })

    const predictions = await Promise.all(ids.map(id => replicate.predictions.get(id)))

    const done = predictions.every(p => p.status === 'succeeded' || p.status === 'failed')
    const succeeded = predictions.filter(p => p.status === 'succeeded').length
    const progress = Math.round((succeeded / predictions.length) * 100)

    const urls = predictions
      .filter(p => p.status === 'succeeded')
      .map(p => (Array.isArray(p.output) ? p.output[0] : p.output))
      .filter(Boolean) as string[]

    return NextResponse.json({ done, progress, urls })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 })
  }
}
