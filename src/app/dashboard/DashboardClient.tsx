'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Download, Copy, Check, X, Clock, Zap, LogOut,
  ChevronDown, ChevronUp, ImageIcon, Users, TrendingUp,
  DollarSign, Link2, BarChart3,
} from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type Photo  = { file_url: string }
type Order  = { id: string; package_type: string; status: string; created_at: string; generated_photos: Photo[] }
type Payout = { id: string; amount_cents: number; status: string; created_at: string; paid_at: string | null }

type AffiliateData = {
  id: string
  status: string
  refCode: string | null
  refLink: string | null
  clicks: number
  signups: number
  conversions: number
  pendingCents: number
  approvedCents: number
  paidCents: number
  totalEarnedCents: number
  payouts: Payout[]
} | null

type Tab = 'overview' | 'affiliate' | 'account'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string; detail: string }> = {
  draft:      { label: 'Draft',      color: 'text-zinc-500  bg-zinc-500/10  border-zinc-500/20',      icon: <Clock className="w-3.5 h-3.5" />, desc: 'Waiting for payment…',       detail: 'Complete your purchase to start generating photos.' },
  pending:    { label: 'Pending',    color: 'text-zinc-400  bg-zinc-400/10  border-zinc-400/20',      icon: <Clock className="w-3.5 h-3.5" />, desc: 'Confirming payment…',        detail: 'We are confirming your payment. This usually takes under a minute.' },
  processing: { label: 'Processing', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: <Clock className="w-3.5 h-3.5" />, desc: 'Starting generation…',        detail: 'Payment confirmed. We are preparing your photos now.' },
  training:   { label: 'Training',   color: 'text-blue-400  bg-blue-400/10  border-blue-400/20',      icon: <Zap  className="w-3.5 h-3.5" />, desc: 'AI is learning your face…',  detail: 'This takes about 20 minutes. We will email you when ready.' },
  generating: { label: 'Generating', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: <Zap  className="w-3.5 h-3.5" />, desc: 'Creating your photos…',       detail: 'Almost there — your photos are being generated right now.' },
  ready:      { label: 'Ready',      color: 'text-green-400  bg-green-400/10  border-green-400/20',   icon: <Check className="w-3.5 h-3.5" />, desc: 'Your photos are ready!',   detail: 'Download them below and upload directly to Hinge, Tinder or Bumble.' },
  failed:     { label: 'Failed',     color: 'text-red-400   bg-red-400/10   border-red-400/20',       icon: <X    className="w-3.5 h-3.5" />, desc: 'Something went wrong',       detail: 'Your payment and order are safe. Contact support and we will fix it or refund you.' },
}

const PACKAGE_LABELS: Record<string, string> = { starter: 'Starter', popular: 'Popular', elite: 'Elite' }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadAll(photos: Photo[]) {
  for (let i = 0; i < photos.length; i++) {
    try {
      const res  = await fetch(photos[i].file_url)
      const blob = await res.blob()
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `swipephoto-${String(i + 1).padStart(2, '0')}.jpg`
      a.click()
      URL.revokeObjectURL(a.href)
      await new Promise(r => setTimeout(r, 300))
    } catch {
      window.open(photos[i].file_url, '_blank')
    }
  }
}

async function downloadZip(orderId: string, setLoading: (v: boolean) => void) {
  setLoading(true)
  try {
    const res = await fetch(`/api/orders/${orderId}/download-zip`)
    if (!res.ok) { alert('Download failed. Please try again.'); return }
    const blob = await res.blob()
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `swipephotos-${orderId.slice(-8).toUpperCase()}.zip`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch {
    alert('Download failed. Please try again.')
  } finally {
    setLoading(false)
  }
}

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}` }
function fmtK(n: number)    { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n) }

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', cfg.color)}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

function Spinner() {
  return <div className="w-5 h-5 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin flex-shrink-0" />
}

function PhotoGrid({ photos, orderId }: { photos: Photo[]; orderId: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [showAll, setShowAll]   = useState(false)
  const PREVIEW = 6
  const visible = showAll ? photos : photos.slice(0, PREVIEW)

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
            <img src={p.file_url} alt="" loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end justify-end p-2.5 opacity-0 group-hover:opacity-100">
              <a href={p.file_url} download onClick={e => e.stopPropagation()}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Download className="w-3.5 h-3.5 text-black" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {photos.length > PREVIEW && !showAll && (
        <button onClick={() => setShowAll(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-white text-sm py-2.5 border border-white/8 hover:border-white/20 rounded-xl transition-all">
          Show all {photos.length} photos <ChevronDown className="w-4 h-4" />
        </button>
      )}
      {showAll && photos.length > PREVIEW && (
        <button onClick={() => setShowAll(false)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-white text-sm py-2.5 border border-white/8 hover:border-white/20 rounded-xl transition-all">
          Show less <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors" onClick={() => setLightbox(null)}>
            <X className="w-5 h-5 text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-[88vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
          <a href={lightbox} download onClick={e => e.stopPropagation()}
            className="absolute bottom-6 flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-full shadow-xl hover:bg-zinc-100 transition-all">
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
      )}
    </>
  )
}

function OrderCard({ order, expanded = false }: { order: Order; expanded?: boolean }) {
  const [open, setOpen]       = useState(expanded)
  const [zipping, setZipping] = useState(false)
  const cfg    = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
  const photos = order.generated_photos ?? []
  const isActive = ['pending', 'processing', 'training', 'generating'].includes(order.status)
  const dateStr  = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className={cn('border rounded-2xl overflow-hidden transition-all', isActive ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/8 bg-[#111]')}>
      <button className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-white font-semibold text-sm">{PACKAGE_LABELS[order.package_type] ?? 'Standard'} Package</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-zinc-600 text-xs">{dateStr} · Order #{order.id.slice(-8).toUpperCase()}</p>
        </div>
        {photos.length > 0 && (
          <span className="text-zinc-500 text-xs flex items-center gap-1 flex-shrink-0">
            <ImageIcon className="w-3.5 h-3.5" />{photos.length}
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-zinc-600 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-600 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-white/5">
          <div className="flex items-start gap-3 py-4">
            {isActive && <Spinner />}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{cfg.desc}</p>
              <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{cfg.detail}</p>
            </div>
          </div>
          {photos.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</p>
                {photos.length > 1 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => downloadZip(order.id, setZipping)}
                      disabled={zipping}
                      className="flex items-center gap-1.5 text-xs bg-blue-600 hover:brightness-110 disabled:opacity-60 text-white px-3 py-1.5 rounded-full transition-all"
                    >
                      <Download className="w-3 h-3" />
                      {zipping ? 'Preparing…' : 'Download ZIP'}
                    </button>
                    <button onClick={() => downloadAll(photos)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                      <Download className="w-3.5 h-3.5" /> Individual
                    </button>
                  </div>
                )}
              </div>
              <PhotoGrid photos={photos} orderId={order.id} />
            </>
          )}
          {order.status === 'failed' && (
            <a href="mailto:support@swipephotos.net"
              className="mt-4 flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium py-3 rounded-xl transition-all">
              Contact support →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Affiliate Tab ─────────────────────────────────────────────────────────────

function AffiliateTab({ data, onJoined }: {
  data: AffiliateData
  onJoined: (updated: NonNullable<AffiliateData>) => void
}) {
  const [copied, setCopied]               = useState(false)
  const [joining, setJoining]             = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutError, setPayoutError]     = useState('')
  const [payoutSuccess, setPayoutSuccess] = useState(false)

  async function handleJoin() {
    setJoining(true)
    try {
      const res  = await fetch('/api/affiliate/join', { method: 'POST' })
      const json = await res.json()
      if (json.ok) {
        onJoined({
          id: '',
          status: json.status,
          refCode: json.refCode,
          refLink: json.refLink,
          clicks: 0, signups: 0, conversions: 0,
          pendingCents: 0, approvedCents: 0, paidCents: 0,
          totalEarnedCents: 0,
          payouts: [],
        })
      }
    } catch { /* ignore */ }
    setJoining(false)
  }

  function copyLink() {
    if (!data?.refLink) return
    navigator.clipboard.writeText(data.refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handlePayoutRequest() {
    setPayoutLoading(true)
    setPayoutError('')
    setPayoutSuccess(false)
    try {
      const res  = await fetch('/api/affiliate/payout', { method: 'POST' })
      const json = await res.json()
      if (json.ok) setPayoutSuccess(true)
      else         setPayoutError(json.error || 'Something went wrong')
    } catch { setPayoutError('Network error — please try again') }
    setPayoutLoading(false)
  }

  // ── State 1: Not yet an affiliate ─────────────────────────────────────────
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-[#111] p-8 text-center">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, #3b82f6 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-500/20">
              <DollarSign className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-white font-bold text-2xl mb-2 tracking-tight">Earn 30% commission</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Share SwipePhotos with your audience and earn 30% on every qualifying purchase — paid monthly to your account.
            </p>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="inline-flex items-center gap-2 bg-blue-600 hover:brightness-110 text-white font-semibold px-8 py-3.5 rounded-full transition-all disabled:opacity-60"
            >
              {joining ? 'Setting up…' : 'Join affiliate program →'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <DollarSign  className="w-5 h-5 text-blue-400" />,   label: '30%',  sub: 'Commission per sale' },
            { icon: <Users       className="w-5 h-5 text-purple-400" />, label: '$39',   sub: 'Average order value' },
            { icon: <TrendingUp  className="w-5 h-5 text-green-400" />,  label: '$50',   sub: 'Minimum payout' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="bg-[#111] border border-white/8 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">{icon}</div>
              <p className="text-white font-bold text-xl leading-none mb-1">{label}</p>
              <p className="text-zinc-500 text-xs">{sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#111] border border-white/8 rounded-2xl p-5 space-y-4">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">How it works</p>
          {[
            ['Join for free',            'Click the button above to get your unique referral link instantly.'],
            ['Share with your audience', 'Post your link on TikTok, YouTube, Reddit, Twitter, or Discord.'],
            ['Earn 30% on every sale',   'Any purchase made within 30 days of clicking your link counts.'],
            ['Get paid monthly',         'Request payout at $50 minimum — processed within 7 days.'],
          ].map(([title, body]) => (
            <div key={title as string} className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── State 1.5: Applied, awaiting manual approval ──────────────────────────
  // No referral link, stats or commission data until an admin approves the
  // account in /admin — mirrors the public /affiliate application flow.
  if (data.status !== 'approved') {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-950/20 to-[#111] p-8 text-center">
          <div className="relative">
            <div className="w-14 h-14 bg-yellow-600/15 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-yellow-500/20">
              <Clock className="w-7 h-7 text-yellow-400" />
            </div>
            <h2 className="text-white font-bold text-2xl mb-2 tracking-tight">Application under review</h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
              Thanks for applying to the affiliate program. We review every application manually —
              you&apos;ll get an email as soon as you&apos;re approved, and your referral link and stats
              will appear here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── State 2: Affiliate dashboard (approved) ───────────────────────────────

  const convRate       = data.clicks > 0 ? ((data.conversions / data.clicks) * 100).toFixed(1) : '0.0'
  const availableCents = data.approvedCents
  const hasPendingPayout = data.payouts.some(p => p.status === 'pending')
  const canRequestPayout = availableCents >= 5000 && !hasPendingPayout

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Referral link */}
      <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-blue-400" />
          <p className="text-white text-sm font-semibold">Your referral link</p>
        </div>
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-3">
          <code className="flex-1 text-blue-300 text-xs truncate font-mono">{data.refLink ?? '—'}</code>
          <button
            onClick={copyLink}
            className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0',
              copied ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white')}
          >
            {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
        {data.refCode && (
          <p className="text-zinc-600 text-xs mt-2">Code: <span className="text-zinc-400 font-mono">{data.refCode}</span></p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <BarChart3   className="w-4 h-4 text-blue-400" />,    label: 'Clicks',      value: fmtK(data.clicks) },
          { icon: <Users       className="w-4 h-4 text-purple-400" />,  label: 'Signups',     value: fmtK(data.signups) },
          { icon: <Check       className="w-4 h-4 text-green-400" />,   label: 'Paying',      value: fmtK(data.conversions) },
          { icon: <TrendingUp  className="w-4 h-4 text-orange-400" />,  label: 'Conv. rate',  value: `${convRate}%` },
        ].map(({ icon, label, value }) => (
          <div key={label} className="bg-[#111] border border-white/8 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">{icon}<span className="text-zinc-500 text-xs">{label}</span></div>
            <p className="text-white font-bold text-xl leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* Commission breakdown */}
      <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
        <p className="text-white text-sm font-semibold mb-4">Commission</p>
        <div className="space-y-1">
          {[
            { label: 'Pending',   value: data.pendingCents,   desc: 'Awaiting order clearance',  dot: 'bg-yellow-500' },
            { label: 'Approved',  value: data.approvedCents,  desc: 'Ready to request payout',   dot: 'bg-green-500' },
            { label: 'Paid out',  value: data.paidCents,      desc: 'Already paid',               dot: 'bg-zinc-600' },
          ].map(({ label, value, desc, dot }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2.5">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dot)} />
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-zinc-600 text-xs">{desc}</p>
                </div>
              </div>
              <p className="text-white font-semibold tabular-nums">{fmt(value)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3">
            <p className="text-zinc-400 text-sm font-semibold">Total earned</p>
            <p className="text-white font-bold text-lg tabular-nums">{fmt(data.totalEarnedCents)}</p>
          </div>
        </div>
      </div>

      {/* Payout */}
      <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-white text-sm font-semibold mb-0.5">Payout</p>
            <p className="text-zinc-500 text-xs">Minimum $50 · Processed within 7 days</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white font-bold text-xl tabular-nums">{fmt(availableCents)}</p>
            <p className="text-zinc-600 text-xs">available</p>
          </div>
        </div>

        {payoutSuccess ? (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-green-300 text-sm">Payout requested — we&apos;ll process it within 7 days.</p>
          </div>
        ) : (
          <>
            {payoutError && <p className="text-red-400 text-xs mb-3">{payoutError}</p>}
            <button
              onClick={handlePayoutRequest}
              disabled={!canRequestPayout || payoutLoading}
              className={cn('w-full py-3 rounded-xl font-semibold text-sm transition-all',
                canRequestPayout
                  ? 'bg-blue-600 hover:brightness-110 text-white'
                  : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/8'
              )}
            >
              {payoutLoading
                ? 'Requesting…'
                : hasPendingPayout
                ? 'Payout already pending'
                : canRequestPayout
                ? `Request payout (${fmt(availableCents)})`
                : `${fmt(5000 - availableCents)} more to reach minimum`}
            </button>
          </>
        )}

        {data.payouts.length > 0 && (
          <div className="mt-5">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-3">History</p>
            {data.payouts.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{fmt(p.amount_cents)}</p>
                  <p className="text-zinc-600 text-xs">{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', {
                  'bg-yellow-500/15 text-yellow-400 border-yellow-500/20': p.status === 'pending',
                  'bg-blue-500/15 text-blue-400 border-blue-500/20':       p.status === 'approved',
                  'bg-green-500/15 text-green-400 border-green-500/20':    p.status === 'paid',
                  'bg-red-500/15 text-red-400 border-red-500/20':          p.status === 'rejected',
                })}>
                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-zinc-600 text-xs">
        Questions?{' '}
        <a href="mailto:support@swipephotos.net" className="text-zinc-400 hover:text-white transition-colors underline underline-offset-2">Email support</a>
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

// ── Cancellation Modal ────────────────────────────────────────────────────────

type CancelStep = 'reason' | 'offer' | 'confirm'

const CANCEL_REASONS = [
  { id: 'too_expensive',    label: 'Too expensive' },
  { id: 'not_using',        label: 'Not using it enough' },
  { id: 'missing_features', label: 'Missing features I need' },
  { id: 'photos_quality',   label: 'Not happy with photo quality' },
  { id: 'other',            label: 'Other' },
]

function CancelModal({
  step,
  interval,
  periodEnd,
  offerUsed,
  onClose,
  onCancelled,
  onOfferAccepted,
}: {
  step: CancelStep
  interval: 'month' | 'year'
  periodEnd: number | null
  offerUsed: boolean
  onClose: () => void
  onCancelled: (periodEnd: number) => void
  onOfferAccepted: () => void
}) {
  const [currentStep, setCurrentStep] = useState<CancelStep>(step)
  const [reason, setReason]           = useState('')
  const [loading, setLoading]         = useState(false)

  const endDate = periodEnd ? new Date(periodEnd * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

  const offerText = interval === 'month' ? 'Stay free for 1 month' : '50% off your next renewal'
  const offerDesc = interval === 'month'
    ? 'Your next billing cycle is on us — no charge. You keep all your photos and can cancel after.'
    : 'Get 50% off your next yearly renewal. Your subscription continues as normal after that.'

  async function handleContinueFromReason() {
    if (!reason) return
    if (!offerUsed) {
      setCurrentStep('offer')
    } else {
      setCurrentStep('confirm')
    }
  }

  async function handleAcceptOffer() {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/apply-offer', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        onClose()
        onOfferAccepted()
      } else {
        alert(data.error || 'Could not apply offer. Please contact support.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  async function handleConfirmCancel() {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (data.ok) {
        onCancelled(data.periodEnd)
        onClose()
      } else {
        alert(data.error || 'Could not cancel. Please contact support.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Step 1 — Reason */}
        {currentStep === 'reason' && (
          <>
            <h3 className="text-white font-bold text-lg mb-1">Why are you cancelling?</h3>
            <p className="text-zinc-500 text-sm mb-5">Your feedback helps us improve.</p>
            <div className="space-y-2 mb-5">
              {CANCEL_REASONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all',
                    reason === r.id
                      ? 'border-blue-500/50 bg-blue-500/10 text-white'
                      : 'border-white/8 text-zinc-400 hover:border-white/20 hover:text-white'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:text-white transition-all"
              >
                Keep plan
              </button>
              <button
                onClick={handleContinueFromReason}
                disabled={!reason}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-sm font-medium transition-all"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Retention offer */}
        {currentStep === 'offer' && (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <span className="text-2xl">🎁</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-2">{offerText}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{offerDesc}</p>
            </div>
            <button
              onClick={handleAcceptOffer}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:brightness-110 disabled:opacity-50 text-white text-sm font-semibold transition-all mb-3"
            >
              {loading ? 'Applying…' : 'Accept offer'}
            </button>
            <button
              onClick={() => setCurrentStep('confirm')}
              disabled={loading}
              className="w-full py-2.5 text-zinc-500 hover:text-zinc-300 text-sm transition-all"
            >
              No thanks, cancel anyway
            </button>
          </>
        )}

        {/* Step 3 — Final confirm */}
        {currentStep === 'confirm' && (
          <>
            <h3 className="text-white font-bold text-lg mb-2">Cancel your subscription?</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              {endDate
                ? `You'll keep access to all your photos until ${endDate}. After that, no more AI photos will be generated.`
                : "You'll keep access until the end of the current billing period."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:text-white transition-all"
              >
                Keep plan
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-50 text-sm font-medium transition-all"
              >
                {loading ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardClient({
  orders,
  userEmail,
  initialCancelled = false,
  hasActiveSubscription = false,
  subscriptionPeriodEnd = null,
  subscriptionInterval = 'month',
  retentionOfferUsed = false,
  affiliateData: initialAffiliateData = null,
}: {
  orders: Order[]
  userEmail: string
  initialCancelled?: boolean
  hasActiveSubscription?: boolean
  subscriptionPeriodEnd?: number | null
  subscriptionInterval?: 'month' | 'year'
  retentionOfferUsed?: boolean
  affiliateData?: AffiliateData
}) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { signOut }  = useClerk()

  const [tab, setTab]                     = useState<Tab>((searchParams.get('tab') as Tab) || 'overview')
  const [cancelled, setCancelled]         = useState(initialCancelled)
  const [periodEnd, setPeriodEnd]         = useState<number | null>(subscriptionPeriodEnd)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [offerApplied, setOfferApplied]   = useState(false)
  const [loggingOut, setLoggingOut]       = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting]           = useState(false)
  const [deleteError, setDeleteError]     = useState<string|null>(null)
  const [affiliateData, setAffiliateData] = useState<AffiliateData>(initialAffiliateData)

  const activeOrder     = orders.find(o => ['pending', 'processing', 'training', 'generating'].includes(o.status))
  const completedOrders = orders.filter(o => o.status === 'ready')
  const hasPhotos       = orders.some(o => (o.generated_photos ?? []).length > 0)

  const pollTick = useCallback(async () => {
    if (!activeOrder) return
    if (activeOrder.status === 'generating') {
      try {
        const res  = await fetch(`/api/orders/${activeOrder.id}/poll`)
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
    await signOut()
    router.push('/')
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) {
        setDeleteError(data.error || 'Deletion failed. Please contact support@swipephotos.net')
        setDeleting(false)
        return
      }
      // Account is gone — clear the local session and leave
      await signOut().catch(() => {})
      window.location.href = '/'
    } catch {
      setDeleteError('Something went wrong. Please try again or contact support@swipephotos.net')
      setDeleting(false)
    }
  }

  async function handleReactivate() {
    try {
      const res = await fetch('/api/subscription/reactivate', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setCancelled(false)
      } else {
        alert(data.error || 'Could not reactivate. Please contact support.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    }
  }

  function switchTab(t: Tab) {
    setTab(t)
    const params = new URLSearchParams(searchParams.toString())
    if (t === 'overview') params.delete('tab')
    else params.set('tab', t)
    router.replace(`/dashboard${params.size ? `?${params}` : ''}`, { scroll: false })
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'affiliate', label: 'Affiliate' },
    { id: 'account',   label: 'Account' },
  ]

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white/[0.04] border border-white/8 rounded-2xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={cn(
              'flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all relative',
              tab === t.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {t.label}
            {t.id === 'affiliate' && !affiliateData && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-blue-600 rounded-full text-[9px] text-white font-bold align-middle">$</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ──────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">
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

          {!activeOrder && !hasPhotos && orders.length > 0 && (
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

          {orders.length > 0 ? (
            <div className="space-y-3">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide px-1">
                {orders.length === 1 ? 'Your order' : `${orders.length} orders`}
              </p>
              {orders.map((order, i) => (
                <OrderCard key={order.id} order={order} expanded={i === 0} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-9 h-9 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Create your first photo set</h2>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
                Choose a setting, upload your photos, and preview what SwipePhotos can create for you.
              </p>
              <a href="/onboarding"
                className="inline-flex items-center gap-2 bg-blue-600 hover:brightness-110 text-white font-semibold px-8 py-3.5 rounded-full transition-all">
                Get started for free →
              </a>
            </div>
          )}

          {completedOrders.length > 1 && (
            <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold">All photos</p>
                <button onClick={() => downloadAll(completedOrders.flatMap(o => o.generated_photos))}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download all
                </button>
              </div>
              <PhotoGrid photos={completedOrders.flatMap(o => o.generated_photos)} orderId="all" />
            </div>
          )}
        </div>
      )}

      {/* ── Affiliate ─────────────────────────────────────────────────── */}
      {tab === 'affiliate' && (
        <AffiliateTab
          data={affiliateData}
          onJoined={updated => setAffiliateData(updated)}
        />
      )}

      {/* ── Account ───────────────────────────────────────────────────── */}
      {tab === 'account' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-3">Account</p>
            <p className="text-white text-sm">{userEmail}</p>
          </div>

          {hasActiveSubscription && (
            <div className="border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-white font-semibold text-sm mb-0.5">Subscription</p>
                  <p className="text-zinc-500 text-xs">
                    {offerApplied
                      ? 'Offer applied — enjoy your discount!'
                      : cancelled && periodEnd
                        ? `Cancelled — access until ${new Date(periodEnd * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                        : cancelled
                          ? 'Cancelled — you keep access until the end of the billing period.'
                          : 'Cancel anytime.'}
                  </p>
                </div>
                {!cancelled && !offerApplied && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="text-zinc-500 hover:text-red-400 text-xs font-medium border border-white/8 hover:border-red-400/30 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                )}
                {cancelled && (
                  <button
                    onClick={handleReactivate}
                    className="text-blue-400 hover:text-blue-300 text-xs font-medium border border-blue-500/20 hover:border-blue-400/40 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          )}

          {showCancelModal && (
            <CancelModal
              step="reason"
              interval={subscriptionInterval}
              periodEnd={periodEnd}
              offerUsed={retentionOfferUsed}
              onClose={() => setShowCancelModal(false)}
              onCancelled={(end) => { setCancelled(true); setPeriodEnd(end) }}
              onOfferAccepted={() => setOfferApplied(true)}
            />
          )}

          <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
            <button onClick={handleLogout} disabled={loggingOut}
              className="flex items-center gap-2 text-zinc-400 hover:text-red-400 text-sm transition-colors">
              <LogOut className="w-4 h-4" />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>

          {/* Danger zone */}
          <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5">
            <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-2">Danger zone</p>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">Delete account</p>
                <p className="text-zinc-500 text-xs">Permanently delete your account and all your photos.</p>
              </div>
              <button
                onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(null) }}
                className="text-red-400 hover:text-red-300 text-xs font-medium border border-red-500/30 hover:border-red-400/50 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all"
              >
                Delete account
              </button>
            </div>
          </div>

          <div className="flex gap-4 px-1">
            <a href="/privacy" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">Privacy Policy</a>
            <a href="/terms"   className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">Terms of Service</a>
            <a href="mailto:support@swipephotos.net" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">Support</a>
          </div>

          {/* Delete confirmation modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
              onClick={() => !deleting && setShowDeleteModal(false)}>
              <div className="w-full max-w-md bg-[#141414] border border-red-500/25 rounded-3xl p-6"
                onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-white text-lg font-bold mb-1.5">Delete your account forever?</h3>
                <p className="text-zinc-400 text-sm mb-4">This action is <span className="text-red-400 font-semibold">permanent and cannot be undone</span>. When you delete your account:</p>
                <ul className="space-y-2 mb-5">
                  {[
                    'All your generated AI photos are permanently deleted — they cannot be recovered',
                    'Your order history and uploaded photos are erased',
                    'Any active subscription is cancelled immediately',
                    'Your affiliate account and unpaid commissions are removed',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      <span className="text-zinc-400 text-xs leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-zinc-500 text-xs mb-2">Type <span className="text-white font-mono font-semibold">DELETE</span> to confirm:</p>
                <input
                  type="text" value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE" autoFocus
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-red-500/50 mb-3 font-mono"
                />
                {deleteError && <p className="text-red-400 text-xs mb-3">{deleteError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setShowDeleteModal(false)} disabled={deleting}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 transition-all disabled:opacity-50">
                    Keep my account
                  </button>
                  <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleting}
                    className={cn('flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                      deleteConfirmText === 'DELETE' && !deleting ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}>
                    {deleting ? <><div className="w-4 h-4 rounded-full border-2 border-red-300/30 border-t-red-200 animate-spin" /> Deleting…</> : 'Delete forever'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </main>
  )
}
