'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'forgot'

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('error') === 'auth_failed') return 'Google sign-in failed. Check Google Cloud Console redirect URIs.'
    }
    return ''
  })

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
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError(error.message || 'Google sign-in failed. Please try again.')
        setGoogleLoading(false)
      }
      // No error: browser is being redirected to Google — don't reset loading
    } catch {
      setError('Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  // Sent confirmation screen
  if (sent) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-0">
              <span className="text-white font-bold text-2xl tracking-tight">SwipePhotos</span>
              <span className="text-blue-500 font-bold text-2xl tracking-tight">.net</span>
            </Link>
          </div>

          <div className="bg-[#111]/80 backdrop-blur-sm border border-white/8 rounded-3xl p-8 text-center shadow-2xl shadow-black/50">
            <div className="relative flex justify-center mb-7">
              <div className="px-6 py-4 rounded-2xl bg-gradient-to-br from-blue-600/15 to-blue-900/10 border border-blue-500/20 shadow-lg shadow-blue-500/10 flex items-center">
                <span className="text-white font-bold text-2xl tracking-tight">SwipePhotos</span>
                <span className="text-blue-400 font-bold text-2xl tracking-tight">.net</span>
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#111] animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              {mode === 'forgot' ? 'Check your inbox' : 'Check your inbox'}
            </h2>
            <p className="text-zinc-500 text-sm mb-1">
              {mode === 'forgot' ? 'We sent an access link to' : 'We sent a sign-in link to'}
            </p>
            <p className="text-white font-semibold text-sm mb-8">{email}</p>

            <div className="space-y-2.5 text-left mb-8">
              {[
                { n: 1, text: 'Open your email app' },
                { n: 2, text: 'Find the email from SwipePhotos' },
                { n: 3, text: 'Click the sign-in link' },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-center gap-3 bg-white/[0.03] border border-white/6 rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</div>
                  <span className="text-zinc-300 text-sm">{text}</span>
                </div>
              ))}
            </div>

            <p className="text-zinc-700 text-xs mb-5">Link expires in 1 hour · Check spam if missing</p>

            <button onClick={() => { setSent(false); setMode('signin') }} className="w-full text-zinc-500 hover:text-white text-sm py-3 rounded-xl border border-white/8 hover:border-white/20 transition-all">
              Use a different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Forgot access mode
  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-0">
              <span className="text-white font-bold text-2xl tracking-tight">SwipePhotos</span>
              <span className="text-blue-500 font-bold text-2xl tracking-tight">.net</span>
            </Link>
            <p className="text-zinc-600 text-xs mt-2">AI Dating Photos for Men</p>
          </div>

          <div className="bg-[#111]/80 backdrop-blur-sm border border-white/8 rounded-3xl p-8 shadow-2xl shadow-black/50">
            {/* Key icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-1 text-center tracking-tight">Recover account access</h1>
            <p className="text-zinc-500 text-sm text-center mb-7 leading-relaxed">
              Enter your email and we&apos;ll send you a secure link to sign back in — no password needed.
            </p>

            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.07] transition-all text-sm"
              />
              {error && <p className="text-red-400 text-xs px-1">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-60 text-sm"
              >
                {loading ? 'Sending link...' : 'Send Access Link →'}
              </button>
            </form>

            <button
              onClick={() => { setMode('signin'); setError('') }}
              className="w-full text-zinc-600 hover:text-zinc-400 text-sm py-3 mt-3 rounded-xl border border-white/6 hover:border-white/12 transition-all"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main sign-in
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/4 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-0">
            <span className="text-white font-bold text-2xl tracking-tight">SwipePhotos</span>
            <span className="text-blue-500 font-bold text-2xl tracking-tight">.net</span>
          </Link>
          <p className="text-zinc-600 text-xs mt-2">AI Dating Photos for Men</p>
        </div>

        <div className="bg-[#111]/80 backdrop-blur-sm border border-white/8 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <h1 className="text-2xl font-bold text-white mb-1 text-center tracking-tight">Welcome back</h1>
          <p className="text-zinc-500 text-sm text-center mb-7">Sign in to access your photos</p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 text-gray-900 font-semibold py-3.5 rounded-2xl transition-all mb-4 shadow-sm disabled:opacity-70"
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
            <span className="text-zinc-700 text-xs font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <form onSubmit={handleMagicLink} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.07] transition-all text-sm"
            />
            {error && <p className="text-red-400 text-xs px-1">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-60 text-sm"
            >
              {loading ? 'Sending link...' : 'Send Sign-in Link →'}
            </button>
          </form>

          {/* Forgot access */}
          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode('forgot'); setError('') }}
              className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors underline underline-offset-2"
            >
              Forgot access to your account?
            </button>
          </div>

          <p className="text-center text-zinc-700 text-xs mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/onboarding" className="text-blue-400 hover:text-blue-300 font-medium">Get started free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
