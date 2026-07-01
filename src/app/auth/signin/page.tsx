'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
        <Link href="/" className="flex items-center gap-0 mb-10">
          <span className="text-white font-bold text-2xl">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-2xl">.net</span>
        </Link>
        <div className="w-full max-w-sm bg-[#111] border border-white/8 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-600/15 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-1">
            We sent a sign-in link to
          </p>
          <p className="text-white font-semibold text-sm mb-5">{email}</p>
          <p className="text-zinc-600 text-xs">Click the link in the email to access your account. The link expires after 1 hour.</p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      <Link href="/" className="flex items-center gap-0 mb-10">
        <span className="text-white font-bold text-2xl">SwipePhotos</span>
        <span className="text-blue-500 font-bold text-2xl">.net</span>
      </Link>
      <div className="w-full max-w-sm bg-[#111] border border-white/8 rounded-2xl p-8">
        <h1 className="text-xl font-bold text-white mb-1 text-center">Sign in</h1>
        <p className="text-zinc-500 text-sm text-center mb-6">We&apos;ll send you a sign-in link</p>
        <form onSubmit={handleMagicLink}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 mb-4"
          />
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-3 rounded-full transition-all"
          >
            {loading ? 'Sending...' : 'Send Sign-in Link →'}
          </button>
        </form>
        <p className="text-center text-zinc-600 text-xs mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/onboarding" className="text-blue-400 hover:text-blue-300">Get started free</Link>
        </p>
      </div>
    </div>
  )
}
