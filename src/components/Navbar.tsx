'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// initialLoggedIn: server-rendered auth state. Passed by server components so the
// button renders correctly on first paint with no async round-trip required.
// onAuthStateChange then keeps it in sync for sign-in / sign-out events.
export function Navbar({ initialLoggedIn }: { initialLoggedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  // Use server-provided value if available; null = auth check still pending (hides button)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(initialLoggedIn ?? null)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    // onAuthStateChange fires immediately with INITIAL_SESSION event,
    // so we don't need a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-md bg-[#0A0A0A]/80 border-b border-white/5' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-white font-bold text-xl tracking-tight">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-xl">.net</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#how-it-works" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">How it works</Link>
          <Link href="/#results" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Results</Link>
          <Link href="/blog" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Blog</Link>
        </nav>

        {/* Hidden until auth check resolves — prevents "Sign in" flash for logged-in users */}
        <Link
          href={loggedIn ? '/dashboard' : '/auth/signin'}
          className={`flex-shrink-0 text-zinc-400 hover:text-white text-sm font-medium border border-white/10 hover:border-white/25 px-4 py-2 rounded-full transition-all duration-150 ${
            loggedIn === null ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          tabIndex={loggedIn === null ? -1 : undefined}
          aria-hidden={loggedIn === null}
        >
          {loggedIn ? 'Dashboard' : 'Sign in'}
        </Link>
      </div>
    </nav>
  )
}
