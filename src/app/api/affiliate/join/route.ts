import { NextResponse } from 'next/server'
import { createClient, createAdminClientDirect } from '@/lib/supabase/server'
import { refCodeFromEmail } from '@/lib/utils'

type Admin = ReturnType<typeof createAdminClientDirect>

// Username-based code from the user's email, with a numeric suffix on clash:
// madsgroenlund1 → madsgroenlund1, madsgroenlund12, madsgroenlund13, …
async function uniqueRefCode(admin: Admin, email: string, ownUserId: string): Promise<string> {
  const base = refCodeFromEmail(email)
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}${i + 1}`
    const { data: clash } = await admin
      .from('users')
      .select('id')
      .ilike('referral_code', candidate)
      .maybeSingle()
    if (!clash || clash.id === ownUserId) return candidate
  }
  // Extremely unlikely — fall back to base + random digits
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`
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
    // Already joined — return current state, upgrading legacy random codes
    // (e.g. YGV36528) to the username-based format on the way.
    const { data: userRow } = await admin
      .from('users')
      .select('referral_code')
      .eq('id', user.id)
      .single()

    let code = userRow?.referral_code ?? null
    const desired = user.email ? await uniqueRefCode(admin, user.email, user.id) : null
    if (desired && code !== desired) {
      const { error: updErr } = await admin
        .from('users')
        .update({ referral_code: desired })
        .eq('id', user.id)
      if (!updErr) code = desired
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'
    return NextResponse.json({
      ok: true,
      status: existing.status,
      refCode: code,
      refLink: code ? `${appUrl}/r/${code}` : null,
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'
  return NextResponse.json({
    ok: true,
    status: 'approved',
    refCode,
    refLink: `${appUrl}/r/${refCode}`,
  })
}
