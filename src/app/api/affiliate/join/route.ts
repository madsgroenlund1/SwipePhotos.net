import { NextResponse } from 'next/server'
import { createClient, createAdminClientDirect } from '@/lib/supabase/server'

function generateRefCode(): string {
  // 8 uppercase alphanumeric chars, avoiding visually confusable 0/O/1/I
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClientDirect()

  // Check if already an affiliate
  const { data: existing } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Already joined — return current state
    const { data: userRow } = await admin
      .from('users')
      .select('referral_code')
      .eq('id', user.id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'
    return NextResponse.json({
      ok: true,
      status: existing.status,
      refCode: userRow?.referral_code,
      refLink: userRow?.referral_code
        ? `${appUrl}/r/${userRow.referral_code}`
        : null,
    })
  }

  // Generate a unique referral code
  let refCode: string
  let attempts = 0
  do {
    refCode = generateRefCode()
    const { data: clash } = await admin
      .from('users')
      .select('id')
      .eq('referral_code', refCode)
      .maybeSingle()
    if (!clash) break
  } while (++attempts < 10)

  // Persist referral code on user row
  await admin
    .from('users')
    .update({ referral_code: refCode! })
    .eq('id', user.id)

  // Create affiliate row — auto-approved for self-service signups
  const { error } = await admin.from('affiliates').insert({
    user_id: user.id,
    status: 'approved',
    clicks: 0,
    signups: 0,
    conversions: 0,
    earnings_cents: 0,
    metadata: { email: user.email, joined_at: new Date().toISOString() },
  })

  if (error) {
    console.error('[affiliate/join] DB error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'
  return NextResponse.json({
    ok: true,
    status: 'approved',
    refCode: refCode!,
    refLink: `${appUrl}/r/${refCode!}`,
  })
}
