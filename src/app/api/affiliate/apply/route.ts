import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, platform, handle, audienceSize, contentType } = body

    const supabase = await createAdminClient()

    await supabase.from('affiliates').insert({
      status: 'pending',
      metadata: { name, platform, handle, audienceSize, contentType },
      clicks: 0,
      conversions: 0,
      earnings_cents: 0,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
