'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

export default function SignUpPage() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPw, setShowPw]             = useState(false)
  const [agreed, setAgreed]             = useState(false)
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]               = useState('')
  const [sent, setSent]                 = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://swipephotos.net')

  async function handleGoogle() {
    if (!agreed) { setError('Please accept the Terms of Service and Privacy Policy to continue.'); return }
    setGoogleLoading(true); setError('')
    const { error: e } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback` },
    })
    if (e) { setError(e.message); setGoogleLoading(false) }
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!agreed) { setError('Please accept the Terms of Service and Privacy Policy to continue.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    const { error: err } = await createClient().auth.signUp({
      email, password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-3xl" />
      <div className="relative w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center">
            <span className="text-white font-bold text-2xl tracking-tight">SwipePhotos</span>
            <span className="text-blue-500 font-bold text-2xl tracking-tight">.net</span>
          </Link>
        </div>
        <div className="bg-[#111] border border-white/8 rounded-2xl shadow-2xl shadow-black/60 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Check your inbox</h2>
          <p className="text-zinc-500 text-sm mb-1">We sent a confirmation link to</p>
          <p className="text-white font-medium text-sm mb-6">{email}</p>
          <div className="space-y-2 text-left mb-6">
            {['Open your email app', 'Find the email from SwipePhotos', 'Click the confirmation link'].map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/6 rounded-xl px-4 py-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                <span className="text-zinc-300 text-sm">{s}</span>
              </div>
            ))}
          </div>
          <p className="text-zinc-700 text-xs">Check spam if missing · Link expires in 1 hour</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center">
            <span className="text-white font-bold text-2xl tracking-tight">SwipePhotos</span>
            <span className="text-blue-500 font-bold text-2xl tracking-tight">.net</span>
          </Link>
        </div>

        <div className="bg-[#111] border border-white/8 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/6">
            <h1 className="text-xl font-semibold text-white mb-1">Create your account</h1>
            <p className="text-zinc-500 text-sm">Save and receive your AI dating photos.</p>
          </div>

          <div className="px-8 py-6 space-y-3">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-50 text-[#1a1a1a] font-medium py-2.5 rounded-lg border border-zinc-200 text-sm shadow-sm transition-all disabled:opacity-60"
            >
              <GoogleIcon />
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-0.5">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-zinc-600 text-xs">or</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Email address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com" required autoComplete="email"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters" required autoComplete="new-password"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-2.5 pr-10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group pt-1">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${agreed ? 'bg-blue-600 border-blue-600' : 'border-white/20 bg-white/[0.04] group-hover:border-white/30'}`}>
                    {agreed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-zinc-500 text-xs leading-relaxed">
                  I agree to SwipePhotos&apos;{' '}
                  <Link href="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 transition-colors">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" className="text-blue-400 hover:text-blue-300 transition-colors">Privacy Policy</Link>
                </span>
              </label>

              {error && (
                <p className="text-red-400 text-xs bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2.5 leading-relaxed">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm transition-all disabled:opacity-60">
                {loading ? 'Creating account…' : 'Create account →'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-white/[0.015] border-t border-white/6 flex items-center justify-center gap-1.5">
            <span className="text-zinc-600 text-xs">Already have an account?</span>
            <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        <p className="text-center text-zinc-700 text-[11px] mt-5">
          Secured by Supabase Auth · <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-500 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
