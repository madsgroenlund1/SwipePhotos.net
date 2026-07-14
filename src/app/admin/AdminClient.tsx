'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = ['processing', 'training', 'generating', 'ready', 'failed']

interface Order {
  id: string
  package_type: string
  status: string
  created_at: string
  email?: string | null
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

const STATUS_STYLES: Record<string, string> = {
  ready:      'bg-green-500/10 text-green-400 border border-green-500/20',
  generating: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  training:   'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  pending:    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  failed:     'bg-red-500/10 text-red-400 border border-red-500/20',
}

const PACKAGE_STYLES: Record<string, string> = {
  starter: 'bg-white/5 text-zinc-300 border border-white/10',
  popular: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  elite:   'bg-amber-500/10 text-amber-300 border border-amber-500/20',
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#111] p-5">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ background: `radial-gradient(circle at 15% 0%, ${accent} 0%, transparent 60%)` }} />
      <div className="relative">
        <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
        <div className="text-zinc-500 text-sm mt-1">{label}</div>
      </div>
    </div>
  )
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
  const [approvingCommissions, setApprovingCommissions] = useState(false)
  const [recovering, setRecovering] = useState(false)

  async function runRecovery() {
    if (!confirm('Scan for stuck orders and attempt recovery? This is safe to run multiple times.')) return
    setRecovering(true)
    const res  = await fetch('/api/admin/recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const json = await res.json()
    setRecovering(false)
    alert(`Recovery complete.\nStuck pending: ${json.scanned?.stuckPending ?? 0}\nStuck generating: ${json.scanned?.stuckGenerating ?? 0}\n\nDetails: ${JSON.stringify(json.summary, null, 2)}`)
    window.location.reload()
  }

  async function approveAllCommissions() {
    setApprovingCommissions(true)
    const res = await fetch('/api/admin/commissions/approve-all', { method: 'POST' })
    const json = await res.json()
    setApprovingCommissions(false)
    alert(`Approved ${json.approved ?? 0} pending commissions`)
    window.location.reload()
  }

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

  const readyCount = orders.filter(o => o.status === 'ready').length
  const processingCount = orders.filter(o => ['processing', 'training', 'generating'].includes(o.status)).length
  const pendingAffiliates = affiliates.filter(a => a.status === 'pending').length

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <nav className="border-b border-white/5 px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            <span className="text-white font-bold text-xl">SwipePhotos</span>
            <span className="text-blue-500 font-bold text-xl">.net</span>
          </div>
          <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2.5 py-1">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runRecovery}
            disabled={recovering}
            className="text-xs font-medium bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 border border-amber-500/20 px-3.5 py-2 rounded-xl transition-all disabled:opacity-60"
          >
            {recovering ? 'Scanning…' : '↻ Recovery scan'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Orders" value={orders.length} accent="#3b82f6" />
          <StatCard label="Ready" value={readyCount} accent="#22c55e" />
          <StatCard label="Processing" value={processingCount} accent="#3b82f6" />
          <StatCard label="Revenue (MRR)" value={`€${revenue.toLocaleString()}`} accent="#f59e0b" />
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-white/5 border border-white/8 rounded-xl p-1 w-fit">
            {(['orders', 'affiliates'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-2',
                  tab === t ? 'bg-white text-black' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {t}
                {t === 'affiliates' && pendingAffiliates > 0 && (
                  <span className={cn(
                    'text-[10px] font-bold rounded-full px-1.5 py-0.5',
                    tab === t ? 'bg-black/10 text-black' : 'bg-yellow-500/20 text-yellow-400'
                  )}>
                    {pendingAffiliates}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === 'affiliates' && pendingAffiliates > 0 && (
            <button
              onClick={approveAllCommissions}
              disabled={approvingCommissions}
              className="bg-blue-600 hover:brightness-110 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-60"
            >
              {approvingCommissions ? 'Approving…' : 'Approve pending commissions'}
            </button>
          )}
        </div>

        {tab === 'orders' && (
          orders.length === 0 ? (
            <div className="bg-[#111] border border-white/8 rounded-2xl p-16 text-center">
              <p className="text-zinc-500 text-sm">No orders yet.</p>
            </div>
          ) : (
          <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Email', 'Package', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs text-zinc-500 font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-4 text-sm text-zinc-300">{order.email || order.users?.email || <span className="text-zinc-600 italic">no email</span>}</td>
                    <td className="px-5 py-4">
                      <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full capitalize', PACKAGE_STYLES[order.package_type] || 'bg-white/5 text-zinc-300 border border-white/10')}>
                        {order.package_type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full capitalize', STATUS_STYLES[order.status] || 'bg-white/5 text-zinc-400 border border-white/10')}>
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
                        className="bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 text-sm text-white transition-colors disabled:opacity-50"
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
          )
        )}

        {tab === 'affiliates' && (
          affiliates.length === 0 ? (
            <div className="bg-[#111] border border-white/8 rounded-2xl p-16 text-center">
              <p className="text-zinc-500 text-sm">No affiliate applications yet.</p>
            </div>
          ) : (
          <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Email', 'Status', 'Clicks', 'Conversions', 'Earnings', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs text-zinc-500 font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {affiliates.map((aff) => (
                  <tr key={aff.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-4 text-sm text-zinc-300">{aff.metadata?.email || aff.users?.email || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'text-xs font-medium px-2.5 py-1 rounded-full capitalize',
                        aff.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        aff.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      )}>
                        {aff.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-300 tabular-nums">{aff.clicks}</td>
                    <td className="px-5 py-4 text-sm text-zinc-300 tabular-nums">{aff.conversions}</td>
                    <td className="px-5 py-4 text-sm text-zinc-300 tabular-nums">€{(aff.earnings_cents / 100).toFixed(2)}</td>
                    <td className="px-5 py-4">
                      {aff.status === 'pending' && (
                        <button
                          onClick={() => approveAffiliate(aff.id)}
                          className="bg-green-600 hover:brightness-110 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all"
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
          )
        )}
      </main>
    </div>
  )
}
