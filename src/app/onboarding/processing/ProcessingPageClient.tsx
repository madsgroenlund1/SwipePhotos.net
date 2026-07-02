'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const STAGES = [
  { label: 'Uploading your photos securely...', pct: 10 },
  { label: 'AI is analyzing your features...', pct: 30 },
  { label: 'Training your personal AI model...', pct: 70 },
  { label: 'Generating your photos...', pct: 90 },
  { label: 'Applying finishing touches...', pct: 99 },
  { label: 'Your photos are ready! 🎉', pct: 100 },
]

export function ProcessingPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id')

  const [stageIdx, setStageIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let stage = 0
    const interval = setInterval(() => {
      if (stage < STAGES.length - 1) {
        stage++
        setStageIdx(stage)
        setProgress(STAGES[stage].pct)
      } else {
        clearInterval(interval)
        pollOrder()
      }
    }, 8000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function pollOrder() {
    if (!orderId) return
    let attempts = 0
    const poll = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/orders/${orderId}/status`)
        const data = await res.json()
        if (data.status === 'ready') {
          clearInterval(poll)
          router.push(`/dashboard?order=${orderId}`)
        } else if (data.status === 'failed') {
          clearInterval(poll)
          setFailed(true)
        }
      } catch {}
      if (attempts > 60) {
        clearInterval(poll)
        setFailed(true)
      }
    }, 10000)
  }

  const stage = STAGES[stageIdx]
  const minutesLeft = Math.max(0, Math.round((STAGES.length - stageIdx - 1) * 8 / 60))

  if (failed) return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-zinc-400 mb-8 max-w-sm">Your photos couldn&apos;t be generated. Please contact support and we&apos;ll fix it immediately.</p>
      <a href="mailto:support@swipephotos.net" className="bg-blue-600 hover:brightness-110 text-white font-semibold px-8 py-3 rounded-full transition-all">
        Contact Support →
      </a>
      <Link href="/dashboard" className="mt-4 text-zinc-500 hover:text-white text-sm transition-colors">Go to dashboard</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-0">
        <span className="text-white font-bold text-xl">SwipePhotos</span>
        <span className="text-blue-500 font-bold text-xl">.net</span>
      </Link>

      <div className="w-20 h-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-8" />

      <h1 className="text-3xl font-bold text-white mb-2">
        {stageIdx === STAGES.length - 1 ? 'Your photos are ready! 🎉' : 'Generating your photos'}
      </h1>
      <p className="text-zinc-400 text-lg mb-10">{stage.label}</p>

      <div className="w-full max-w-md bg-white/5 rounded-full h-3 mb-4 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-[3000ms] ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-zinc-500 text-sm mb-2">{progress}% complete</p>

      {minutesLeft > 0 && (
        <p className="text-zinc-600 text-sm">Estimated time remaining: ~{minutesLeft} minutes</p>
      )}

      <div className="mt-12 bg-white/3 border border-white/8 rounded-2xl p-6 max-w-md w-full">
        <p className="text-zinc-400 text-sm">
          📧 You&apos;ll also receive an email when your photos are ready. Feel free to close this tab.
        </p>
      </div>
    </div>
  )
}
