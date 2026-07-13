'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'

/**
 * Navbar — reads auth state from AuthProvider (set in root layout from the server).
 *
 * This eliminates the "Sign in" flash on refresh: the server already determined
 * whether the user is logged in and seeded the provider, so the button renders
 * correctly from the very first paint without waiting for onAuthStateChange.
 *
 * `initialLoggedIn` is kept as an optional prop for backward compatibility but
 * is no longer needed — AuthProvider handles the initial state.
 */
export function Navbar({ initialLoggedIn: _ignored }: { initialLoggedIn?: boolean }) {
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Three states:
  //   loading=true  → hide the button (avoids signed-out flash while verifying)
  //   user != null  → "Dashboard"
  //   user == null  → "Sign in"
  const buttonVisible = !loading

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

        {/* Socials */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <a href="https://www.instagram.com/swipephotosnet/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/25 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a href="https://www.tiktok.com/@cardsnap.app" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/25 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </a>
        </div>

        <Link
          href={user ? '/dashboard' : '/auth/signin'}
          className={`flex-shrink-0 text-zinc-400 hover:text-white text-sm font-medium border border-white/10 hover:border-white/25 px-4 py-2 rounded-full transition-all duration-150 ${
            buttonVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          tabIndex={buttonVisible ? undefined : -1}
          aria-hidden={!buttonVisible}
        >
          {user ? 'Dashboard' : 'Sign in'}
        </Link>
      </div>
    </nav>
  )
}
