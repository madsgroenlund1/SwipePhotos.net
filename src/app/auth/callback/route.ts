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

  if (code) {
    // Google OAuth / PKCE flow
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[auth/callback] OAuth code exchange:', error ? `ERROR: ${error.message}` : 'OK', 'user:', data.user?.email)
    user = data.user
  } else if (token_hash && type) {
    // Magic link / email OTP flow
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })
    console.log('[auth/callback] OTP verify:', error ? `ERROR: ${error.message}` : 'OK', 'user:', data.user?.email)
    user = data.user
  } else {
    console.log('[auth/callback] No code or token_hash. Params:', Object.fromEntries(searchParams.entries()))
  }

  // Ensure a row exists in the users table
  if (user) {
    const admin = await createAdminClient()
    await admin.from('users').upsert(
      { id: user.id, email: user.email },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    // Link any orders created by email (Google OAuth flow) to this user account
    if (user.email) {
      await admin.from('orders').update({ user_id: user.id }).eq('email', user.email).is('user_id', null)
    }
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Auth failed — redirect back to sign in with error
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`)
}
