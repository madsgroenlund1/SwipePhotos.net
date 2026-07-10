import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardClient } from './DashboardClient'
import { stripe } from '@/lib/stripe'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  const [{ data: ordersByUserId }, { data: userRow }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, generated_photos(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('users').select('referral_code, stripe_customer_id').eq('id', user.id).single(),
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
  const orders = allOrders.filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

  // Subscription status from Stripe
  let subscriptionCancelledAtPeriodEnd = false
  let hasActiveSubscription = false
  if (userRow?.stripe_customer_id) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: userRow.stripe_customer_id,
        status: 'active',
        limit: 1,
      })
      if (subs.data.length > 0) {
        hasActiveSubscription = true
        subscriptionCancelledAtPeriodEnd = subs.data[0].cancel_at_period_end
      }
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

    const refCode = userRow?.referral_code ?? null

    affiliateData = {
      id: affRow.id,
      status: affRow.status,
      refCode,
      refLink: refCode ? `${appUrl}/r/${refCode}` : null,
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
        affiliateData={affiliateData}
      />
    </div>
  )
}
