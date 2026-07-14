'use client'

import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!localStorage.getItem('cookie-consent')) setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setEntered(true), 30)
    return () => clearTimeout(t)
  }, [visible])

  function accept() {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem('cookie-consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 transition-all duration-300 ease-out"
      style={{ opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(12px)' }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111]/95 backdrop-blur-xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 15% 0%, #3b82f6 0%, transparent 55%)' }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 100-2 1 1 0 000 2zM14.5 8.5a1 1 0 100-2 1 1 0 000 2zM15 14a1 1 0 100-2 1 1 0 000 2zM10 16a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
            </div>
            <p className="text-white text-sm font-semibold">We value your privacy</p>
          </div>

          <p className="text-zinc-400 text-[13px] leading-relaxed mb-4">
            We use essential cookies for authentication and session management, plus an affiliate
            tracking cookie to attribute referrals. See our{' '}
            <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
              Privacy Policy
            </a>{' '}
            for details.
          </p>

          <div className="flex gap-2.5">
            <button
              onClick={decline}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 rounded-full py-2.5 text-sm font-medium transition-all"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="flex-1 bg-blue-600 hover:brightness-110 text-white rounded-full py-2.5 text-sm font-semibold shadow-[0_4px_20px_rgba(59,130,246,0.35)] transition-all"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
