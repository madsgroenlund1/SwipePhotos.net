import { createServerClient } from '@supabase/ssr'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type CookieEntry = { name: string; value: string; options: Record<string, unknown> }

function applyBufferedCookies(res: NextResponse, buf: CookieEntry[]) {
  for (const { name, value, options } of buf) {
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as 'magiclink' | 'email' | 'recovery' | null
  const next       = searchParams.get('next') ?? '/dashboard'

  // Buffer auth cookies so we can attach them to the final redirect response.
  // Using request.cookies + redirect.cookies is the correct SSR pattern —
  // cookies() from next/headers does NOT forward to NextResponse.redirect().
  const cookieBuffer: CookieEntry[] = []
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookies) { cookieBuffer.push(...cookies) },
      },
    }
  )

  let user = null
  let isGoogleOAuth = false

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[auth/callback] OAuth code exchange:', error ? `ERROR: ${error.message}` : 'OK', 'user:', data.user?.email)
    if (error) {
      const res = NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`)
      applyBufferedCookies(res, cookieBuffer)
      return res
    }
    user = data.user
    isGoogleOAuth = true
  } else if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })
    console.log('[auth/callback] OTP verify:', error ? `ERROR: ${error.message}` : 'OK', 'user:', data.user?.email)
    if (error) {
      const res = NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`)
      applyBufferedCookies(res, cookieBuffer)
      return res
    }
    user = data.user
  } else {
    console.log('[auth/callback] No code or token_hash. Params:', Object.fromEntries(searchParams.entries()))
  }

  if (user) {
    const admin = createAdminClientDirect()

    const { data: existingRow } = await admin.from('users').select('id').eq('id', user.id).maybeSingle()
    const isNewUser = !existingRow

    const { error: upsertErr } = await admin.from('users').upsert(
      { id: user.id, email: user.email },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    if (upsertErr) console.error('[auth/callback] users upsert error:', upsertErr.message)

    if (user.email) {
      await admin.from('orders').update({ user_id: user.id }).eq('email', user.email).is('user_id', null)
    }

    if (isGoogleOAuth && isNewUser) {
      const swRef = request.cookies.get('sw_ref')?.value
      if (swRef) {
        const { data: refUserRow } = await admin
          .from('users')
          .select('id')
          .eq('referral_code', swRef.toUpperCase())
          .maybeSingle()

        if (refUserRow?.id && refUserRow.id !== user.id) {
          const { data: affRow } = await admin
            .from('affiliates')
            .select('id')
            .eq('user_id', refUserRow.id)
            .eq('status', 'approved')
            .maybeSingle()

          if (affRow?.id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            void (admin as any).rpc('increment_affiliate_signups', { p_affiliate_id: affRow.id })
            console.log(`[auth/callback] Affiliate signup attributed: ${affRow.id} ← ${user.email} (Google OAuth)`)
          }
        }
      }
    }

    const res = NextResponse.redirect(`${origin}${next}`)
    applyBufferedCookies(res, cookieBuffer)
    return res
  }

  const res = NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`)
  applyBufferedCookies(res, cookieBuffer)
  return res
}
