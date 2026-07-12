'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function EarningsCalc() {
  const [sales, setSales] = useState(100)
  const earning = Math.round(sales * 39 * 0.3)
  const pct = ((sales - 10) / (10000 - 10)) * 100
  const yearly = earning * 12
  const label = earning < 500 ? 'Side income' : earning < 2000 ? 'Part-time income' : earning < 5000 ? 'Full-time income' : 'Life-changing income'
  const labelColor = earning < 500 ? 'text-zinc-400' : earning < 2000 ? 'text-blue-400' : earning < 5000 ? 'text-green-400' : 'text-yellow-400'

  return (
    <div className="relative overflow-hidden rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #0a0a0a 60%)' }}>
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, #3b82f6 0%, transparent 60%)' }} />
      <div className="relative p-6">
        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-5">Earnings calculator</p>

        {/* Big number */}
        <div className="text-center mb-6">
          <p className={`text-xs font-semibold mb-2 ${labelColor}`}>{label}</p>
          <div className="text-6xl font-black text-white tracking-tight leading-none mb-2">
            ${earning.toLocaleString('en-US')}
          </div>
          <p className="text-zinc-500 text-sm">per month · <span className="text-zinc-300 font-medium">${yearly.toLocaleString('en-US')}/yr</span></p>
        </div>

        {/* Slider */}
        <div>
          <div className="flex justify-between text-zinc-500 text-xs mb-3">
            <span>{sales.toLocaleString()} sales/month</span>
            <span>30% commission</span>
          </div>
          <input
            type="range" min={10} max={10000} step={10} value={sales}
            onChange={e => setSales(Number(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #3b82f6 ${pct}%, #1e293b ${pct}%)` }}
          />
          <div className="flex justify-between text-zinc-700 text-[10px] mt-2">
            <span>10</span><span>2,500</span><span>5,000</span><span>7,500</span><span>10,000</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AffiliatePage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedSlug, setSavedSlug] = useState('')
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    platform: '',
    handle: '',
    audienceSize: '',
    contentType: '',
  })

  // Load saved slug from localStorage on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const stored = localStorage.getItem('sw_affiliate_slug')
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedSlug(stored)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubmitted(true)
    }
  }, [])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  // Use saved slug if available, otherwise derive from handle field
  const slug = savedSlug || form.handle.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '') || 'yourusername'
  const refLink = `https://swipephotos.net/?ref=${slug}`

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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const newSlug = form.handle.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '')
      try { localStorage.setItem('sw_affiliate_slug', newSlug) } catch { /* incognito/Safari */ }
      setSavedSlug(newSlug)
      setSubmitted(true)
    } catch (err) {
      console.error('[affiliate] submit error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
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

        {/* Form or success — only render after mount to avoid SSR/localStorage hydration mismatch */}
        {!mounted ? (
          <div className="bg-[#111] border border-white/8 rounded-2xl p-6 h-48 animate-pulse" />
        ) : submitted ? (
          <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Application received!</h2>
            <p className="text-zinc-400 text-sm mb-4">
              We review applications within 24 hours. Your affiliate link:
            </p>
            <button
              onClick={() => { navigator.clipboard.writeText(refLink); }}
              className="w-full bg-[#0A0A0A] border border-blue-500/30 rounded-xl px-4 py-3 text-left group hover:border-blue-500/60 transition-colors"
            >
              <code className="text-blue-400 text-sm break-all">{refLink}</code>
              <span className="text-zinc-600 text-xs block mt-1 group-hover:text-zinc-400 transition-colors">Click to copy</span>
            </button>
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
                <label className="text-zinc-400 text-xs mb-1.5 block">Social media handle *</label>
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
            <li className="flex gap-2"><span className="text-zinc-600">•</span>&ldquo;The AI tool that generates photos that actually look like you&rdquo;</li>
          </ul>
          <p className="text-zinc-500 text-xs mb-1.5">Your link (after approval):</p>
          <code className="block bg-white/5 rounded-lg px-3 py-2 text-blue-400 text-xs">
            {refLink}
          </code>
        </div>
      </main>
    </div>
  )
}
