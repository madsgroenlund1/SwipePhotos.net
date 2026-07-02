import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    // Ensure a row exists in the users table
    if (user) {
      const admin = await createAdminClient()
      await admin.from('users').upsert(
        { id: user.id, email: user.email },
        { onConflict: 'id', ignoreDuplicates: true }
      )
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
