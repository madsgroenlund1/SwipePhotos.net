import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { createHash } from 'crypto'

// Redirect + click-tracking handler for short affiliate links: /r/CODE
// Sets the sw_ref attribution cookie (30-day, first-click wins) and
// increments the affiliate's click counter via RPC before redirecting.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

  const supabase = createAdminClientDirect()

  // Look up affiliate by users.referral_code
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
      // Hash the IP for privacy-safe deduplication — don't store raw IPs
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
      const ipHash = createHash('sha256').update(ip + code).digest('hex').slice(0, 16)
      const ua = req.headers.get('user-agent') ?? ''

      // Fire-and-forget — don't block the redirect
      void supabase.rpc('track_referral_click', {
        p_affiliate_id: affRow.id,
        p_ip_hash: ipHash,
        p_user_agent: ua.slice(0, 200),
      })
    }
  }

  const response = NextResponse.redirect(appUrl)

  // Set attribution cookie (first-click wins — don't overwrite if already set)
  if (!req.cookies.get('sw_ref')) {
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
