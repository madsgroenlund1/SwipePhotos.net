import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { generateReferralCode } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = createAdminClientDirect()

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

    // Track signup attribution via sw_ref cookie (passed from client via header)
    const swRef = req.cookies.get('sw_ref')?.value
    if (swRef && userId) {
      // Find the affiliate whose referral code matches — increment their signup counter
      const { data: refUserRow } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', swRef.toUpperCase())
        .maybeSingle()

      if (refUserRow?.id && refUserRow.id !== userId) {
        const { data: affRow } = await supabase
          .from('affiliates')
          .select('id')
          .eq('user_id', refUserRow.id)
          .eq('status', 'approved')
          .maybeSingle()

        if (affRow?.id) {
          void supabase.rpc('increment_affiliate_signups', { p_affiliate_id: affRow.id })
        }
      }
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
