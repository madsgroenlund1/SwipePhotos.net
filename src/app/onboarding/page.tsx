'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7

const STYLE_OPTIONS = [
  { id: 'restaurant', label: 'Italian Restaurant', src: '/photos/presets/scene-restaurant.jpg', free: true },
  { id: 'formal', label: 'Smart Formal', src: '/photos/presets/scene-formal.jpg', free: true },
  { id: 'rooftop', label: 'Rooftop Pool', src: '/photos/presets/scene-rooftop.jpg', free: true },
  { id: 'beach', label: 'Beach Club', src: '/photos/presets/scene-beach.jpg', free: true },
]

const CAROUSEL_PHOTOS: Record<string, string[]> = {
  restaurant: [
    '/photos/before-after/julius/after/1.jpg',
    '/photos/before-after/alex/after/1.jpg',
    '/photos/before-after/benni/after/1.jpg',
  ],
  formal: [
    '/photos/before-after/andreas/after/1.jpg',
    '/photos/before-after/jason/after/1.jpg',
    '/photos/before-after/black/after/1.jpg',
  ],
  rooftop: [
    '/photos/before-after/benni/after/1.jpg',
    '/photos/before-after/julius/after/1.jpg',
    '/photos/before-after/alex/after/1.jpg',
  ],
  beach: [
    '/photos/before-after/black/after/1.jpg',
    '/photos/before-after/jason/after/1.jpg',
    '/photos/before-after/benni/after/1.jpg',
  ],
}

const DID_YOU_KNOW = [
  'The templates are picked by professional dating coaches',
  'The bottom 50% of profiles only get 4% of the likes!',
  'Better photos = less texting needed',
  'SwipePhotos users report more matches after upgrading their profile',
  'Top 10% of profiles get 58% of all likes on Hinge',
  'Your first photo determines 90% of your swipe rate',
  'Professional-looking photos can double your match rate',
  'Most dating coaches recommend quality photos above all',
  'We preserve your real hair, skin tone, and features',
  'Natural lighting is the most important factor in a good photo',
  'Face-forward photos perform best on Hinge and Bumble',
]

const PACKAGES = {
  monthly: [
    { id: 'starter', name: 'Starter', priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID, price: '$19', perMonth: '$19', photos: '20 AI photos / month', popular: false },
    { id: 'popular', name: 'Popular', priceId: process.env.NEXT_PUBLIC_STRIPE_POPULAR_PRICE_ID, price: '$39', perMonth: '$39', photos: '40 AI photos / month', popular: true },
  ],
  yearly: [
    { id: 'starter_yearly', name: 'Starter', priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID, price: '$114', perMonth: '$9.50', photos: '20 AI photos / month', popular: false },
    { id: 'popular_yearly', name: 'Popular', priceId: process.env.NEXT_PUBLIC_STRIPE_POPULAR_YEARLY_PRICE_ID, price: '$234', perMonth: '$19.50', photos: '40 AI photos / month', popular: true },
  ],
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total, onBack }: { step: number; total: number; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {onBack && (
        <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [hasTattoos, setHasTattoos] = useState<boolean | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('restaurant')
  const [progress, setProgress] = useState(0)
  const [didYouKnowIdx, setDidYouKnowIdx] = useState(0)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState<string>('popular')
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [generatedPhotos, setGeneratedPhotos] = useState<Record<string, string>>({})
  const [genError, setGenError] = useState<string | null>(null)
  const [pickedPreviewUrl, setPickedPreviewUrl] = useState<string | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const targetProgressRef = useRef(0)
  const displayProgressRef = useRef(0)
  const userPhotoUrl = photos.length > 0 ? URL.createObjectURL(photos[0]) : null
  const fallbackPhotos = CAROUSEL_PHOTOS[selectedStyle] ?? CAROUSEL_PHOTOS.restaurant
  const generatedArray = Object.values(generatedPhotos).filter(Boolean) as string[]
  const hasGenerated = generatedArray.length > 0
  const selectedAiPhoto = pickedPreviewUrl
    ?? (hasGenerated ? (generatedArray[carouselIdx] ?? generatedArray[0]) : fallbackPhotos[carouselIdx % fallbackPhotos.length])

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    setPhotos(prev => [...prev, ...files].slice(0, 20))
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
    setPhotos(prev => [...prev, ...files].slice(0, 20))
  }, [])

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  // Compress + resize image to max 1024px, JPEG 85% — keeps under Vercel's 4.5MB request limit
  function compressImage(file: File, maxPx = 1024, quality = 0.85): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        canvas.toBlob(blob => {
          // Fall back to original if blob is null or empty (can happen on mobile Safari)
          resolve((blob && blob.size > 0) ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file)
        }, 'image/jpeg', quality)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

  // Step 4: submit preview jobs to fal.ai queue, then poll for results
  useEffect(() => {
    if (step !== 4) return
    setProgress(0)
    setDidYouKnowIdx(0)
    setGeneratedPhotos({})
    setGenError(null)
    setPickedPreviewUrl(null)
    setCarouselIdx(0)
    targetProgressRef.current = 0
    displayProgressRef.current = 0

    // Time-based progress: always moves forward over ~110 seconds, never stops
    const START_TIME = Date.now()
    const DURATION_MS = 110_000 // 110 seconds to reach 95% on its own
    let didYouKnowTick = 0

    progressRef.current = setInterval(() => {
      didYouKnowTick++
      setDidYouKnowIdx(Math.floor(didYouKnowTick / 20) % DID_YOU_KNOW.length)

      const elapsed = Date.now() - START_TIME
      // Ease-out curve: fast start, slows near 95%
      const timePct = Math.min(95, (elapsed / DURATION_MS) * 100 * (1 - elapsed / DURATION_MS / 3))
      const target = Math.max(targetProgressRef.current, timePct)
      targetProgressRef.current = target

      const current = displayProgressRef.current
      if (current < target) {
        const diff = target - current
        const step = Math.max(0.15, diff * 0.06)
        const next = Math.min(target, current + step)
        displayProgressRef.current = next
        setProgress(next)
      }
    }, 100)

    async function startGeneration() {
      if (photos.length === 0) {
        targetProgressRef.current = 100
        return
      }

      try {
        const fd = new FormData()
        fd.append('photo', photos[0])
        fd.append('style', selectedStyle)
        fd.append('hasTattoos', String(hasTattoos === true))
        const res = await fetch('/api/generate/preview', { method: 'POST', body: fd })
        const data = await res.json() as {
          photos?: Record<string, string>
          done?: boolean
          requestIds?: string[]
          styles?: string[]
          error?: string
        }

        // New face-swap path: results come back directly
        if (data.photos && Object.keys(data.photos).length > 0) {
          setGeneratedPhotos(data.photos)
          targetProgressRef.current = 100
          return
        }

        // Legacy InstantID polling path (fallback)
        if (!data.requestIds?.length) {
          console.warn('[preview] No results, falling back to examples')
          targetProgressRef.current = 100
          return
        }

        const { requestIds, styles } = data as { requestIds: string[]; styles: string[] }

        pollingRef.current = setInterval(async () => {
          try {
            const pollRes = await fetch(
              `/api/generate/preview/poll?ids=${requestIds.join(',')}&styles=${styles.join(',')}`
            )
            const poll = await pollRes.json() as {
              photos: Record<string, string>
              done: boolean
              completedCount: number
              total: number
            }

            if (Object.keys(poll.photos).length > 0) {
              setGeneratedPhotos(prev => ({ ...prev, ...poll.photos }))
            }

            if (poll.done) {
              targetProgressRef.current = 100
              clearInterval(pollingRef.current!)
            }
          } catch (err) {
            console.error('[preview] Poll error:', err)
          }
        }, 3000)
      } catch (err) {
        console.error('[preview] Submit error:', err)
        targetProgressRef.current = 100
      }
    }

    startGeneration()
    return () => {
      if (progressRef.current) clearInterval(progressRef.current!)
      if (pollingRef.current) clearInterval(pollingRef.current!)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  async function handleEmailSubmit() {
    if (!email.includes('@') || !agreedToTerms) return
    setLoading(true)
    setCheckoutError(null)
    try {
      // 1. Create order + get Stripe URL
      const currentPkgs = PACKAGES[billing]
      const pkg = currentPkgs.find(p => p.id === selectedPackage) || currentPkgs.find(p => p.popular) || currentPkgs[0]
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, priceId: pkg.priceId, email, style: selectedStyle, hasTattoos: hasTattoos === true }),
      })
      const data = await res.json()
      console.log('[checkout response]', data)

      if (!res.ok || data.error) {
        setCheckoutError(data.error || `Something went wrong (${res.status}). Please try again.`)
        setLoading(false)
        return
      }

      // 2. Upload photos (compressed to stay under Vercel's 4.5MB body limit)
      if (data.orderId && photos.length > 0) {
        const compressed = await Promise.all(photos.map(p => compressImage(p)))
        const fd = new FormData()
        fd.append('orderId', data.orderId)
        for (const photo of compressed) fd.append('files', photo)
        await fetch('/api/upload', { method: 'POST', body: fd }).catch(console.error)
      }

      // 3. Redirect to Stripe
      if (data.url) {
        window.location.href = data.url
        return
      }

      setCheckoutError('No payment URL received. Please try again.')
    } catch (err) {
      setCheckoutError(`Something went wrong. Please try again. (${err})`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Logo */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-0">
          <span className="text-white font-bold text-lg">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-lg">.net</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pt-14 pb-6">
        <div className="w-full max-w-sm">

          {/* ── STEP 1: Intro ────────────────────────────────────── */}
          {step === 1 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-0">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-0">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '11%' }} />
                </div>
              </div>
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center min-h-[400px]">
                <h1 className="text-4xl font-bold text-white leading-tight mb-3">
                  Generate your first AI photo{' '}
                  <span className="text-blue-500">for free</span>
                </h1>
                <p className="text-zinc-500 text-base">Takes 60 seconds. No login required.</p>
              </div>
              <div className="px-4 pb-4">
                <button onClick={next} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Pick style ───────────────────────────────── */}
          {step === 2 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-4">
                <ProgressBar step={2} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-white mb-1">Pick the photo you want</h2>
              </div>
              <div className="px-4 pb-2 grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <div key={opt.id} className="relative" onClick={() => setSelectedStyle(opt.id)}>
                    <div className={cn(
                      'relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer',
                      selectedStyle === opt.id ? 'border-blue-500' : 'border-white/10'
                    )}>
                      <img src={opt.src} alt={opt.label} className="w-full h-full object-cover object-top" />
                      {selectedStyle === opt.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>
                    <p className="text-zinc-400 text-xs mt-1.5 text-center">{opt.label}</p>
                  </div>
                ))}
              </div>
              {/* Blur teaser – more templates */}
              <div className="relative px-4 mt-1 mb-2 overflow-hidden" style={{ height: 80 }}>
                <div className="grid grid-cols-4 gap-1.5 opacity-50">
                  {[
                    '/photos/presets/scene-restaurant.jpg',
                    '/photos/presets/scene-formal.jpg',
                    '/photos/presets/scene-rooftop.jpg',
                    '/photos/presets/scene-beach.jpg',
                  ].map((src, i) => (
                    <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover object-top" />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent flex items-end justify-center pb-2">
                  <p className="text-zinc-500 text-xs font-medium">Browse 100+ proven templates after purchase</p>
                </div>
              </div>
              <div className="px-4 pb-4 pt-1">
                <button onClick={next} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Upload ───────────────────────────────────── */}
          {step === 3 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-4">
                <ProgressBar step={3} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-white mb-1">Upload your best photos</h2>
              </div>

              <div className="px-4 pb-2">
                {/* Requirements */}
                <div className="mb-4 bg-blue-500/8 border border-blue-500/20 rounded-2xl p-3.5">
                  <p className="text-blue-400 text-xs font-semibold mb-2">Tips for the best results</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {[
                      'Face clearly visible',
                      'Natural lighting',
                      'No sunglasses or hats',
                      'Not a group photo',
                    ].map(r => (
                      <div key={r} className="flex items-start gap-1.5">
                        <svg className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <span className="text-zinc-400 text-[11px] leading-tight">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Good */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-green-400 text-xs font-semibold">Good</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      '/photos/before-after/julius/before/good-1.webp',
                      '/photos/before-after/julius/before/good-2.webp',
                    ].map((src) => (
                      <div key={src} className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-green-500/60">
                        <img src={src} alt="good" className="w-full h-full object-cover object-top" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bad scroll */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    <span className="text-red-400 text-xs font-semibold">Bad</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {[
                      { src: '/photos/before-after/julius/before/bad-mirror-selfie.webp', label: 'Mirror selfie' },
                      { src: '/photos/before-after/julius/before/bad-sunglasses.webp', label: 'Sunglasses' },
                      { src: '/photos/before-after/julius/before/bad-group-photo.webp', label: 'Group photo' },
                      { src: '/photos/before-after/julius/before/bad-dark.webp', label: 'Too dark' },
                      { src: '/photos/before-after/julius/before/bad-jacket.webp', label: 'Jacket' },
                      { src: '/photos/before-after/julius/before/bad-bright.webp', label: 'Too bright' },
                      { src: '/photos/before-after/julius/before/bad-selfie.webp', label: 'Selfie angle' },
                      { src: '/photos/before-after/julius/before/bad-posture.webp', label: 'Bad posture' },
                      { src: '/photos/before-after/julius/before/bad-holding.webp', label: 'Holding object' },
                      { src: '/photos/before-after/julius/before/bad-too-far.webp', label: 'Too far away' },
                    ].map(({ src, label }) => (
                      <div key={label} className="flex-shrink-0" style={{ width: 90 }}>
                        <div className="rounded-xl overflow-hidden border-2 border-red-500/50" style={{ width: 90, height: 120 }}>
                          <img src={src} alt={label} className="w-full h-full object-cover object-top" />
                        </div>
                        <div className="flex items-center gap-0.5 mt-1">
                          <svg className="w-2.5 h-2.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          <span className="text-red-400 text-[10px] truncate">{label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload */}
                <div className="mb-4">
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => document.getElementById('file-input-s3')?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-2xl py-8 text-center cursor-pointer transition-all',
                      dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-white/15 hover:border-white/30 bg-white/[0.02]'
                    )}
                  >
                    <input id="file-input-s3" type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileInput} />
                    <svg className="w-7 h-7 text-zinc-600 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    <p className="text-zinc-400 text-sm font-medium">Add photos</p>
                    <p className="text-zinc-600 text-xs mt-0.5">1 photo minimum · More photos = better results</p>
                  </div>
                  {photos.length > 0 && (
                    <div className="grid grid-cols-5 gap-1.5 mt-2">
                      {photos.map((file, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden relative">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 rounded-full flex items-center justify-center text-white text-[10px]">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Identity note */}
                <div className="mb-4 bg-zinc-900/60 border border-white/8 rounded-2xl px-3.5 py-3">
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    <span className="text-white font-semibold">We preserve your real identity.</span>{' '}
                    Your hair, skin tone, and facial features are kept as close to your actual appearance as possible — the more photos you upload, the better the result.
                  </p>
                </div>

                {/* Tattoos */}
                <div className="mb-4">
                  <p className="text-white text-sm font-semibold mb-1">Do you have visible tattoos?</p>
                  <p className="text-zinc-500 text-xs mb-2">Face and neck tattoos will be preserved. Body tattoos may not appear on template clothing.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setHasTattoos(false)} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all', hasTattoos === false ? 'bg-white/15 border-white/40 text-white' : 'bg-white/5 border-white/10 text-zinc-400')}>No</button>
                    <button onClick={() => setHasTattoos(true)} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all', hasTattoos === true ? 'bg-white/15 border-white/40 text-white' : 'bg-white/5 border-white/10 text-zinc-400')}>Yes — I have tattoos</button>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                {photos.length > 0 && photos.length < 3 && (
                  <p className="text-blue-400 text-xs text-center mb-2">✓ {photos.length} photo — add a few more for the best result</p>
                )}
                {photos.length >= 3 && (
                  <p className="text-green-400 text-xs text-center mb-2">✓ {photos.length} photos — great!</p>
                )}
                <button
                  onClick={next}
                  disabled={photos.length < 1}
                  className={cn('w-full py-4 rounded-2xl font-semibold text-base transition-all', photos.length >= 1 ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Generating ───────────────────────────────── */}
          {step === 4 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-0">
                <ProgressBar step={4} total={TOTAL_STEPS} />
              </div>
              {/* Matrix background */}
              <div className="relative px-6 py-12 min-h-[380px] flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 overflow-hidden opacity-20 select-none pointer-events-none">
                  {Array.from({ length: 12 }).map((_, col) => (
                    <div key={col} className="absolute top-0 bottom-0 flex flex-col gap-1 text-red-500 text-[10px] font-mono" style={{ left: `${col * 8.33}%`, animationDelay: `${col * 0.3}s` }}>
                      {Array.from({ length: 30 }).map((_, row) => (
                        <span key={row} style={{ opacity: Math.random() > 0.5 ? 1 : 0.3 }}>{Math.random() > 0.5 ? '1' : '0'}</span>
                      ))}
                    </div>
                  ))}
                </div>
                <h2 className="text-2xl font-bold text-white mb-6 relative z-10">Generating your photos</h2>
                <div className="w-full max-w-xs relative z-10 mb-6">
                  <div className="h-10 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300 flex items-center justify-end pr-3"
                      style={{ width: `${Math.max(progress, 5)}%`, background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)', transition: 'width 0.3s ease-out' }}
                    >
                      {progress > 15 && <span className="text-white text-sm font-bold">{Math.floor(progress)}%</span>}
                    </div>
                    {progress <= 15 && <span className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm font-bold">{Math.floor(progress)}%</span>}
                  </div>
                </div>
                <div className="text-center relative z-10">
                  <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">DID YOU KNOW?</p>
                  <p className="text-zinc-300 text-sm">{DID_YOU_KNOW[didYouKnowIdx]}</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                {progress >= 100 ? (
                  <button onClick={next} className="w-full py-4 rounded-2xl font-semibold text-base transition-all bg-blue-600 hover:brightness-110 text-white">
                    {Object.keys(generatedPhotos).length > 0 ? 'See your AI photos →' : 'Continue →'}
                  </button>
                ) : (
                  <button disabled className="w-full py-4 rounded-2xl font-semibold text-base bg-white/5 text-zinc-600 cursor-not-allowed">
                    Generating... {progress > 0 ? `${Math.floor(progress)}%` : ''}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 5: Pick your favourite preview ──────────────── */}
          {step === 5 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-3">
                <ProgressBar step={5} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-white mb-0">
                  {hasGenerated ? 'Pick your favourite!' : 'This is what you\'ll get'}
                </h2>
                {hasGenerated
                  ? <p className="text-zinc-400 text-sm mt-1">Swipe through your {generatedArray.length} previews and choose the one you like best.</p>
                  : <p className="text-zinc-400 text-sm mt-1 leading-relaxed">Undetectable AI photos in 40+ styles, delivered to your email.</p>
                }
              </div>

              {/* Main carousel photo */}
              <div className="px-4 pb-3">
                <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  {/* Main image */}
                  <img
                    key={carouselIdx}
                    src={hasGenerated ? (generatedArray[carouselIdx] ?? generatedArray[0]) : fallbackPhotos[carouselIdx % fallbackPhotos.length]}
                    alt={`Preview ${carouselIdx + 1}`}
                    className="w-full h-full object-cover object-top select-none"
                    style={{ animation: 'fadeIn 0.3s ease-out' }}
                    onContextMenu={e => e.preventDefault()}
                    draggable={false}
                  />

                  {/* Watermark overlay */}
                  <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" style={{ zIndex: 15 }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="absolute whitespace-nowrap" style={{ top: `${(i * 18) - 10}%`, left: '-20%', width: '140%', transform: 'rotate(-30deg)', transformOrigin: 'center' }}>
                        <span className="text-white/18 font-bold text-sm tracking-widest" style={{ letterSpacing: '0.15em' }}>
                          SwipePhotos.net &nbsp;&nbsp;&nbsp; SwipePhotos.net &nbsp;&nbsp;&nbsp; SwipePhotos.net
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Corner watermark */}
                  <div className="absolute bottom-14 left-0 right-0 flex justify-center pointer-events-none select-none" style={{ zIndex: 16 }}>
                    <span className="text-white/30 font-bold text-xs tracking-widest px-3 py-1 rounded-full" style={{ backdropFilter: 'blur(2px)', background: 'rgba(0,0,0,0.15)' }}>
                      SwipePhotos.net
                    </span>
                  </div>

                  {/* Left/Right tap zones */}
                  <button onClick={() => setCarouselIdx(i => Math.max(0, i - 1))} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" aria-label="Previous" />
                  <button onClick={() => setCarouselIdx(i => Math.min((hasGenerated ? generatedArray.length : fallbackPhotos.length) - 1, i + 1))} className="absolute right-0 top-0 bottom-0 w-1/3 z-10" aria-label="Next" />

                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                    {(hasGenerated ? generatedArray : fallbackPhotos).map((_, i) => (
                      <button key={i} onClick={() => setCarouselIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === carouselIdx ? 'bg-white w-4' : 'bg-white/40'}`} />
                    ))}
                  </div>

                  {/* Style label */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className="text-white text-xs font-semibold bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                      {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label ?? 'Preview'}
                    </span>
                  </div>

                  {/* Photo counter */}
                  <div className="absolute top-3 right-3 z-20">
                    <span className="text-white text-xs font-semibold bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                      {carouselIdx + 1} / {hasGenerated ? generatedArray.length : fallbackPhotos.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thumbnail strip — tap to select */}
              <div className="px-4 pb-3">
                <div className="flex gap-2">
                  {(hasGenerated ? generatedArray : fallbackPhotos).map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIdx(i)}
                      className={`flex-1 rounded-xl overflow-hidden transition-all ${i === carouselIdx ? 'ring-2 ring-blue-500 opacity-100' : 'opacity-50 hover:opacity-75'}`}
                      style={{ aspectRatio: '3/4' }}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover object-top" />
                    </button>
                  ))}
                </div>
              </div>

              {/* More styles teaser */}
              <div className="px-4 pb-3">
                <div className="relative overflow-hidden rounded-2xl" style={{ height: 64 }}>
                  <div className="flex gap-1.5 h-full">
                    {[
                      '/photos/presets/scene-beach.jpg',
                      '/photos/presets/scene-rooftop.jpg',
                      '/photos/presets/scene-restaurant.jpg',
                      '/photos/presets/scene-formal.jpg',
                      '/photos/presets/scene-beach.jpg',
                    ].map((src, i) => (
                      <div key={i} className="flex-shrink-0 w-12 rounded-xl overflow-hidden opacity-50">
                        <img src={src} alt="" className="w-full h-full object-cover object-top" />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#111] flex items-center justify-end pr-3">
                    <span className="text-white text-xs font-semibold bg-black/60 rounded-full px-2.5 py-1">+40 styles</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="px-4 pb-4">
                {hasGenerated ? (
                  <button
                    onClick={() => {
                      setPickedPreviewUrl(selectedAiPhoto)
                      next()
                    }}
                    className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base"
                  >
                    Choose this photo →
                  </button>
                ) : (
                  <button onClick={next} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">
                    Continue →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 6: Pricing ──────────────────────────────────── */}
          {step === 6 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-4 pb-0">
                <ProgressBar step={6} total={TOTAL_STEPS} onBack={back} />
              </div>
              {/* Hero photo with app icons */}
              <div className="relative flex justify-center pt-2 pb-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-blue-500/30">
                    <img src={selectedAiPhoto} alt="" className="w-full h-full object-cover object-top" />
                  </div>
                  {[
                    { pos: '-top-3 -left-4',     delay: '0s',   logo: 'tinder' },
                    { pos: '-top-3 -right-4',    delay: '0.4s', logo: 'hinge' },
                    { pos: '-bottom-3 -left-6',  delay: '0.8s', logo: 'instagram' },
                    { pos: '-bottom-3 -right-6', delay: '1.2s', logo: 'bumble' },
                  ].map(({ pos, delay, logo }) => (
                    <div key={pos} className={`absolute ${pos}`}
                      style={{ animation: `floatIcon 2.4s ease-in-out infinite`, animationDelay: delay }}>
                      <div className="relative w-10 h-10">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xl">
                          <img src={`/logos/dating-app-logos/${logo}.png`} alt={logo} className="w-full h-full object-cover" />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md border border-[#111]">99+</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-2">
                <h2 className="text-xl font-bold text-white text-center mb-1">Your matches are waiting</h2>
                <div className="flex flex-col items-center gap-1 mb-4">
                  {['100+ proven templates', 'Photos that look like you', 'No photographer needed'].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span className="text-zinc-300 text-sm">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Billing toggle */}
                <div className="flex bg-white/5 rounded-2xl p-1 mb-3">
                  <button
                    onClick={() => { setBilling('monthly'); setSelectedPackage('popular') }}
                    className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all', billing === 'monthly' ? 'bg-white text-black' : 'text-zinc-400')}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => { setBilling('yearly'); setSelectedPackage('popular_yearly') }}
                    className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2', billing === 'yearly' ? 'bg-white text-black' : 'text-zinc-400')}
                  >
                    Yearly <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', billing === 'yearly' ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-400')}>50% OFF</span>
                  </button>
                </div>

                {/* Packages */}
                <div className="space-y-2 mb-4">
                  {PACKAGES[billing].map(pkg => (
                    <div key={pkg.id} onClick={() => setSelectedPackage(pkg.id)} className={cn('flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all', selectedPackage === pkg.id ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/10 bg-white/[0.03] hover:border-white/20')}>
                      <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0', selectedPackage === pkg.id ? 'border-blue-500 bg-blue-500' : 'border-zinc-600')}>
                        {selectedPackage === pkg.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-semibold">{pkg.name}</span>
                          {pkg.popular && <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Popular</span>}
                        </div>
                        <span className="text-zinc-500 text-xs">{pkg.photos}</span>
                      </div>
                      <div className="text-right">
                        <div><span className="text-white font-bold">{pkg.perMonth}</span><span className="text-zinc-500 text-xs">/mo</span></div>
                        {billing === 'yearly' && <div className="text-zinc-600 text-[10px]">{pkg.price}/yr</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-4">
                <button onClick={next} className="w-full bg-gradient-to-r from-[#fd267a] to-[#ff6036] hover:brightness-110 text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg shadow-pink-500/20">Get started →</button>
              </div>
            </div>
          )}

          {/* ── STEP 7: Email / Account ─────────────────────────── */}
          {step === 7 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-5">
                <ProgressBar step={7} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Almost there</h2>
                <p className="text-zinc-500 text-sm">Enter your email to receive your photos and proceed to payment.</p>
              </div>
              <div className="px-6 pb-6 space-y-3">
                {/* Google */}
                <button
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true)
                    setCheckoutError(null)
                    try {
                      const currentPkgsG = PACKAGES[billing]
                      const pkgG = currentPkgsG.find(p => p.id === selectedPackage) || currentPkgsG[0]
                      const res = await fetch('/api/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ packageId: pkgG.id, priceId: pkgG.priceId, email: '', style: selectedStyle, hasTattoos: hasTattoos === true }),
                      })
                      const data = await res.json()
                      if (!res.ok || data.error) {
                        setCheckoutError(data.error || `Something went wrong (${res.status}). Please try again.`)
                        setLoading(false)
                        return
                      }
                      if (data.orderId && photos.length > 0) {
                        const compressed = await Promise.all(photos.map(p => compressImage(p)))
                        const fd = new FormData()
                        fd.append('orderId', data.orderId)
                        for (const photo of compressed) fd.append('files', photo)
                        await fetch('/api/upload', { method: 'POST', body: fd }).catch(console.error)
                      }
                      if (data.url) {
                        const supabase = createClient()
                        const { data: { user } } = await supabase.auth.getUser()
                        if (user) {
                          // Already logged in — patch email on order then go to Stripe
                          if (data.orderId && user.email) {
                            await fetch(`/api/orders/${data.orderId}/set-email`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: user.email }),
                            }).catch(() => {})
                          }
                          window.location.href = data.url
                        } else {
                          // Not logged in — OAuth then redirect to Stripe
                          localStorage.setItem('sw_pending_checkout', data.url)
                          if (data.orderId) localStorage.setItem('sw_pending_order_id', data.orderId)
                          await supabase.auth.signInWithOAuth({
                            provider: 'google',
                            options: { redirectTo: `${window.location.origin}/auth/callback?next=/go-checkout` },
                          })
                        }
                      } else {
                        setCheckoutError('No payment URL received. Please try again.')
                        setLoading(false)
                      }
                    } catch (err) {
                      console.error('[checkout/google]', err)
                      setCheckoutError('Could not connect to payment. Please use the email option instead.')
                      setLoading(false)
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 text-gray-900 font-semibold py-3.5 rounded-2xl text-sm transition-all shadow-sm disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-zinc-600 text-xs">or use email</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                {/* Email */}
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 transition-all"
                />

                {/* Terms */}
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <div
                    onPointerDown={() => setAgreedToTerms(v => !v)}
                    className={cn('mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors', agreedToTerms ? 'bg-blue-500 border-blue-500' : 'border-zinc-600 bg-transparent')}
                  >
                    {agreedToTerms && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-zinc-500 text-xs leading-relaxed">
                    I agree to the{' '}
                    <Link href="/terms" className="text-zinc-300 underline underline-offset-2">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-zinc-300 underline underline-offset-2">Privacy Policy</Link>
                  </span>
                </label>

                {/* Error */}
                {checkoutError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                    {checkoutError}
                  </div>
                )}

                {/* Continue */}
                <button
                  onPointerDown={handleEmailSubmit}
                  disabled={!email.includes('@') || !agreedToTerms || loading}
                  className={cn('w-full py-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2', email.includes('@') && agreedToTerms && !loading ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                  ) : 'Continue to Payment →'}
                </button>

                <p className="text-center text-zinc-700 text-xs">Already have an account? <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link></p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
