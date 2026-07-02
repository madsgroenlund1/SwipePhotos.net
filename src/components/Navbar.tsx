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

        <Link
          href="/auth/signin"
          className="text-zinc-400 hover:text-white text-sm font-medium border border-white/10 hover:border-white/25 px-4 py-2 rounded-full transition-all"
        >
          Sign in
        </Link>
      </div>
    </nav>
  )
}
