'use client'

import { useState } from 'react'
import { PLANS } from '@/lib/pricing'
import { cn } from '@/lib/utils'

export function PricingSection() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="py-16 px-6 max-w-3xl mx-auto text-center scroll-mt-24">
      <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest mb-4">Transparent pricing</p>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Simple monthly plans
      </h2>
      <p className="text-zinc-400 text-base mb-6 max-w-xl mx-auto">
        No hidden fees. Cancel anytime from your dashboard. Your photos stay in your account as long as your subscription is active.
      </p>

      {/* Monthly / Yearly toggle */}
      <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 mb-10">
        <button
          onClick={() => setYearly(false)}
          className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all', !yearly ? 'bg-white text-black' : 'text-zinc-400 hover:text-zinc-200')}
        >
          Monthly
        </button>
        <button
          onClick={() => setYearly(true)}
          className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5', yearly ? 'bg-white text-black' : 'text-zinc-400 hover:text-zinc-200')}
        >
          Yearly
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', yearly ? 'bg-green-600 text-white' : 'bg-green-500/15 text-green-400')}>
            −50%
          </span>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-left">
        {PLANS.map((plan) => {
          const price = yearly ? Math.round(plan.yearly / 12) : plan.monthly
          return (
            <div key={plan.id} className={cn('rounded-2xl border p-5 flex flex-col gap-3', plan.popular ? 'border-blue-500/40 bg-blue-600/5' : 'border-white/8 bg-white/[0.02]')}>
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">{plan.name}</span>
                {plan.popular && <span className="text-blue-400 text-xs font-medium bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Most popular</span>}
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  €{price}<span className="text-zinc-500 text-sm font-normal">/mo</span>
                </div>
                {yearly && <p className="text-green-400 text-xs mt-0.5">€{plan.yearly} billed yearly</p>}
              </div>
              <ul className="space-y-1.5 text-zinc-400 text-sm">
                <li>• {plan.photos}</li>
                <li>• {plan.popular || plan.id === 'elite' ? 'All 40 templates' : '2 style presets'}</li>
                <li>• {plan.popular || plan.id === 'elite' ? '~30 min priority' : '~60 min delivery'}</li>
              </ul>
            </div>
          )
        })}
      </div>
      <p className="text-zinc-600 text-xs mt-6 italic">
        Free preview before payment · No credit card to start · Cancel anytime
      </p>
    </section>
  )
}
