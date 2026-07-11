import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'magiclink' | 'email' | 'recovery' | null
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()
  let user = null
  let isGoogleOAuth = false

  if (code) {
    // Google OAuth / PKCE flow
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[auth/callback] OAuth code exchange:', error ? `ERROR: ${error.message}` : 'OK', 'user:', data.user?.email)
    if (error) return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`)
    user = data.user
    isGoogleOAuth = true
  } else if (token_hash && type) {
    // Magic link / email OTP flow
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })
    console.log('[auth/callback] OTP verify:', error ? `ERROR: ${error.message}` : 'OK', 'user:', data.user?.email)
    if (error) return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`)
    user = data.user
  } else {
    console.log('[auth/callback] No code or token_hash. Params:', Object.fromEntries(searchParams.entries()))
  }

  if (user) {
    const admin = await createAdminClient()

    // Check if this is a brand-new user (before upserting so we can tell if they existed)
    const { data: existingRow } = await admin.from('users').select('id').eq('id', user.id).maybeSingle()
    const isNewUser = !existingRow

    // Ensure a row exists in the users table
    const { error: upsertErr } = await admin.from('users').upsert(
      { id: user.id, email: user.email },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    if (upsertErr) {
      console.error('[auth/callback] users upsert error:', upsertErr.message)
    }

    // Link any orders created by email (Google OAuth flow) to this user account
    if (user.email) {
      await admin.from('orders').update({ user_id: user.id }).eq('email', user.email).is('user_id', null)
    }

    // Track affiliate signup attribution for Google OAuth new users.
    // Magic link signups are attributed in /api/auth/signup/route.ts instead.
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

    return NextResponse.redirect(`${origin}${next}`)
  }

  // Auth failed — redirect back to sign in with error
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`)
}
