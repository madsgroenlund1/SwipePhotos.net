'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()
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
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      <Link href="/" className="flex items-center gap-0 mb-10">
        <span className="text-white font-bold text-2xl">SwipePhotos</span>
        <span className="text-blue-500 font-bold text-2xl">.net</span>
      </Link>

      <div className="w-full max-w-sm bg-[#111] border border-white/8 rounded-2xl p-8">
        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
            <p className="text-zinc-400 text-sm">
              We sent a magic link to <strong className="text-white">{email}</strong>.
              Click it to sign in.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-white mb-1 text-center">Sign in</h1>
            <p className="text-zinc-500 text-sm text-center mb-6">We&apos;ll email you a magic link</p>

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
                {loading ? 'Sending...' : 'Send Magic Link →'}
              </button>
            </form>

            <p className="text-center text-zinc-600 text-xs mt-4">
              Don&apos;t have an account?{' '}
              <Link href="/onboarding" className="text-blue-400 hover:text-blue-300">
                Get started free
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
