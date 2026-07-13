import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { getDbUser } from '@/lib/auth'

export async function POST(_req: NextRequest) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClientDirect()
    const { data: userRow } = await admin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!userRow?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: userRow.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (!subscriptions.data.length) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    const sub = subscriptions.data[0]

    await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: false,
    })

    console.log(`[reactivate] User ${user.id} reactivated subscription ${sub.id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[reactivate]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
