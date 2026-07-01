'use client'

import { useState } from 'react'
import { Download, Copy, Check, X, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type Photo = { file_url: string }
type Order = {
  id: string
  package_type: string
  status: string
  created_at: string
  generated_photos: Photo[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  pending:    { label: 'Pending',    color: 'text-zinc-400  bg-zinc-400/10  border-zinc-400/20',  icon: <Clock className="w-3.5 h-3.5" />, desc: 'Payment processing...' },
  processing: { label: 'Processing', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: <Clock className="w-3.5 h-3.5" />, desc: 'Uploading your photos...' },
  training:   { label: 'Training',   color: 'text-blue-400  bg-blue-400/10  border-blue-400/20',  icon: <Zap  className="w-3.5 h-3.5" />, desc: 'AI is learning your face (~20 min)' },
  generating: { label: 'Generating', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: <Zap className="w-3.5 h-3.5" />, desc: 'Creating your photos...' },
  ready:      { label: 'Ready',      color: 'text-green-400  bg-green-400/10  border-green-400/20',  icon: <Check className="w-3.5 h-3.5" />, desc: 'Your photos are ready!' },
  failed:     { label: 'Failed',     color: 'text-red-400   bg-red-400/10   border-red-400/20',   icon: <X    className="w-3.5 h-3.5" />, desc: 'Something went wrong' },
}

export function DashboardClient({ orders, refLink }: { orders: Order[]; refLink: string | null }) {
  const [copied, setCopied] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  function copyRef() {
    if (!refLink) return
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const latestOrder = orders[0]

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

      {/* Empty state */}
      {!orders.length && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No orders yet</h2>
          <p className="text-zinc-500 mb-8">Get your first set of AI dating photos</p>
          <a href="/onboarding" className="bg-blue-600 hover:brightness-110 text-white font-semibold px-8 py-3 rounded-full transition-all">
            Get Started →
          </a>
        </div>
      )}

      {/* Latest order hero */}
      {latestOrder && (
        <div className="mb-10">
          {/* Status banner */}
          {latestOrder.status !== 'ready' && (
            <div className="bg-[#111] border border-white/8 rounded-2xl p-6 mb-6 flex items-center gap-4">
              {(latestOrder.status === 'training' || latestOrder.status === 'generating') && (
                <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin flex-shrink-0" />
              )}
              <div>
                <p className="text-white font-semibold">
                  {STATUS_CONFIG[latestOrder.status]?.desc || 'Working on your order...'}
                </p>
                {latestOrder.status === 'training' && (
                  <p className="text-zinc-500 text-sm mt-1">We&apos;ll email you at support@swipephotos.net when ready. You can close this tab.</p>
                )}
              </div>
              <span className={cn('ml-auto text-xs font-medium px-3 py-1.5 rounded-full border flex items-center gap-1.5 flex-shrink-0', STATUS_CONFIG[latestOrder.status]?.color)}>
                {STATUS_CONFIG[latestOrder.status]?.icon}
                {STATUS_CONFIG[latestOrder.status]?.label}
              </span>
            </div>
          )}

          {/* Photos grid */}
          {latestOrder.status === 'ready' && latestOrder.generated_photos?.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Photos</h2>
                  <p className="text-zinc-500 text-sm mt-0.5">{latestOrder.generated_photos.length} photos generated</p>
                </div>
                <a
                  href={`/api/orders/${latestOrder.id}/download`}
                  className="flex items-center gap-2 bg-blue-600 hover:brightness-110 text-white font-semibold px-5 py-2.5 rounded-full transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download All
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {latestOrder.generated_photos.map((photo, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-2xl overflow-hidden relative group cursor-pointer bg-zinc-900"
                    onClick={() => setLightbox(photo.file_url)}
                  >
                    <img src={photo.file_url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100">
                      <a
                        href={photo.file_url}
                        download
                        onClick={e => e.stopPropagation()}
                        className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Download className="w-4 h-4 text-black" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Previous orders */}
      {orders.length > 1 && (
        <section className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-4">Previous Orders</h3>
          <div className="space-y-3">
            {orders.slice(1).map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              return (
                <div key={order.id} className="bg-[#111] border border-white/8 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white text-sm font-medium capitalize">{order.package_type} Package</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs font-medium px-3 py-1 rounded-full border flex items-center gap-1', cfg.color)}>
                      {cfg.icon}{cfg.label}
                    </span>
                    {order.status === 'ready' && (
                      <a href={`/api/orders/${order.id}/download`} className="text-zinc-400 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Refer & Earn */}
      <section className="bg-gradient-to-br from-blue-600/10 to-purple-600/5 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Refer &amp; Earn 30%</h3>
            <p className="text-zinc-400 text-sm">Share your link and earn 30% on every sale. Paid out monthly.</p>
          </div>
          <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-500/20">
            Affiliate Program
          </span>
        </div>
        {refLink ? (
          <div className="flex items-center gap-2 mt-5 bg-black/30 border border-white/10 rounded-xl p-3">
            <code className="flex-1 text-zinc-300 text-sm truncate">{refLink}</code>
            <button
              onClick={copyRef}
              className={cn('flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-all flex-shrink-0', copied ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white')}
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        ) : (
          <a href="/affiliate" className="inline-flex items-center gap-2 mt-5 bg-blue-600 hover:brightness-110 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all">
            Apply for Affiliate →
          </a>
        )}
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
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
    </main>
  )
}
