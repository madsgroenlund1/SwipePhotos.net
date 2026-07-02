'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message || 'Something went wrong. Please try again.')
      else setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-0">
              <span className="text-white font-bold text-2xl">SwipePhotos</span>
              <span className="text-blue-500 font-bold text-2xl">.net</span>
            </Link>
          </div>

          {/* Card */}
          <div className="bg-[#111] border border-white/8 rounded-3xl p-8 text-center shadow-2xl">
            {/* Icon */}
            <div className="relative flex justify-center mb-7">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <svg className="w-9 h-9 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              {/* Pulse dot */}
              <span className="absolute top-1 right-[calc(50%-44px)] w-3 h-3 bg-green-400 rounded-full border-2 border-[#111]" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Check your inbox</h2>
            <p className="text-zinc-500 text-sm mb-1">We sent a sign-in link to</p>
            <p className="text-white font-semibold text-sm mb-8">{email}</p>

            {/* Steps */}
            <div className="space-y-3 text-left mb-8">
              {[
                { n: 1, text: 'Open your email app' },
                { n: 2, text: 'Find the email from SwipePhotos' },
                { n: 3, text: 'Click the sign-in link' },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-center gap-3 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</div>
                  <span className="text-zinc-300 text-sm">{text}</span>
                </div>
              ))}
            </div>

            <p className="text-zinc-700 text-xs mb-6">Link expires in 1 hour · Check spam if missing</p>

            <button onClick={() => setSent(false)} className="w-full text-zinc-500 hover:text-white text-sm py-3 rounded-xl border border-white/8 hover:border-white/20 transition-all">
              Use a different email
            </button>
          </div>
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
        <p className="text-zinc-500 text-sm text-center mb-6">Welcome back</p>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 rounded-full transition-all mb-4"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-zinc-600 text-xs">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

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
