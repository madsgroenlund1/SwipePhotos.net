import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { refCodeFromEmail } from '@/lib/utils'

type Admin = ReturnType<typeof createAdminClientDirect>

// Username-based code from the user's email, with a numeric suffix on clash:
// madsgroenlund1 → madsgroenlund1, madsgroenlund12, madsgroenlund13, …
export async function uniqueRefCode(admin: Admin, email: string, ownUserId: string): Promise<string> {
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
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`
}

/**
 * Make sure the user's referral code is the username-based one, upgrading
 * legacy random codes (e.g. YGV36528). Returns the (possibly new) code.
 */
export async function ensureUsernameRefCode(
  admin: Admin,
  userId: string,
  email: string | null | undefined,
  currentCode: string | null
): Promise<string | null> {
  if (!email) return currentCode
  const desired = await uniqueRefCode(admin, email, userId)
  if (currentCode === desired) return currentCode
  const { error } = await admin.from('users').update({ referral_code: desired }).eq('id', userId)
  return error ? currentCode : desired
}

/**
 * Shared handler for referral short links (/{code} and legacy /r/{code}).
 * Tracks the click and sets the 30-day first-click attribution cookie.
 */
export async function handleReferralRedirect(req: NextRequest, code: string): Promise<NextResponse> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'
  const supabase = createAdminClientDirect()

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .ilike('referral_code', code)
    .maybeSingle()

  if (userRow?.id) {
    const { data: affRow } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('user_id', userRow.id)
      .maybeSingle()

    if (affRow?.id && affRow.status === 'approved') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
      const ipHash = createHash('sha256').update(ip + code.toLowerCase()).digest('hex').slice(0, 16)
      const ua = req.headers.get('user-agent') ?? ''
      void supabase.rpc('track_referral_click', {
        p_affiliate_id: affRow.id,
        p_ip_hash: ipHash,
        p_user_agent: ua.slice(0, 200),
      })
    }
  }

  const response = NextResponse.redirect(appUrl)
  if (userRow?.id && !req.cookies.get('sw_ref')) {
    response.cookies.set('sw_ref', code.toLowerCase(), {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }
  return response
}

/** Was this code found at all? Used by the root catch-all to decide 404 vs redirect. */
export async function refCodeExists(code: string): Promise<boolean> {
  const { data } = await createAdminClientDirect()
    .from('users')
    .select('id')
    .ilike('referral_code', code)
    .maybeSingle()
  return !!data?.id
}
