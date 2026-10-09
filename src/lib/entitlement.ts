import { stripe } from '@/lib/stripe'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { PLANS } from '@/lib/pricing'
import { APPLE_PRODUCTS, type PlanId } from '@/lib/apple-iap'

// What the signed-in user is currently entitled to, regardless of whether they
// subscribed on the website (Stripe) or in the iOS app (Apple IAP).

export type Entitlement = {
  active: boolean
  source: 'apple' | 'stripe' | null
  planId: PlanId | null
  planName: string | null
  photoQuota: number
  interval: 'month' | 'year' | null
  periodStart: string | null
  periodEnd: string | null
  /** false when the subscription is cancelled / auto-renew is switched off */
  willRenew: boolean
  /** The user may start a new photo set right now (one set per monthly window). */
  canStartSet: boolean
  nextSetAvailableAt: string | null
}

const NONE: Entitlement = {
  active: false, source: null, planId: null, planName: null, photoQuota: 0, interval: null,
  periodStart: null, periodEnd: null, willRenew: false, canStartSet: false, nextSetAvailableAt: null,
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000

type Candidate = {
  source: 'apple' | 'stripe'
  planId: PlanId
  interval: 'month' | 'year'
  start: Date
  end: Date
  willRenew: boolean
}

function subtractInterval(end: Date, interval: 'month' | 'year'): Date {
  const d = new Date(end)
  if (interval === 'month') d.setUTCMonth(d.getUTCMonth() - 1)
  else d.setUTCFullYear(d.getUTCFullYear() - 1)
  return d
}

export async function getEntitlement(userId: string): Promise<Entitlement> {
  const admin = createAdminClientDirect()
  const { data: u } = await admin
    .from('users')
    .select('stripe_customer_id, apple_product_id, apple_expires_at, apple_auto_renew')
    .eq('id', userId)
    .maybeSingle()
  if (!u) return NONE

  const candidates: Candidate[] = []

  // Apple
  if (u.apple_product_id && u.apple_expires_at && new Date(u.apple_expires_at) > new Date()) {
    const product = APPLE_PRODUCTS[u.apple_product_id]
    if (product) {
      const end = new Date(u.apple_expires_at)
      candidates.push({
        source: 'apple', planId: product.planId, interval: product.interval,
        start: subtractInterval(end, product.interval), end, willRenew: u.apple_auto_renew !== false,
      })
    }
  }

  // Stripe (website subscribers who log into the app)
  if (u.stripe_customer_id) {
    try {
      const subs = await stripe.subscriptions.list({ customer: u.stripe_customer_id, status: 'active', limit: 1 })
      const sub = subs.data[0]
      const item = sub?.items.data[0]
      const priceId = item?.price?.id
      const plan = PLANS.find(p => p.monthlyPriceId === priceId || p.yearlyPriceId === priceId)
      if (sub && item && plan) {
        candidates.push({
          source: 'stripe', planId: plan.id,
          interval: (item.plan?.interval ?? 'month') as 'month' | 'year',
          start: new Date(item.current_period_start * 1000),
          end: new Date(item.current_period_end * 1000),
          willRenew: !sub.cancel_at_period_end,
        })
      }
    } catch (e) {
      console.warn('[entitlement] Stripe lookup failed:', e)
    }
  }

  if (!candidates.length) return NONE
  // Prefer the bigger plan, then the later expiry.
  const quotaOf = (c: Candidate) => PLANS.find(p => p.id === c.planId)?.photoQuota ?? 0
  candidates.sort((a, b) => quotaOf(b) - quotaOf(a) || b.end.getTime() - a.end.getTime())
  const best = candidates[0]
  const plan = PLANS.find(p => p.id === best.planId)!

  // One photo set per window: the whole period for monthly plans, 30-day
  // slices for yearly plans (their quota is "per month").
  const now = Date.now()
  const periodMs = best.end.getTime() - best.start.getTime()
  const windowMs = best.interval === 'month' ? periodMs : MONTH_MS
  const elapsed = Math.max(0, now - best.start.getTime())
  const windowStart = best.start.getTime() + Math.floor(elapsed / windowMs) * windowMs
  const windowEnd = Math.min(windowStart + windowMs, best.end.getTime())

  const { count } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['processing', 'generating', 'ready'])
    .gte('created_at', new Date(windowStart).toISOString())
  const used = (count ?? 0) > 0

  return {
    active: true,
    source: best.source,
    planId: best.planId,
    planName: plan.name,
    photoQuota: plan.photoQuota,
    interval: best.interval,
    periodStart: best.start.toISOString(),
    periodEnd: best.end.toISOString(),
    willRenew: best.willRenew,
    canStartSet: !used,
    nextSetAvailableAt: used ? new Date(windowEnd).toISOString() : null,
  }
}
