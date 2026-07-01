'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GoCheckout() {
  const router = useRouter()

  useEffect(() => {
    const url = localStorage.getItem('sw_pending_checkout')
    if (url) {
      localStorage.removeItem('sw_pending_checkout')
      window.location.href = url
    } else {
      router.replace('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
    </div>
  )
}
