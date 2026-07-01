import { NextRequest, NextResponse } from 'next/server'
import { stripe, PACKAGES, PackageId } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { packageId, email, presets } = await req.json()
    console.log('[checkout] packageId:', packageId, 'email:', email)

    const pkg = PACKAGES[packageId as PackageId]
    if (!pkg) {
      console.error('[checkout] Invalid package:', packageId, 'Valid:', Object.keys(PACKAGES))
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

    // Look up existing user (optional — new users won't have an account yet)
    let customerId: string | undefined
    let userId: string | undefined

    if (email) {
      const { data: userRow } = await supabase
        .from('users')
        .select('id, stripe_customer_id')
        .eq('email', email)
        .single()

      if (userRow) {
        userId = userRow.id
        if (userRow.stripe_customer_id) {
          customerId = userRow.stripe_customer_id
        } else {
          const customer = await stripe.customers.create({ email })
          customerId = customer.id
          await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId)
        }
      }
    }

    // Create a pending order (user_id may be null for new users)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId || null,
        package_type: packageId,
        status: 'pending',
        selected_presets: presets || [],
        email: email || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('[checkout] Order insert error:', orderError)
      // Continue anyway — we'll match by session later
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      customer_email: customerId ? undefined : (email || undefined),
      line_items: [{ price: pkg.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          orderId: order?.id || '',
          packageId,
          email: email || '',
        },
      },
      metadata: {
        orderId: order?.id || '',
        packageId,
        email: email || '',
        presets: JSON.stringify(presets || []),
      },
      success_url: `${appUrl}/onboarding/processing?order_id=${order?.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/onboarding`,
    })

    console.log('[checkout] Session created:', session.id, 'url:', session.url?.slice(0, 60))
    return NextResponse.json({ url: session.url, orderId: order?.id })
  } catch (err) {
    console.error('[checkout] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
