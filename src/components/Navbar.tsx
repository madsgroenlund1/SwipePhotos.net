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
// Animated scroll to an anchor over ~1.2s. Recomputes the target position every
// frame so lazy-loaded images shifting the layout can't cut the animation short
// (which is why CSS scroll-behavior:smooth was removed).
function smoothScrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return false
  const duration = 1200
  const start = window.scrollY
  const startTime = performance.now()
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  // setInterval instead of requestAnimationFrame: rAF stalls in background/
  // headless tabs, while a timer keeps the animation deterministic everywhere.
  const timer = window.setInterval(() => {
    const t = Math.min(1, (performance.now() - startTime) / duration)
    const target = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo(0, start + (target - start) * ease(t))
    if (t >= 1) window.clearInterval(timer)
  }, 16)
  return true
}

export function Navbar({ initialLoggedIn: _ignored }: { initialLoggedIn?: boolean }) {
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  // Intercept same-page anchor links: animate instead of jumping
  function onAnchorClick(e: React.MouseEvent, id: string) {
    if (window.location.pathname === '/' && smoothScrollTo(id)) {
      e.preventDefault()
      history.replaceState(null, '', `/#${id}`)
    }
  }

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
          <Link href="/#how-it-works" onClick={e => onAnchorClick(e, 'how-it-works')} className="text-zinc-100 hover:text-white text-sm font-medium transition-colors">How it works</Link>
          <Link href="/#results" onClick={e => onAnchorClick(e, 'results')} className="text-zinc-100 hover:text-white text-sm font-medium transition-colors">Results</Link>
          <Link href="/#pricing" onClick={e => onAnchorClick(e, 'pricing')} className="text-zinc-100 hover:text-white text-sm font-medium transition-colors">Prices</Link>
          <Link href="/blog" className="text-zinc-100 hover:text-white text-sm font-medium transition-colors">Blog</Link>
        </nav>

        {/* Socials */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <a href="https://www.instagram.com/swipephotosnet/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
            className="w-8 h-8 rounded-lg overflow-hidden hover:scale-105 transition-transform">
            <img src="/icons/instagram.svg" alt="Instagram" className="w-full h-full" />
          </a>
          <a href="https://www.tiktok.com/@cardsnap.app" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
            className="w-8 h-8 rounded-lg overflow-hidden hover:scale-105 transition-transform">
            <img src="/icons/tiktok.png" alt="TikTok" className="w-full h-full" />
          </a>
        </div>

        <Link
          href={user ? '/dashboard' : '/auth/signin'}
          className={`flex-shrink-0 text-white hover:text-white text-sm font-semibold border border-white/25 hover:border-white/50 bg-white/5 px-4 py-2 rounded-full transition-all duration-150 ${
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
