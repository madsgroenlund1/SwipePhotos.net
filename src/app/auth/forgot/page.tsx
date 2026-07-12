'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')

  const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://swipephotos.net')

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/auth/reset`,
    })
    if (err) { setError(err.message); setLoading(false) }
    else setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center">
            <span className="text-white font-bold text-2xl tracking-tight">SwipePhotos</span>
            <span className="text-blue-500 font-bold text-2xl tracking-tight">.net</span>
          </Link>
        </div>

        <div className="bg-[#111] border border-white/8 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-white/6">
            <h1 className="text-xl font-semibold text-white mb-1">Forgot your password?</h1>
            <p className="text-zinc-500 text-sm">
              {sent ? `We sent a reset link to ${email}` : "Enter your email and we'll send a reset link."}
            </p>
          </div>

          <div className="px-8 py-6">
            {sent ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  {['Open your email app', 'Find the reset email', 'Click the link to set a new password'].map((s, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/6 rounded-xl px-4 py-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                      <span className="text-zinc-300 text-sm">{s}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-xs text-center pt-1">Check spam · Link expires in 1 hour</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Email address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com" required autoFocus
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all"
                  />
                </div>
                {error && <p className="text-red-400 text-xs bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm transition-all disabled:opacity-60">
                  {loading ? 'Sending…' : 'Send Reset Link →'}
                </button>
              </form>
            )}
          </div>

          <div className="px-8 py-4 bg-white/[0.015] border-t border-white/6 flex items-center justify-center">
            <Link href="/auth/signin" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
