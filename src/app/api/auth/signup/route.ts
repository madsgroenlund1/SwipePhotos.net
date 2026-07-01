import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateReferralCode } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Create or fetch user via magic link
    const { data: authData } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    if (!authData.user) {
      // User might already exist — look them up
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
      if (!existing) return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    const userId = authData.user?.id

    if (userId) {
      // Upsert user row
      await supabase.from('users').upsert({
        id: userId,
        email,
        referral_code: generateReferralCode(),
      })
    }

    // Create a pending order
    const { data: order } = await supabase
      .from('orders')
      .insert({ user_id: userId, package_type: 'pending', status: 'draft' })
      .select()
      .single()

    return NextResponse.json({ orderId: order?.id, userId })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
