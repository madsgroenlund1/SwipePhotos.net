'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function AffiliatePage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    platform: '',
    handle: '',
    audienceSize: '',
    contentType: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSubmitted(true)
    } catch {}
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="border-b border-white/5 px-6 h-16 flex items-center max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-0">
          <span className="text-white font-bold text-xl">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-xl">.net</span>
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
            <span className="text-green-400 text-sm font-medium">30% commission per sale</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Become a SwipePhotos Affiliate</h1>
          <p className="text-zinc-400 text-lg">
            Earn 30% on every sale you refer. Payout at $50 minimum. Join dating coaches and
            influencers already making money with SwipePhotos.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Commission', value: '30%' },
            { label: 'Avg order value', value: '$39' },
            { label: 'Min payout', value: '$50' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{value}</div>
              <div className="text-zinc-500 text-sm">{label}</div>
            </div>
          ))}
        </div>

        {submitted ? (
          <div className="text-center bg-green-500/10 border border-green-500/20 rounded-2xl p-12">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Application submitted!</h2>
            <p className="text-zinc-400">
              We review applications within 24 hours. You&apos;ll receive an email with your affiliate link once approved.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#111] border border-white/8 rounded-2xl p-8 space-y-5">
            <h2 className="text-xl font-semibold text-white mb-2">Apply to become an affiliate</h2>

            {[
              { key: 'name', label: 'Full Name', placeholder: 'John Doe', type: 'text' },
              { key: 'platform', label: 'Primary Platform', placeholder: 'YouTube, TikTok, Instagram...', type: 'text' },
              { key: 'handle', label: 'Handle / Channel', placeholder: '@yourhandle', type: 'text' },
              { key: 'audienceSize', label: 'Audience Size', placeholder: '10k, 50k, 500k...', type: 'text' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-zinc-400 text-sm mb-2">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-zinc-400 text-sm mb-2">Content Type</label>
              <select
                value={form.contentType}
                onChange={(e) => setForm(prev => ({ ...prev, contentType: e.target.value }))}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="" className="bg-zinc-900">Select content type...</option>
                <option value="dating-advice" className="bg-zinc-900">Dating advice / coaching</option>
                <option value="self-improvement" className="bg-zinc-900">Self improvement / men&apos;s lifestyle</option>
                <option value="ai-tech" className="bg-zinc-900">AI / technology</option>
                <option value="lifestyle" className="bg-zinc-900">General lifestyle</option>
                <option value="other" className="bg-zinc-900">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-full transition-all"
            >
              {loading ? 'Submitting...' : 'Submit Application →'}
            </button>
          </form>
        )}

        {/* Marketing kit */}
        <div className="mt-12 bg-white/3 border border-white/8 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Marketing Kit</h3>
          <div className="space-y-3 text-sm text-zinc-400">
            <p className="font-medium text-zinc-300">Hook examples:</p>
            <ul className="space-y-2 ml-4">
              <li>• &ldquo;POV: you upload selfies and get back photos that look like a professional took them&rdquo;</li>
              <li>• &ldquo;How I went from 2 matches a week to 20+ with one simple change&rdquo;</li>
              <li>• &ldquo;The AI tool that passes every AI detector (tested it myself)&rdquo;</li>
            </ul>
            <p className="font-medium text-zinc-300 mt-4">Your link format:</p>
            <code className="block bg-white/5 rounded-lg px-3 py-2 text-blue-400">
              https://swipephotos.net/?ref=YOURCODE
            </code>
          </div>
        </div>
      </main>
    </div>
  )
}
