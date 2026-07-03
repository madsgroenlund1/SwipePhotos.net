'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const STAGES = [
  { label: 'Uploading your photos securely', icon: '☁️', pct: 15 },
  { label: 'Analyzing your features', icon: '🔍', pct: 35 },
  { label: 'Swapping face into model photos', icon: '🧠', pct: 60 },
  { label: 'Applying finishing touches', icon: '✨', pct: 85 },
  { label: 'Your photos are ready!', icon: '🎉', pct: 100 },
]

// Face-swap takes ~30-60 sec per job. Advance stages every 12 sec so animation
// completes around the time real jobs finish, then poll until actually ready.
const STAGE_INTERVAL_MS = 12000

export function ProcessingPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id')
  const sessionId = searchParams.get('session_id')

  const [stageIdx, setStageIdx] = useState(0)
  const [failed, setFailed] = useState(false)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [actuallyReady, setActuallyReady] = useState(false)

  // Start polling for order status immediately — face-swap is fast (~30-60 sec)
  useEffect(() => {
    if (!orderId || orderId === 'undefined') { setFailed(true); return }

    let stopped = false
    let attempts = 0

    // Fallback: if Stripe webhook never fired, trigger pipeline via session_id
    if (sessionId) {
      fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, orderId }),
      }).catch(console.error)
    }

    const poll = setInterval(async () => {
      if (stopped) return
      attempts++
      try {
        // Poll the face-swap jobs first so they get saved
        await fetch(`/api/orders/${orderId}/poll`).catch(() => {})

        const res = await fetch(`/api/orders/${orderId}/status`)
        const data = await res.json()

        if (data.status === 'ready') {
          stopped = true
          clearInterval(poll)
          setActuallyReady(true)
          router.push(`/dashboard?order=${orderId}`)
        } else if (data.status === 'failed') {
          stopped = true
          clearInterval(poll)
          setFailed(true)
        }
      } catch { /* ignore */ }

      if (attempts > 180) { // 30 min max
        stopped = true
        clearInterval(poll)
        setFailed(true)
      }
    }, 10000)

    return () => { stopped = true; clearInterval(poll) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  // Visual animation — runs independently of actual polling
  useEffect(() => {
    let stage = 0
    let currentPct = 0
    let targetPct = STAGES[0].pct

    const ticker = setInterval(() => {
      const ceiling = targetPct - 1
      if (currentPct < ceiling) {
        const gap = ceiling - currentPct
        const speed = gap > 20 ? 0.8 : gap > 5 ? 0.3 : 0.1
        currentPct = Math.min(currentPct + speed, ceiling)
        setDisplayProgress(currentPct)
      }
    }, 200)

    const stager = setInterval(() => {
      if (stage < STAGES.length - 1) {
        stage++
        setStageIdx(stage)
        targetPct = STAGES[stage].pct
        currentPct = targetPct
        setDisplayProgress(targetPct)
      } else {
        clearInterval(stager)
        clearInterval(ticker)
      }
    }, STAGE_INTERVAL_MS)

    return () => { clearInterval(ticker); clearInterval(stager) }
  }, [])

  const stage = STAGES[stageIdx]
  const timerDone = stageIdx === STAGES.length - 1
  const isDone = actuallyReady

  if (failed) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 text-center">
      <Link href="/" className="absolute top-6 left-6 flex items-center">
        <span className="text-white font-bold text-lg">SwipePhotos</span>
        <span className="text-blue-500 font-bold text-lg">.net</span>
      </Link>
      <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <svg className="w-9 h-9 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Generation failed</h1>
      <p className="text-zinc-500 mb-8 max-w-sm text-sm leading-relaxed">Something went wrong with your photos. Contact us and we&apos;ll fix it or give you a full refund.</p>
      <a href="mailto:support@swipephotos.net" className="bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-zinc-100 transition-all text-sm">
        Contact Support →
      </a>
      <Link href="/dashboard" className="mt-4 text-zinc-600 hover:text-zinc-400 text-sm transition-colors">Go to dashboard</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col px-6">
      <div className="flex items-center justify-between py-5 max-w-lg mx-auto w-full">
        <Link href="/" className="flex items-center">
          <span className="text-white font-bold text-lg">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-lg">.net</span>
        </Link>
        <span className="text-xs text-zinc-600 border border-white/8 rounded-full px-3 py-1">Order #{orderId?.slice(-6).toUpperCase()}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full pb-16">

        <div className="relative mb-10">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/20 flex items-center justify-center">
            {isDone ? (
              <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <div className={`w-10 h-10 rounded-full border-2 border-t-blue-400 animate-spin ${timerDone ? 'border-blue-500/60' : 'border-blue-500/30'}`} />
            )}
          </div>
          <div className="absolute inset-0 rounded-full border border-blue-500/10 scale-125 animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">
          {isDone ? 'Photos are ready!' : 'Creating your photos'}
        </h1>
        <p className="text-zinc-500 text-base mb-10 text-center">
          {isDone
            ? 'Redirecting you to your dashboard...'
            : timerDone
            ? 'Almost there — finishing up your photos...'
            : 'AI is generating your dating photos'}
        </p>

        <div className="w-full mb-3">
          <div className="flex justify-between text-xs text-zinc-600 mb-2">
            <span>{stage.icon} {stage.label}</span>
            <span>{Math.round(displayProgress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-none"
              style={{ width: `${displayProgress}%`, background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }}
            />
          </div>
        </div>

        <div className="w-full mt-8 space-y-2">
          {STAGES.slice(0, -1).map((s, i) => {
            const done = i < stageIdx
            const active = i === stageIdx
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${active ? 'bg-blue-500/8 border border-blue-500/15' : 'opacity-40'}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-blue-500 border-blue-500' : active ? 'border-blue-400' : 'border-white/20'}`}>
                  {done ? (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : active ? (
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                  )}
                </div>
                <span className={`text-sm font-medium ${done ? 'text-zinc-400' : active ? 'text-white' : 'text-zinc-600'}`}>
                  {s.label}
                </span>
                {active && <span className="ml-auto text-[10px] text-blue-400 font-medium animate-pulse">In progress</span>}
                {done && <span className="ml-auto text-[10px] text-zinc-600">Done</span>}
              </div>
            )
          })}
        </div>

        <div className="mt-10 w-full bg-white/[0.03] border border-white/8 rounded-2xl px-5 py-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-0.5">We&apos;ll email you when ready</p>
            <p className="text-zinc-500 text-xs leading-relaxed">Feel free to close this tab — your photos will be waiting in your dashboard and inbox.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
