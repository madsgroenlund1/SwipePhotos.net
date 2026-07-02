'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function GoCheckout() {
  const router = useRouter()

  useEffect(() => {
    async function run() {
      const url = localStorage.getItem('sw_pending_checkout')
      const orderId = localStorage.getItem('sw_pending_order_id')

      if (!url) { router.replace('/dashboard'); return }

      localStorage.removeItem('sw_pending_checkout')
      localStorage.removeItem('sw_pending_order_id')

      // Patch the order with the Google user's email so the ready-email can be sent
      if (orderId) {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email) {
            await fetch(`/api/orders/${orderId}/set-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email }),
            }).catch(() => {})
          }
        } catch {}
      }

      window.location.href = url
    }
    run()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
    </div>
  )
}
