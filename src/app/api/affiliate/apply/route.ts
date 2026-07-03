import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, platform, handle, audienceSize, contentType } = body

    if (!name || !email || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const slug = (handle || name).replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '')
    const supabase = await createAdminClient()

    // Idempotent — if this email already applied, return success
    const { data: existing } = await supabase
      .from('affiliates')
      .select('id')
      .filter('metadata->>email', 'eq', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase.from('affiliates').insert({
      status: 'pending',
      metadata: { name, email, platform, handle, audienceSize, contentType, slug },
      clicks: 0,
      conversions: 0,
      earnings_cents: 0,
    })

    if (error) {
      console.error('[affiliate/apply] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[affiliate/apply] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
