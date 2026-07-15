import { NextRequest, NextResponse } from 'next/server'
import { stripe, PACKAGES, PackageId } from '@/lib/stripe'
import type Stripe from 'stripe'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { getDbUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { packageId, priceId: customPriceId, email: clientEmail, presets, style, hasTattoos, selectedPreviewUrl } = await req.json()

    // Trust the server-verified Clerk session over whatever the client sent.
    // A real incident: prepareCheckout ran with an empty client-side email
    // (Clerk hadn't finished hydrating the user's email at that exact
    // render), so this route couldn't find/reuse the customer's existing
    // Stripe customer — Stripe then silently created a BRAND NEW customer
    // during checkout, leaving a duplicate, un-tracked, still-billing
    // subscription that our dashboard never knew existed. Falling back to
    // the authenticated session's own email closes that gap; only truly
    // signed-out guests fall through to the client-supplied email.
    const dbUser = await getDbUser().catch(() => null)
    const email = dbUser?.email || clientEmail
    console.log('[checkout] packageId:', packageId, 'email:', email, dbUser ? '(server-verified)' : '(client-supplied)')

    // Allow custom priceId (for yearly billing), fall back to PACKAGES lookup
    const pkg = PACKAGES[packageId as PackageId]
    const resolvedPriceId = customPriceId || pkg?.priceId
    if (!resolvedPriceId) {
      console.error('[checkout] Invalid package:', packageId, 'Valid:', Object.keys(PACKAGES))
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    const supabase = createAdminClientDirect()
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
          // Verify customer exists in live mode — could be a stale test-mode ID
          try {
            await stripe.customers.retrieve(userRow.stripe_customer_id)
            customerId = userRow.stripe_customer_id
          } catch {
            // Test-mode customer — create new live customer and overwrite
            const customer = await stripe.customers.create({ email })
            customerId = customer.id
            await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId)
          }
        } else {
          const customer = await stripe.customers.create({ email })
          customerId = customer.id
          await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId)
        }
      }
    }

    // Read affiliate referral code from cookie (set by middleware on ?ref=CODE visits)
    const referredByCode = req.cookies.get('sw_ref')?.value || null

    // Create a pending order (user_id may be null for new users)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId || null,
        package_type: packageId,
        status: 'pending',
        selected_presets: [
          ...(style ? [style] : (presets || [])),
          ...(hasTattoos ? ['has_tattoos'] : []),
        ],
        email: email || null,
        referred_by_code: referredByCode,
        ...(selectedPreviewUrl ? { selected_preview_url: selectedPreviewUrl } : {}),
      })
      .select()
      .single()

    if (orderError || !order?.id) {
      console.error('[checkout] Order insert error:', orderError)
      return NextResponse.json({ error: 'Could not create order. Please try again.' }, { status: 500 })
    }

    // Only card, MobilePay and Link — no Satispay etc.
    // PayPal is NOT supported by Stripe in `subscription` mode (all our
    // packages are subscriptions), so it's excluded entirely rather than
    // relying on the retry-fallback below.
    // Methods not yet activated in the Stripe dashboard are dropped one by
    // one so checkout keeps working while they're pending activation.
    const wantedMethods = ['card', 'mobilepay', 'link']

    const createSession = (methods: string[]) => stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: methods as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      // The site itself is English-only — 'auto' let Stripe guess the
      // customer's browser locale, which then carries over to their
      // invoices (e.g. a Danish browser produced a Danish-language invoice
      // for an all-English product). Force English everywhere instead.
      locale: 'en',
      customer: customerId,
      customer_email: customerId ? undefined : (email || undefined),
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
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

    let session: Stripe.Checkout.Session | null = null
    const methods = [...wantedMethods]
    while (methods.length > 0) {
      try {
        session = await createSession(methods)
        break
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        const bad = methods.find(m => msg.includes(`: ${m} is invalid`) || msg.includes(`'${m}'`) || msg.includes(`\`${m}\``))
        if (bad && methods.length > 1) {
          console.warn(`[checkout] Payment method '${bad}' not activated — retrying without it`)
          methods.splice(methods.indexOf(bad), 1)
        } else {
          throw e
        }
      }
    }
    if (!session) throw new Error('Could not create checkout session')

    console.log('[checkout] Session created:', session.id, 'methods:', methods.join(','))
    return NextResponse.json({ url: session.url, orderId: order?.id })
  } catch (err) {
    console.error('[checkout] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
