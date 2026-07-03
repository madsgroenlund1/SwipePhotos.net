import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, createAdminClientDirect } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClientDirect()
    const { data: userRow } = await admin.from('users').select('stripe_customer_id').eq('id', user.id).single()

    if (!userRow?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Find active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: userRow.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (!subscriptions.data.length) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Cancel at period end (so they keep access until billing cycle ends)
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cancel-subscription]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
