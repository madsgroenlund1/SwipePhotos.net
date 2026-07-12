// Central pricing catalog — LIVE Stripe EUR prices (hardcoded on purpose:
// the Vercel env vars still hold legacy USD price IDs, and price IDs are
// public identifiers anyway).

export type Plan = {
  id: 'starter' | 'popular' | 'elite'
  name: string
  monthlyPriceId: string
  yearlyPriceId: string
  monthly: number   // EUR per month
  yearly: number    // EUR per year (50% off monthly×12)
  photos: string
  popular: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPriceId: 'price_1TsR0TAAcylJlPsfUEUKjlnu',
    yearlyPriceId:  'price_1TsR17AAcylJlPsfoC4zJjID',
    monthly: 29,
    yearly: 174,
    photos: '5 AI photos / month',
    popular: false,
  },
  {
    id: 'popular',
    name: 'Premium',
    monthlyPriceId: 'price_1TsR0TAAcylJlPsfWnfGJWYf',
    yearlyPriceId:  'price_1TsR18AAcylJlPsfxYtDgTcX',
    monthly: 49,
    yearly: 294,
    photos: '15 AI photos / month',
    popular: true,
  },
  {
    id: 'elite',
    name: 'Pro',
    monthlyPriceId: 'price_1TsPRoAAcylJlPsfIGxLMcL3',
    yearlyPriceId:  'price_1TsR18AAcylJlPsfQSqPnIWe',
    monthly: 74,
    yearly: 444,
    photos: '45 AI photos / month',
    popular: false,
  },
]
