'use client'

import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('cookie-consent')
    if (!accepted) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('cookie-consent', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-[#111] border border-white/10 rounded-2xl p-5 shadow-2xl">
      <p className="text-sm text-zinc-400 mb-4">
        We use cookies to improve your experience and analyze usage. By continuing,
        you agree to our{' '}
        <a href="/privacy" className="text-blue-400 underline">
          Privacy Policy
        </a>
        .
      </p>
      <div className="flex gap-3">
        <button
          onClick={accept}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-full py-2 text-sm font-medium transition-colors"
        >
          Accept
        </button>
        <button
          onClick={accept}
          className="flex-1 border border-white/10 hover:border-white/20 text-zinc-400 rounded-full py-2 text-sm font-medium transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
