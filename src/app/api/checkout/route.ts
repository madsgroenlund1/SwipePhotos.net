import { NextRequest, NextResponse } from 'next/server'
import { stripe, PACKAGES, PackageId } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { packageId, email, presets } = await req.json()

    const pkg = PACKAGES[packageId as PackageId]
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 })

    const supabase = await createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Get or create Stripe customer
    let customerId: string | undefined
    if (email) {
      const { data: userRow } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('email', email)
        .single()

      if (userRow?.stripe_customer_id) {
        customerId = userRow.stripe_customer_id
      } else {
        const customer = await stripe.customers.create({ email })
        customerId = customer.id
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('email', email)
      }
    }

    // Create a pending order
    const { data: userRow2 } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    const { data: order } = await supabase
      .from('orders')
      .insert({
        user_id: userRow2?.id,
        package_type: packageId,
        status: 'pending',
        selected_presets: presets,
      })
      .select()
      .single()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `SwipePhotos ${pkg.name} Package`,
              description: pkg.features.join(' · '),
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: order?.id || '',
        packageId,
        email: email || '',
        presets: JSON.stringify(presets || []),
      },
      success_url: `${appUrl}/onboarding/processing?order_id=${order?.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/onboarding`,
      automatic_tax: { enabled: true },
    })

    return NextResponse.json({ url: session.url, orderId: order?.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
