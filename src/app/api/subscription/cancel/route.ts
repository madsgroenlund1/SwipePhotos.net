import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, createAdminClientDirect } from '@/lib/supabase/server'
import { sendCancellationEmail } from '@/lib/resend'

function periodEnd(sub: import('stripe').Stripe.Subscription): number {
  return sub.items.data[0]?.current_period_end ?? 0
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reason } = await req.json().catch(() => ({}))

    const admin = createAdminClientDirect()
    const { data: userRow } = await admin
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
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

    if (sub.cancel_at_period_end) {
      return NextResponse.json({ ok: true, periodEnd: periodEnd(sub), alreadyCancelled: true })
    }

    const updated = await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: true,
    })

    await admin.from('users').update({ stripe_subscription_id: sub.id }).eq('id', user.id)

    const end = periodEnd(updated)
    const email = user.email ?? ''
    if (email) {
      await sendCancellationEmail(email, {
        periodEnd: new Date(end * 1000),
        reason: reason || null,
      }).catch(e => console.error('[cancel] email error:', e))
    }

    console.log(`[cancel] User ${user.id} sub ${sub.id} cancel_at_period_end. Reason: ${reason}`)
    return NextResponse.json({ ok: true, periodEnd: end })
  } catch (err) {
    console.error('[cancel-subscription]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
