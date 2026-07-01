'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-md bg-[#0A0A0A]/80 border-b border-white/5' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-0.5">
          <span className="text-white font-bold text-xl tracking-tight">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-xl">.net</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/signin"
            className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/onboarding"
            className="bg-blue-600 hover:brightness-110 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all"
          >
            Get Started →
          </Link>
        </div>
      </div>
    </nav>
  )
}
