'use client'

import { useState } from 'react'
import Link from 'next/link'

function EarningsCalc() {
  const [sales, setSales] = useState(100)
  const earning = Math.round(sales * 39 * 0.3)
  const pct = ((sales - 10) / (10000 - 10)) * 100
  const tiers = [
    { label: 'Side hustle', sales: 50, emoji: '☕' },
    { label: 'Part-time', sales: 200, emoji: '💸' },
    { label: 'Full-time', sales: 600, emoji: '🚀' },
  ]
  return (
    <div className="bg-gradient-to-br from-blue-600/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-6">
      <p className="text-blue-400 text-xs font-semibold uppercase tracking-wide mb-1">Earnings calculator</p>
      <p className="text-white text-sm mb-4">Drag to see your potential monthly income</p>

      {/* Slider */}
      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <span className="text-zinc-400 text-xs">{sales.toLocaleString()} sales/month</span>
          <span className="text-2xl font-bold text-white">${earning.toLocaleString()}<span className="text-zinc-400 text-sm font-normal">/mo</span></span>
        </div>
        <input
          type="range" min={10} max={10000} step={10} value={sales}
          onChange={e => setSales(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #3b82f6 ${pct}%, #27272a ${pct}%)` }}
        />
        <div className="flex justify-between text-zinc-600 text-[10px] mt-1">
          <span>10</span><span>2,500</span><span>5,000</span><span>7,500</span><span>10,000</span>
        </div>
      </div>

      {/* Quick tiers */}
      <div className="grid grid-cols-3 gap-2">
        {tiers.map(t => (
          <button
            key={t.label}
            onClick={() => setSales(t.sales)}
            className={`rounded-xl p-2.5 text-center transition-all border ${sales === t.sales ? 'border-blue-500 bg-blue-500/10' : 'border-white/8 bg-white/3 hover:border-white/20'}`}
          >
            <div className="text-base mb-0.5">{t.emoji}</div>
            <div className="text-white text-xs font-semibold">${Math.round(t.sales * 39 * 0.3).toLocaleString()}/mo</div>
            <div className="text-zinc-500 text-[10px]">{t.label}</div>
          </button>
        ))}
      </div>

      <p className="text-zinc-600 text-[10px] mt-3 text-center">Based on avg $39 sale × 30% commission</p>
    </div>
  )
}

export default function AffiliatePage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    platform: '',
    handle: '',
    audienceSize: '',
    contentType: '',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  // Generate slug from handle: @JohnDoe → johndoe
  const slug = form.handle.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '') || 'DITBRUGERNAVN'
  const refLink = `https://swipephotos.net/${slug}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="border-b border-white/5 px-6 h-14 flex items-center max-w-4xl mx-auto">
        <Link href="/" className="flex items-center">
          <span className="text-white font-bold text-lg">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-lg">.net</span>
        </Link>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5 mb-5">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <span className="text-green-400 text-xs font-semibold uppercase tracking-wide">Affiliate Program</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Earn 30% on every sale</h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
            Share your link. Get paid. Join dating coaches and creators already earning with SwipePhotos.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { value: '30%', label: 'Commission' },
            { value: '$39', label: 'Avg sale' },
            { value: '$50', label: 'Min payout' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#111] border border-white/8 rounded-2xl p-4 text-center">
              <div className="text-xl font-bold text-white mb-0.5">{value}</div>
              <div className="text-zinc-500 text-xs">{label}</div>
            </div>
          ))}
        </div>

        {/* Earnings calculator */}
        <EarningsCalc />

        {/* How it works */}
        <div className="bg-[#111] border border-white/8 rounded-2xl p-5 mb-6">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-3">How it works</p>
          <div className="space-y-3">
            {[
              ['Share your link', 'Post it anywhere — TikTok, Instagram, YouTube, Reddit'],
              ['Someone buys', 'They purchase any SwipePhotos subscription'],
              ['You get paid', '30% sent monthly via PayPal or bank transfer'],
            ].map(([title, desc], i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                <div>
                  <p className="text-white text-sm font-medium">{title}</p>
                  <p className="text-zinc-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form or success */}
        {submitted ? (
          <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Application received!</h2>
            <p className="text-zinc-400 text-sm">
              Vi godkender inden for 24 timer. Dit affiliate-link bliver:<br />
              <code className="text-blue-400 text-sm mt-2 block">{refLink}</code>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#111] border border-white/8 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white mb-1">Apply now</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Full name *</label>
                <input
                  type="text" value={form.name} onChange={set('name')} placeholder="John Doe"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Email *</label>
                <input
                  type="email" value={form.email} onChange={set('email')} placeholder="you@email.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Platform *</label>
                <input
                  type="text" value={form.platform} onChange={set('platform')} placeholder="TikTok, YouTube..."
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Handle *</label>
                <input
                  type="text" value={form.handle} onChange={set('handle')} placeholder="@yourhandle"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Audience size *</label>
                <input
                  type="text" value={form.audienceSize} onChange={set('audienceSize')} placeholder="10k, 50k..."
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Content type *</label>
                <select
                  value={form.contentType} onChange={set('contentType')} required
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Select...</option>
                  <option value="dating-advice">Dating advice</option>
                  <option value="self-improvement">Self improvement</option>
                  <option value="ai-tech">AI / Tech</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:brightness-110 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all text-sm"
            >
              {loading ? 'Submitting...' : 'Submit Application →'}
            </button>
          </form>
        )}

        {/* Marketing kit */}
        <div className="mt-6 bg-[#111] border border-white/8 rounded-2xl p-5">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-3">Marketing Kit</p>
          <p className="text-zinc-500 text-xs mb-2">Hook examples that convert:</p>
          <ul className="space-y-1.5 text-xs text-zinc-400 mb-4">
            <li className="flex gap-2"><span className="text-zinc-600">•</span>&ldquo;POV: you upload selfies and get photos that look like a pro took them&rdquo;</li>
            <li className="flex gap-2"><span className="text-zinc-600">•</span>&ldquo;How I went from 2 matches a week to 20+ with one simple change&rdquo;</li>
            <li className="flex gap-2"><span className="text-zinc-600">•</span>&ldquo;The AI tool that passes every AI detector (I tested it myself)&rdquo;</li>
          </ul>
          <p className="text-zinc-500 text-xs mb-1.5">Dit link (efter godkendelse):</p>
          <code className="block bg-white/5 rounded-lg px-3 py-2 text-blue-400 text-xs">
            {refLink}
          </code>
        </div>
      </main>
    </div>
  )
}
