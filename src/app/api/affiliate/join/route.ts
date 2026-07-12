import { NextResponse } from 'next/server'
import { createClient, createAdminClientDirect } from '@/lib/supabase/server'
import { uniqueRefCode, ensureUsernameRefCode } from '@/lib/referral'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClientDirect()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

  // Check if already an affiliate
  const { data: existing } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Already joined — return current state, upgrading legacy random codes
    // (e.g. YGV36528) to the username-based format on the way.
    const { data: userRow } = await admin
      .from('users')
      .select('referral_code')
      .eq('id', user.id)
      .single()

    const code = await ensureUsernameRefCode(admin, user.id, user.email, userRow?.referral_code ?? null)

    return NextResponse.json({
      ok: true,
      status: existing.status,
      refCode: code,
      refLink: code ? `${appUrl}/${code}` : null,
    })
  }

  // Generate a username-based referral code and persist it on the user row
  const refCode = await uniqueRefCode(admin, user.email ?? `user${user.id.slice(0, 8)}@x`, user.id)
  await admin
    .from('users')
    .update({ referral_code: refCode })
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

  return NextResponse.json({
    ok: true,
    status: 'approved',
    refCode,
    refLink: `${appUrl}/${refCode}`,
  })
}
