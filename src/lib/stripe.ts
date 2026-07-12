import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
})

export const PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 2900,
    priceDisplay: '€29',
    photos: 5,
    presets: 2,
    delivery: '~60 min delivery',
    features: ['5 AI photos / month', '2 style presets', '~60 min delivery'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
  },
  popular: {
    id: 'popular',
    name: 'Premium',
    price: 4900,
    priceDisplay: '€49',
    photos: 15,
    presets: 8,
    delivery: '~30 min priority delivery',
    features: [
      '15 AI photos / month',
      'All 40 templates',
      '~30 min priority delivery',
      'Natural post-processing layer',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_POPULAR_PRICE_ID!,
  },
  elite: {
    id: 'elite',
    name: 'Pro',
    price: 7400,
    priceDisplay: '€74',
    photos: 45,
    presets: 8,
    delivery: '~30 min priority delivery',
    features: [
      '45 AI photos / month',
      'All 40 templates',
      '~30 min priority delivery',
      'Natural post-processing layer',
      'Affiliate dashboard access',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID!,
  },
} as const

export type PackageId = keyof typeof PACKAGES
