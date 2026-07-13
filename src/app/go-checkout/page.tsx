'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function GoCheckout() {
  const router = useRouter()
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded) return
    async function run() {
      const url = localStorage.getItem('sw_pending_checkout')
      const orderId = localStorage.getItem('sw_pending_order_id')

      if (!url) { router.replace('/dashboard'); return }

      localStorage.removeItem('sw_pending_checkout')
      localStorage.removeItem('sw_pending_order_id')

      // Patch the order with the Google user's email so the ready-email can be sent
      const email = user?.primaryEmailAddress?.emailAddress
      if (orderId && email) {
        await fetch(`/api/orders/${orderId}/set-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).catch(() => {})
      }

      window.location.href = url
    }
    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, isLoaded])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
    </div>
  )
}
