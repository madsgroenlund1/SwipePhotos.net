import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { getDbUser } from '@/lib/auth'
import { sendCancellationEmail } from '@/lib/resend'

function periodEnd(sub: import('stripe').Stripe.Subscription): number {
  return sub.items.data[0]?.current_period_end ?? 0
}

export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reason } = await req.json().catch(() => ({}))

    const admin = createAdminClientDirect()
    const { data: userRow } = await admin
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id, retention_offer_type')
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

    // The retention offer ("keep your subscription and get 1 month free")
    // is conditional on actually staying subscribed. A customer who takes
    // the free month and then cancels anyway forfeits it immediately —
    // access ends now, not at the end of the (free) billing period.
    const usedRetentionOffer = userRow.retention_offer_type === 'free_month'

    const updated = usedRetentionOffer
      ? await stripe.subscriptions.cancel(sub.id)
      : await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true })

    await admin.from('users').update({
      stripe_subscription_id: usedRetentionOffer ? null : sub.id,
    }).eq('id', user.id)

    const end = usedRetentionOffer ? Math.floor(Date.now() / 1000) : periodEnd(updated)
    const email = user.email ?? ''
    if (email) {
      await sendCancellationEmail(email, {
        periodEnd: new Date(end * 1000),
        reason: reason || null,
        immediate: usedRetentionOffer,
      }).catch(e => console.error('[cancel] email error:', e))
    }

    console.log(`[cancel] User ${user.id} sub ${sub.id} ${usedRetentionOffer ? 'CANCELLED IMMEDIATELY (forfeited retention offer)' : 'cancel_at_period_end'}. Reason: ${reason}`)
    return NextResponse.json({ ok: true, periodEnd: end, immediate: usedRetentionOffer })
  } catch (err) {
    console.error('[cancel-subscription]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
