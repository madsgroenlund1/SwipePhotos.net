import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { getDbUser } from '@/lib/auth'
import { sendOfferAcceptedEmail } from '@/lib/resend'

export async function POST(_req: NextRequest) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClientDirect()
    const { data: userRow } = await admin
      .from('users')
      .select('stripe_customer_id, retention_offer_accepted_at')
      .eq('id', user.id)
      .single()

    if (!userRow?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Abuse prevention: only one retention offer per user ever
    if (userRow.retention_offer_accepted_at) {
      return NextResponse.json({ error: 'Offer already used' }, { status: 409 })
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
    const interval = (sub.items.data[0]?.plan?.interval ?? 'month') as 'month' | 'year'

    // Create a one-off coupon for this specific use
    let coupon: Awaited<ReturnType<typeof stripe.coupons.create>>
    let offerType: string

    if (interval === 'month') {
      coupon = await stripe.coupons.create({
        percent_off: 100,
        duration: 'once',
        name: 'Retention — 1 month free',
      })
      offerType = 'free_month'
    } else {
      coupon = await stripe.coupons.create({
        percent_off: 50,
        duration: 'once',
        name: 'Retention — 50% off next renewal',
      })
      offerType = 'half_off_renewal'
    }

    // Apply the coupon via discounts and undo any pending cancellation
    await stripe.subscriptions.update(sub.id, {
      discounts: [{ coupon: coupon.id }],
      cancel_at_period_end: false,
    })

    // Record in DB
    await admin.from('users').update({
      retention_offer_type: offerType,
      retention_offer_accepted_at: new Date().toISOString(),
      stripe_subscription_id: sub.id,
    }).eq('id', user.id)

    // Email
    const email = user.email ?? ''
    if (email) {
      await sendOfferAcceptedEmail(email, { offerType, interval }).catch(e =>
        console.error('[apply-offer] email error:', e)
      )
    }

    console.log(`[apply-offer] User ${user.id} accepted ${offerType} on sub ${sub.id}`)
    return NextResponse.json({ ok: true, offerType })
  } catch (err) {
    console.error('[apply-offer]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
