'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = ['processing', 'training', 'generating', 'ready', 'failed']

interface Order {
  id: string
  package_type: string
  status: string
  created_at: string
  users?: { email: string }
}

interface Affiliate {
  id: string
  status: string
  clicks: number
  conversions: number
  earnings_cents: number
  metadata?: { email?: string; name?: string; slug?: string }
  users?: { email: string }
}

export function AdminClient({
  orders,
  affiliates,
  revenue,
}: {
  orders: Order[]
  affiliates: Affiliate[]
  revenue: number
}) {
  const [tab, setTab] = useState<'orders' | 'affiliates'>('orders')
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateOrderStatus(orderId: string, status: string) {
    setUpdating(orderId)
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setUpdating(null)
    window.location.reload()
  }

  async function approveAffiliate(affiliateId: string) {
    await fetch(`/api/admin/affiliates/${affiliateId}/approve`, { method: 'POST' })
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <nav className="border-b border-white/5 px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-0">
          <span className="text-white font-bold text-xl">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-xl">.net</span>
          <span className="ml-3 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">Admin</span>
        </div>
        <span className="text-zinc-500 text-sm">Revenue: ${revenue.toLocaleString()}</span>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Orders', value: orders.length },
            { label: 'Ready', value: orders.filter(o => o.status === 'ready').length },
            { label: 'Processing', value: orders.filter(o => ['processing','training','generating'].includes(o.status)).length },
            { label: 'Revenue', value: `$${revenue.toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#111] border border-white/8 rounded-2xl p-5">
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-zinc-500 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 w-fit">
          {(['orders', 'affiliates'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                tab === t ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'orders' && (
          <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Email', 'Package', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-xs text-zinc-500 font-medium uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-5 py-4 text-sm text-zinc-300">{order.users?.email || '—'}</td>
                    <td className="px-5 py-4 text-sm text-white capitalize">{order.package_type}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-zinc-400 capitalize">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        defaultValue={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-zinc-900 capitalize">{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'affiliates' && (
          <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Email', 'Status', 'Clicks', 'Conversions', 'Earnings', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-xs text-zinc-500 font-medium uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {affiliates.map((aff) => (
                  <tr key={aff.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-5 py-4 text-sm text-zinc-300">{aff.metadata?.email || aff.users?.email || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'text-xs px-2.5 py-1 rounded-full capitalize',
                        aff.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                        aff.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      )}>
                        {aff.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-300">{aff.clicks}</td>
                    <td className="px-5 py-4 text-sm text-zinc-300">{aff.conversions}</td>
                    <td className="px-5 py-4 text-sm text-zinc-300">${(aff.earnings_cents / 100).toFixed(2)}</td>
                    <td className="px-5 py-4">
                      {aff.status === 'pending' && (
                        <button
                          onClick={() => approveAffiliate(aff.id)}
                          className="bg-green-600 hover:brightness-110 text-white text-xs px-3 py-1.5 rounded-full transition-all"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
