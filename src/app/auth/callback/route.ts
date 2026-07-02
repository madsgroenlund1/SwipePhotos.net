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
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    user = data.user
  } else if (token_hash && type) {
    // Magic link / email OTP flow
    const { data } = await supabase.auth.verifyOtp({ token_hash, type })
    user = data.user
  }

  // Ensure a row exists in the users table
  if (user) {
    const admin = await createAdminClient()
    await admin.from('users').upsert(
      { id: user.id, email: user.email },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  }

  return NextResponse.redirect(`${origin}${next}`)
}
