'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Copy, Check, X, Clock, Zap, LogOut, ChevronDown, ChevronUp, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type Photo = { file_url: string }
type Order = {
  id: string
  package_type: string
  status: string
  created_at: string
  generated_photos: Photo[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string; detail: string }> = {
  pending:    { label: 'Pending',    color: 'text-zinc-400  bg-zinc-400/10  border-zinc-400/20',  icon: <Clock className="w-3.5 h-3.5" />, desc: 'Confirming payment…',           detail: 'We are confirming your payment. This usually takes under a minute.' },
  processing: { label: 'Processing', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: <Clock className="w-3.5 h-3.5" />, desc: 'Starting generation…',         detail: 'Payment confirmed. We are preparing your photos now.' },
  training:   { label: 'Training',   color: 'text-blue-400  bg-blue-400/10  border-blue-400/20',  icon: <Zap  className="w-3.5 h-3.5" />, desc: 'AI is learning your face…',     detail: 'This takes about 20 minutes. We will email you when ready.' },
  generating: { label: 'Generating', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: <Zap className="w-3.5 h-3.5" />, desc: 'Creating your photos…',       detail: 'Almost there — your photos are being generated right now.' },
  ready:      { label: 'Ready',      color: 'text-green-400  bg-green-400/10  border-green-400/20',  icon: <Check className="w-3.5 h-3.5" />, desc: 'Your photos are ready!',    detail: 'Download them below and upload directly to Hinge, Tinder or Bumble.' },
  failed:     { label: 'Failed',     color: 'text-red-400   bg-red-400/10   border-red-400/20',   icon: <X    className="w-3.5 h-3.5" />, desc: 'Something went wrong',         detail: 'Your payment and order are safe. Contact support and we will fix it or refund you.' },
}

const PACKAGE_LABELS: Record<string, string> = {
  starter: 'Starter',
  popular: 'Popular',
  elite:   'Elite',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadAll(photos: Photo[]) {
  for (let i = 0; i < photos.length; i++) {
    try {
      const res = await fetch(photos[i].file_url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `swipephoto-${i + 1}.webp`
      a.click()
      URL.revokeObjectURL(a.href)
      await new Promise(r => setTimeout(r, 300))
    } catch {
      window.open(photos[i].file_url, '_blank')
    }
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', cfg.color)}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function Spinner() {
  return <div className="w-5 h-5 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin flex-shrink-0" />
}

function PhotoGrid({ photos, orderId }: { photos: Photo[]; orderId: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const PREVIEW = 6
  const visible = showAll ? photos : photos.slice(0, PREVIEW)
  const hasMore = photos.length > PREVIEW && !showAll

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {visible.map((p, i) => (
          <div
            key={`${orderId}-${i}`}
            className="aspect-[3/4] rounded-xl overflow-hidden relative group cursor-pointer bg-zinc-900"
            onClick={() => setLightbox(p.file_url)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.file_url}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end justify-end p-2.5 opacity-0 group-hover:opacity-100">
              <a
                href={p.file_url}
                download
                onClick={e => e.stopPropagation()}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-black" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-white text-sm py-2.5 border border-white/8 hover:border-white/20 rounded-xl transition-all"
        >
          Show all {photos.length} photos <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {showAll && photos.length > PREVIEW && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-white text-sm py-2.5 border border-white/8 hover:border-white/20 rounded-xl transition-all"
        >
          Show less <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[88vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <a
            href={lightbox}
            download
            onClick={e => e.stopPropagation()}
            className="absolute bottom-6 flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-full shadow-xl hover:bg-zinc-100 transition-all"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      )}
    </>
  )
}

function OrderCard({ order, expanded = false }: { order: Order; expanded?: boolean }) {
  const [open, setOpen] = useState(expanded)
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
  const photos = order.generated_photos ?? []
  const isActive = ['pending', 'processing', 'training', 'generating'].includes(order.status)
  const dateStr = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className={cn('border rounded-2xl overflow-hidden transition-all', isActive ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/8 bg-[#111]')}>
      {/* Header — always visible */}
      <button
        className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-white font-semibold text-sm">
              {PACKAGE_LABELS[order.package_type] ?? 'Standard'} Package
            </span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-zinc-600 text-xs">{dateStr} · Order #{order.id.slice(-8).toUpperCase()}</p>
        </div>
        {photos.length > 0 && (
          <span className="text-zinc-500 text-xs flex items-center gap-1 flex-shrink-0">
            <ImageIcon className="w-3.5 h-3.5" />
            {photos.length}
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-zinc-600 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-600 flex-shrink-0" />}
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-5 pb-5 border-t border-white/5">
          {/* Status detail */}
          <div className={cn('flex items-start gap-3 py-4', isActive && 'pb-4')}>
            {isActive && <Spinner />}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{cfg.desc}</p>
              <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{cfg.detail}</p>
            </div>
          </div>

          {/* Photos */}
          {photos.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">
                  {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                </p>
                {photos.length > 1 && (
                  <button
                    onClick={() => downloadAll(photos)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download all
                  </button>
                )}
              </div>
              <PhotoGrid photos={photos} orderId={order.id} />
            </>
          )}

          {order.status === 'failed' && (
            <a
              href="mailto:support@swipephotos.net"
              className="mt-4 flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium py-3 rounded-xl transition-all"
            >
              Contact support →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardClient({
  orders,
  refLink,
  userEmail,
  initialCancelled = false,
  hasActiveSubscription = false,
}: {
  orders: Order[]
  refLink: string | null
  userEmail: string
  initialCancelled?: boolean
  hasActiveSubscription?: boolean
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(initialCancelled)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const activeOrder = orders.find(o => ['pending', 'processing', 'training', 'generating'].includes(o.status))
  const completedOrders = orders.filter(o => o.status === 'ready')
  const hasPhotos = orders.some(o => (o.generated_photos ?? []).length > 0)

  // Poll when an order is in-progress
  const pollTick = useCallback(async () => {
    if (!activeOrder) return
    if (activeOrder.status === 'generating') {
      try {
        const res = await fetch(`/api/orders/${activeOrder.id}/poll`)
        const data = await res.json()
        if (data.status === 'ready') { router.refresh(); return }
      } catch { /* ignore */ }
    }
    router.refresh()
  }, [activeOrder, router])

  useEffect(() => {
    if (!activeOrder) return
    const id = setInterval(pollTick, 10_000)
    return () => clearInterval(id)
  }, [activeOrder, pollTick])

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleCancelSubscription() {
    setCancelling(true)
    try {
      const res = await fetch('/api/cancel-subscription', { method: 'POST' })
      const data = await res.json()
      if (data.ok) { setCancelled(true); setShowCancelConfirm(false) }
      else alert(data.error || 'Could not cancel. Please contact support.')
    } catch { alert('Something went wrong. Please try again.') }
    setCancelling(false)
  }

  function copyRef() {
    if (!refLink) return
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!orders.length) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-9 h-9 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Create your first photo set</h2>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
            Choose a setting, upload your photos, and preview what SwipePhotos can create for you.
          </p>
          <a
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-blue-600 hover:brightness-110 text-white font-semibold px-8 py-3.5 rounded-full transition-all"
          >
            Get started for free →
          </a>
        </div>

        {/* Account */}
        <div className="border border-white/8 rounded-2xl p-5 mt-4">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-3">Account</p>
          <div className="flex items-center justify-between">
            <p className="text-zinc-300 text-sm truncate">{userEmail}</p>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 text-sm transition-colors ml-4 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Main dashboard ───────────────────────────────────────────────────────
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

      {/* Active order banner */}
      {activeOrder && (
        <div className="bg-blue-600/8 border border-blue-500/25 rounded-2xl p-5 flex items-center gap-4">
          <Spinner />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{STATUS_CONFIG[activeOrder.status]?.desc ?? 'Working on your order…'}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{STATUS_CONFIG[activeOrder.status]?.detail}</p>
          </div>
          <StatusBadge status={activeOrder.status} />
        </div>
      )}

      {/* Hero CTA */}
      {!activeOrder && !hasPhotos && (
        <div className="bg-[#111] border border-white/8 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-white font-bold text-lg mb-1">Get more photos</h2>
            <p className="text-zinc-500 text-sm">Try a different style or order a bigger set.</p>
          </div>
          <a href="/onboarding" className="bg-blue-600 hover:brightness-110 text-white font-semibold px-5 py-2.5 rounded-full transition-all flex-shrink-0 text-sm">
            New order →
          </a>
        </div>
      )}

      {/* Orders — latest first, latest expanded */}
      <div className="space-y-3">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide px-1">
          {orders.length === 1 ? 'Your order' : `${orders.length} orders`}
        </p>
        {orders.map((order, i) => (
          <OrderCard key={order.id} order={order} expanded={i === 0} />
        ))}
      </div>

      {/* All photos — quick grid of latest completed */}
      {completedOrders.length > 1 && (
        <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold">All your photos</p>
            <button
              onClick={() => downloadAll(completedOrders.flatMap(o => o.generated_photos))}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download all
            </button>
          </div>
          <PhotoGrid
            photos={completedOrders.flatMap(o => o.generated_photos)}
            orderId="all"
          />
        </div>
      )}

      {/* Subscription management */}
      {hasActiveSubscription && (
        <div className="border border-white/8 rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-white font-semibold text-sm mb-0.5">Subscription</p>
              <p className="text-zinc-500 text-xs">
                {cancelled
                  ? 'Cancelled — you keep access until the end of the billing period.'
                  : 'Cancel anytime. You keep access until the end of your billing period.'}
              </p>
            </div>
            {!cancelled && !showCancelConfirm && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-zinc-500 hover:text-red-400 text-xs font-medium border border-white/8 hover:border-red-400/30 px-3 py-1.5 rounded-lg transition-all"
              >
                Cancel
              </button>
            )}
            {showCancelConfirm && !cancelled && (
              <div className="flex items-center gap-2 w-full mt-1">
                <p className="text-zinc-400 text-xs flex-1">Are you sure?</p>
                <button onClick={() => setShowCancelConfirm(false)} className="text-zinc-400 text-xs px-3 py-1.5 rounded-lg border border-white/10 transition-all hover:text-white">Keep</button>
                <button onClick={handleCancelSubscription} disabled={cancelling} className="text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-400/30 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50">
                  {cancelling ? 'Cancelling…' : 'Cancel plan'}
                </button>
              </div>
            )}
            {cancelled && <span className="text-zinc-600 text-xs">Cancelled</span>}
          </div>
        </div>
      )}

      {/* Refer & Earn */}
      <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/5 border border-blue-500/20 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <h3 className="text-white font-bold mb-0.5">Refer & Earn 30%</h3>
            <p className="text-zinc-400 text-sm">Share your link. Earn 30% on every sale — paid monthly.</p>
          </div>
          <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/20 flex-shrink-0">
            Affiliate
          </span>
        </div>
        {refLink ? (
          <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl p-3">
            <code className="flex-1 text-zinc-300 text-xs truncate">{refLink}</code>
            <button
              onClick={copyRef}
              className={cn('flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex-shrink-0', copied ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white')}
            >
              {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>
        ) : (
          <a href="/affiliate" className="inline-flex items-center gap-1.5 bg-blue-600 hover:brightness-110 text-white text-sm font-medium px-4 py-2.5 rounded-full transition-all">
            Apply for affiliate →
          </a>
        )}
      </div>

      {/* Account */}
      <div className="border border-white/8 rounded-2xl p-5">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-3">Account</p>
        <div className="flex items-center justify-between gap-4">
          <p className="text-zinc-300 text-sm truncate">{userEmail}</p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 text-sm transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
        <div className="border-t border-white/5 mt-4 pt-4 flex gap-4">
          <a href="/privacy" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">Privacy Policy</a>
          <a href="/terms" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">Terms of Service</a>
          <a href="mailto:support@swipephotos.net" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">Support</a>
        </div>
      </div>

    </main>
  )
}
