import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardClient } from './DashboardClient'
import { stripe } from '@/lib/stripe'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { ensureUsernameRefCode } from '@/lib/referral'
import { getDbUser } from '@/lib/auth'
import { PLANS } from '@/lib/pricing'

export default async function DashboardPage() {
  const user = await getDbUser()

  if (!user) redirect('/auth/signin')

  const supabase = createAdminClientDirect()

  const [{ data: ordersByUserId }, { data: userRow }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, generated_photos(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('users').select('referral_code, stripe_customer_id, retention_offer_accepted_at').eq('id', user.id).single(),
  ])

  // Also fetch orders matched by email (for users who paid without being logged in)
  let ordersByEmail: typeof ordersByUserId = []
  if (user.email) {
    const { data } = await supabase
      .from('orders')
      .select('*, generated_photos(*)')
      .eq('email', user.email)
      .is('user_id', null)
      .order('created_at', { ascending: false })
    ordersByEmail = data || []
    if (ordersByEmail.length > 0) {
      await supabase.from('orders').update({ user_id: user.id }).eq('email', user.email).is('user_id', null)
    }
  }

  const allOrders = [...(ordersByUserId || []), ...ordersByEmail]
  const seen = new Set<string>()
  const deduped = allOrders.filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true })

  // A 'pending' order only ever gets a stripe_session_id once the webhook
  // confirms payment (at which point status also moves past 'pending') — so
  // any order still 'pending' after a few minutes was abandoned before
  // checkout completed and will never resolve. Hide these from the customer
  // instead of showing a permanently stuck "Pending" order. A brand new
  // pending order (within the webhook's normal processing window) still
  // shows, so the real "confirming payment" case is unaffected.
  const PENDING_GRACE_MS = 15 * 60 * 1000
  const orders = deduped.filter(o => {
    if (o.status !== 'pending') return true
    return Date.now() - new Date(o.created_at).getTime() < PENDING_GRACE_MS
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

  // Subscription status from Stripe
  let subscriptionCancelledAtPeriodEnd = false
  let hasActiveSubscription = false
  let subscriptionPeriodEnd: number | null = null
  let subscriptionPeriodStart: number | null = null
  let subscriptionInterval: 'month' | 'year' = 'month'
  let photoQuota = 0
  if (userRow?.stripe_customer_id) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: userRow.stripe_customer_id,
        status: 'active',
        limit: 1,
      })
      if (subs.data.length > 0) {
        const sub = subs.data[0]
        hasActiveSubscription = true
        subscriptionCancelledAtPeriodEnd = sub.cancel_at_period_end
        subscriptionPeriodEnd = sub.items.data[0]?.current_period_end ?? null
        subscriptionPeriodStart = sub.items.data[0]?.current_period_start ?? null
        subscriptionInterval = (sub.items.data[0]?.plan?.interval ?? 'month') as 'month' | 'year'
        const priceId = sub.items.data[0]?.price?.id
        photoQuota = PLANS.find(p => p.monthlyPriceId === priceId || p.yearlyPriceId === priceId)?.photoQuota ?? 0
      }
    } catch { /* ignore */ }
  }

  // Retention offer status (field already loaded via userRow above)
  const retentionOfferUsed = !!userRow?.retention_offer_accepted_at

  // Photos generated within the current billing cycle (for the Usage card).
  const photosUsedThisCycle = subscriptionPeriodStart
    ? orders
        .filter(o => new Date(o.created_at).getTime() >= subscriptionPeriodStart * 1000)
        .reduce((sum, o) => sum + (o.generated_photos?.length ?? 0), 0)
    : 0

  // Invoice history for the Invoices card.
  type InvoiceRow = {
    id: string; created: number; amountCents: number; currency: string
    status: string; hostedUrl: string | null; pdfUrl: string | null; description: string
  }
  let invoices: InvoiceRow[] = []
  if (userRow?.stripe_customer_id) {
    try {
      const list = await stripe.invoices.list({ customer: userRow.stripe_customer_id, limit: 24 })
      invoices = list.data.map(inv => ({
        id: inv.id ?? '',
        created: inv.created,
        amountCents: inv.amount_paid || inv.amount_due,
        currency: inv.currency,
        status: inv.status ?? 'open',
        hostedUrl: inv.hosted_invoice_url ?? null,
        pdfUrl: inv.invoice_pdf ?? null,
        description: inv.lines.data[0]?.description ?? 'Subscription',
      }))
    } catch { /* ignore */ }
  }

  // Full affiliate data
  type Payout = { id: string; amount_cents: number; status: string; created_at: string; paid_at: string | null }
  type AffiliateData = {
    id: string
    status: string
    refCode: string | null
    refLink: string | null
    clicks: number
    signups: number
    conversions: number
    pendingCents: number
    approvedCents: number
    paidCents: number
    totalEarnedCents: number
    payouts: Payout[]
  } | null

  let affiliateData: AffiliateData = null

  const { data: affRow } = await supabase
    .from('affiliates')
    .select('id, status, clicks, signups, conversions, earnings_cents')
    .eq('user_id', user.id)
    .maybeSingle()

  if (affRow) {
    const [{ data: commRows }, { data: payoutRows }] = await Promise.all([
      supabase
        .from('commissions')
        .select('status, commission_cents')
        .eq('affiliate_id', affRow.id),
      supabase
        .from('payouts')
        .select('id, amount_cents, status, created_at, paid_at')
        .eq('affiliate_id', affRow.id)
        .order('created_at', { ascending: false }),
    ])

    const pendingCents  = commRows?.filter(c => c.status === 'pending')  .reduce((s, c) => s + c.commission_cents, 0) ?? 0
    const approvedCents = commRows?.filter(c => c.status === 'approved') .reduce((s, c) => s + c.commission_cents, 0) ?? 0
    const paidCents     = commRows?.filter(c => c.status === 'paid')     .reduce((s, c) => s + c.commission_cents, 0) ?? 0

    // Upgrade legacy random codes to the username-based format on load
    const refCode = await ensureUsernameRefCode(
      createAdminClientDirect(), user.id, user.email, userRow?.referral_code ?? null
    )

    affiliateData = {
      id: affRow.id,
      status: affRow.status,
      refCode,
      refLink: refCode ? `${appUrl}/${refCode}` : null,
      clicks: affRow.clicks ?? 0,
      signups: affRow.signups ?? 0,
      conversions: affRow.conversions ?? 0,
      pendingCents,
      approvedCents,
      paidCents,
      totalEarnedCents: affRow.earnings_cents ?? 0,
      payouts: (payoutRows ?? []) as Payout[],
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="border-b border-white/5 px-6 h-16 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center">
          <span className="text-white font-bold text-xl">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-xl">.net</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-sm hidden sm:block truncate max-w-[200px]">{user.email}</span>
          <Link href="/onboarding" className="bg-blue-600 hover:brightness-110 text-white text-sm font-medium px-4 py-2 rounded-full transition-all">
            New Order →
          </Link>
        </div>
      </nav>

      <DashboardClient
        orders={orders || []}
        userEmail={user.email ?? ''}
        initialCancelled={subscriptionCancelledAtPeriodEnd}
        hasActiveSubscription={hasActiveSubscription}
        subscriptionPeriodEnd={subscriptionPeriodEnd}
        subscriptionInterval={subscriptionInterval}
        retentionOfferUsed={retentionOfferUsed}
        affiliateData={affiliateData}
        photoQuota={photoQuota}
        photosUsedThisCycle={photosUsedThisCycle}
        invoices={invoices}
      />
    </div>
  )
}
