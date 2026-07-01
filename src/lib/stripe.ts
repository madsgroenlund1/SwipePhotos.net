import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
})

export const PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 1900,
    priceDisplay: '$19',
    photos: 20,
    presets: 2,
    delivery: '~60 min delivery',
    features: ['20 AI photos', '2 style presets', '~60 min delivery'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
  },
  popular: {
    id: 'popular',
    name: 'Popular',
    price: 3900,
    priceDisplay: '$39',
    photos: 40,
    presets: 8,
    delivery: '~30 min priority delivery',
    features: [
      '40 AI photos',
      'All 8 style presets',
      '~30 min priority delivery',
      'Anti-AI detection layer',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_POPULAR_PRICE_ID!,
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    price: 7900,
    priceDisplay: '$79',
    photos: 80,
    presets: 8,
    delivery: '~30 min priority delivery',
    features: [
      '80 AI photos',
      'All presets',
      '~30 min priority delivery',
      'Anti-AI detection layer',
      'Affiliate dashboard access',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID!,
  },
} as const

export type PackageId = keyof typeof PACKAGES
