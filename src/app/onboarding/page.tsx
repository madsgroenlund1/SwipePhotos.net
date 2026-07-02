'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 9

const STYLE_OPTIONS = [
  { id: 'restaurant', label: 'Italian Restaurant', src: '/photos/presets/scene-restaurant.jpg', free: true },
  { id: 'formal', label: 'Smart Formal', src: '/photos/presets/scene-formal.jpg', free: true },
  { id: 'rooftop', label: 'Rooftop Pool', src: '/photos/presets/scene-rooftop.jpg', free: true },
  { id: 'beach', label: 'Beach Club', src: '/photos/presets/scene-beach.jpg', free: true },
]

const AI_TRACES_BAD = [
  'SynthID watermark detected',
  'AI generation metadata',
  'Missing camera EXIF data',
  'Incorrect file dimensions',
  'AI noise pattern',
  'Missing mobile compression',
  'Perfect color uniformity',
  'No lens distortion artifacts',
  'Uniform sharpness profile',
  'Missing GPS coordinates',
  'Incorrect JPEG quantization',
  'No chromatic aberration',
  'Missing device fingerprint',
  'Synthetic depth of field',
]

const DETECTION_TOOLS = [
  { name: 'imgengine', before: '92% AI', after: '3%', logo: 'IE' },
  { name: 'TruthScan', before: 'AI Detected', after: 'Likely Real', logo: 'TS' },
  { name: 'bfac', before: 'AI-Generated', after: 'Human', logo: 'BF' },
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
  'The templates are picked by famous dating coaches',
  'The bottom 50% of profiles only get 4% of the likes!',
  "We're the ONLY photo generator with anti-AI-detection",
  'Better photos = less texting needed',
  'SwipePhotos users get 10x more matches on average',
  'Top 10% of profiles get 58% of all likes on Hinge',
  'Your first photo determines 90% of your swipe rate',
  'SwipePhotos photos pass every AI scanner',
  'Professional-looking photos double your match rate',
  'Most dating coaches recommend quality photos above all',
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
  const [selectedStyle, setSelectedStyle] = useState<string>('outdoor')
  const [progress, setProgress] = useState(0)
  const [didYouKnowIdx, setDidYouKnowIdx] = useState(0)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [tracesState, setTracesState] = useState<'bad' | 'cleaning' | 'clean'>('bad')
  const [cleanedCount, setCleanedCount] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState<string>('popular')
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generatedPhotos, setGeneratedPhotos] = useState<Record<string, string>>({})
  const [genError, setGenError] = useState<string | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const userPhotoUrl = photos.length > 0 ? URL.createObjectURL(photos[0]) : null
  const STYLE_ORDER = ['restaurant', 'formal', 'rooftop', 'beach']
  const STYLE_LABELS: Record<string, string> = { restaurant: 'Italian Restaurant', formal: 'Smart Formal', rooftop: 'Rooftop Bar', beach: 'Beach Club' }
  const fallbackPhotos = CAROUSEL_PHOTOS[selectedStyle] ?? CAROUSEL_PHOTOS.restaurant
  // Build ordered array from generated results (all 4 styles)
  const generatedArray = STYLE_ORDER.map(s => generatedPhotos[s]).filter(Boolean) as string[]
  const hasGenerated = generatedArray.length > 0
  const selectedAiPhoto = hasGenerated
    ? (generatedArray[carouselIdx] ?? generatedArray[0])
    : fallbackPhotos[carouselIdx % fallbackPhotos.length]

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

  // Step 4: submit preview jobs to fal.ai queue, then poll for results
  useEffect(() => {
    if (step !== 4) return
    setProgress(0)
    setDidYouKnowIdx(0)
    setGeneratedPhotos({})
    setGenError(null)

    // Rotate "did you know" facts
    let tick = 0
    progressRef.current = setInterval(() => {
      tick++
      setDidYouKnowIdx(Math.floor(tick / 20) % DID_YOU_KNOW.length)
    }, 200)

    async function startGeneration() {
      // If no photos uploaded, skip to examples immediately
      if (photos.length === 0) {
        setProgress(100)
        return
      }

      try {
        // Submit generation jobs — returns instantly with request IDs
        const fd = new FormData()
        fd.append('photo', photos[0])
        const res = await fetch('/api/generate/preview', { method: 'POST', body: fd })
        const data = await res.json()

        if (!data.requestIds?.length) {
          console.warn('[preview] No request IDs, falling back to examples')
          setProgress(100)
          return
        }

        const { requestIds, styles } = data as { requestIds: string[]; styles: string[] }
        const total = styles.length

        // Poll every 3 seconds for completed photos
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

            // Progress based on completed jobs
            const pct = Math.round((poll.completedCount / total) * 100)
            setProgress(pct)

            if (poll.done) {
              clearInterval(pollingRef.current!)
            }
          } catch (err) {
            console.error('[preview] Poll error:', err)
          }
        }, 3000)
      } catch (err) {
        console.error('[preview] Submit error:', err)
        setProgress(100) // Fall back to showing example photos
      }
    }

    startGeneration()
    return () => {
      if (progressRef.current) clearInterval(progressRef.current!)
      if (pollingRef.current) clearInterval(pollingRef.current!)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // AI traces animation for step 7
  const handleCleanTraces = () => {
    setTracesState('cleaning')
    setCleanedCount(0)
    let i = 0
    const iv = setInterval(() => {
      i++
      setCleanedCount(i)
      if (i >= AI_TRACES_BAD.length) {
        clearInterval(iv)
        setTracesState('clean')
      }
    }, 120)
  }

  async function handleEmailSubmit() {
    if (!email.includes('@') || !agreedToTerms) return
    setLoading(true)
    try {
      // 1. Create order + get Stripe URL
      const currentPkgs = PACKAGES[billing]
      const pkg = currentPkgs.find(p => p.id === selectedPackage) || currentPkgs.find(p => p.popular) || currentPkgs[0]
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, priceId: pkg.priceId, email }),
      })
      const data = await res.json()
      console.log('[checkout response]', data)

      // 2. Upload photos
      if (data.orderId && photos.length > 0) {
        const fd = new FormData()
        fd.append('orderId', data.orderId)
        for (const photo of photos) fd.append('files', photo)
        await fetch('/api/upload', { method: 'POST', body: fd }).catch(console.error)
      }

      // 3. Redirect to Stripe
      if (data.url) {
        window.location.href = data.url
        return
      }

      console.error('[checkout] No URL in response:', data)
    } catch (err) {
      console.error('Checkout error:', err)
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
                <h2 className="text-2xl font-bold text-white mb-1">Upload 3–5 photos of yourself</h2>
              </div>

              <div className="px-4 pb-2">
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
                    <p className="text-zinc-600 text-xs mt-0.5">Drop files or click to browse</p>
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

                {/* Tattoos */}
                <div className="mb-4">
                  <p className="text-white text-sm font-semibold mb-2">Visible tattoos in your photos?</p>
                  <div className="flex gap-2">
                    <button onPointerDown={() => setHasTattoos(false)} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors', hasTattoos === false ? 'bg-white/15 border-white/40 text-white' : 'bg-white/5 border-white/10 text-zinc-400')}>No</button>
                    <button onPointerDown={() => setHasTattoos(true)} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors', hasTattoos === true ? 'bg-white/15 border-white/40 text-white' : 'bg-white/5 border-white/10 text-zinc-400')}>Yes</button>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                {photos.length > 0 && photos.length < 3 && (
                  <p className="text-amber-400 text-xs text-center mb-2">{photos.length}/3 minimum — upload {3 - photos.length} more</p>
                )}
                {photos.length >= 3 && (
                  <p className="text-green-400 text-xs text-center mb-2">✓ {photos.length} photos ready</p>
                )}
                <button
                  onClick={next}
                  disabled={photos.length < 3}
                  className={cn('w-full py-4 rounded-2xl font-semibold text-base transition-all', photos.length >= 3 ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}
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
                      style={{ width: `${Math.max(progress, 5)}%`, background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)' }}
                    >
                      {progress > 15 && <span className="text-white text-sm font-bold">{progress.toFixed(1)}%</span>}
                    </div>
                    {progress <= 15 && <span className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm font-bold">{progress.toFixed(1)}%</span>}
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
                    Generating... {progress > 0 ? `${progress}%` : ''}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 5: Preview grid ──────────────────────────────── */}
          {step === 5 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-3">
                <ProgressBar step={5} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-white mb-0">
                  {hasGenerated ? 'Your preview photos are ready!' : 'This is what you\'ll get'}
                </h2>
                {hasGenerated
                  ? <p className="text-green-400 text-xs mt-1">✓ Generated from your photo — unlock 40+ premium styles</p>
                  : <p className="text-zinc-400 text-sm mt-1 leading-relaxed">Undetectable AI photos in 40+ styles, delivered to your email.</p>
                }
              </div>

              {/* 4 style previews */}
              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_ORDER.map((style) => {
                    const src = hasGenerated ? generatedPhotos[style] : STYLE_OPTIONS.find(s => s.id === style)?.src
                    if (!src) return null
                    return (
                      <div key={style} className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                        <img src={src} alt={STYLE_LABELS[style]} className="w-full h-full object-cover object-top" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6">
                          <p className="text-white text-[10px] font-semibold text-center">{STYLE_LABELS[style]}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* More styles teaser */}
              <div className="px-4 pb-3">
                <div className="relative overflow-hidden rounded-2xl" style={{ height: 72 }}>
                  <div className="flex gap-1.5 h-full">
                    {[
                      '/photos/presets/scene-beach.jpg',
                      '/photos/presets/scene-rooftop.jpg',
                      '/photos/presets/scene-restaurant.jpg',
                      '/photos/presets/scene-formal.jpg',
                      '/photos/presets/scene-beach.jpg',
                    ].map((src, i) => (
                      <div key={i} className="flex-shrink-0 w-14 rounded-xl overflow-hidden opacity-60">
                        <img src={src} alt="" className="w-full h-full object-cover object-top" />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#111] flex items-center justify-end pr-3">
                    <span className="text-white text-xs font-semibold bg-black/60 rounded-full px-2.5 py-1">+40 styles</span>
                  </div>
                </div>
              </div>

              {/* What's included */}
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    {
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M9 6l1.5-2h3L15 6"/>
                        </svg>
                      ),
                      gradient: 'from-blue-500 to-blue-700',
                      value: '40+', label: 'AI photos',
                    },
                    {
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                          <path d="M13 2L4.09 12.26a1 1 0 00.78 1.63L11 14l-2 8 8.91-10.26a1 1 0 00-.78-1.63L11 10l2-8z"/>
                        </svg>
                      ),
                      gradient: 'from-amber-400 to-orange-500',
                      value: '~1hr', label: 'Delivery',
                    },
                    {
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M12 2l7 4v5c0 5-3.5 9.3-7 11C8.5 20.3 5 16 5 11V6l7-4z"/><path d="M9 12l2 2 4-4"/>
                        </svg>
                      ),
                      gradient: 'from-emerald-400 to-green-600',
                      value: '100%', label: 'Undetectable',
                    },
                  ].map(({ icon, gradient, value, label }) => (
                    <div key={label} className="bg-white/[0.04] border border-white/8 rounded-2xl p-3 text-center flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                        {icon}
                      </div>
                      <div>
                        <div className="text-white text-base font-bold leading-none">{value}</div>
                        <div className="text-zinc-500 text-[10px] mt-0.5 font-medium">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={next} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 6: DON'T USE YET ───────────────────────────── */}
          {step === 6 && (
            <div className="bg-[#0d0d0d] rounded-3xl overflow-hidden">
              <div className="p-5 pb-3">
                <ProgressBar step={6} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-red-500 mb-1">DON&apos;T USE THIS PHOTO YET!</h2>
                <p className="text-zinc-400 text-sm">Dating apps can detect it&apos;s AI generated and might permanently ban you.</p>
              </div>
              <div className="px-3 pb-2">
                <div className="grid grid-cols-3 gap-2">
                  {/* TruthScan — AI detected */}
                  <div className="flex flex-col items-center">
                    <div className="mb-1.5 bg-white rounded-lg px-2 py-0.5 flex items-center gap-1">
                      <span className="text-blue-600 text-[9px] font-bold">✦</span>
                      <span className="text-[9px] font-bold text-gray-800">TruthScan</span>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden w-full border border-red-300">
                      <div className="px-1.5 pt-1.5 pb-1">
                        <p className="text-[7px] font-semibold text-gray-800 leading-tight mb-1">Basic AI Image Analysis</p>
                        <div className="h-1 bg-red-500 rounded-full mb-0.5" />
                        <div className="flex justify-between mb-1">
                          <span className="text-[6px] text-red-500 font-bold">Synthetic</span>
                        </div>
                        <div className="flex justify-between text-center mb-1">
                          <div><p className="text-[7px] font-bold text-gray-900">99%</p><p className="text-[5px] text-gray-500">AI Prob.</p></div>
                          <div><p className="text-[7px] font-bold text-gray-900">High</p><p className="text-[5px] text-gray-500">Confidence</p></div>
                          <div><p className="text-[7px] font-bold text-gray-900">AI</p><p className="text-[5px] text-gray-500">Class.</p></div>
                        </div>
                        <div className="aspect-[3/4] rounded overflow-hidden mb-1">
                          <img src={selectedAiPhoto} alt="" className="w-full h-full object-cover object-top" />
                        </div>
                        <div className="bg-red-600 rounded text-center py-0.5 mb-0.5">
                          <p className="text-[6px] text-white font-bold">AI Probability: 99% AI</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-red-400 text-[9px] font-bold mt-1">✗ AI Detected</p>
                  </div>
                  {/* sightengine — AI detected */}
                  <div className="flex flex-col items-center">
                    <div className="mb-1.5 bg-white rounded-lg px-2 py-0.5 flex items-center gap-0.5">
                      <span className="text-gray-700 text-[9px] font-bold">sight</span><span className="text-green-600 text-[9px] font-bold">engine</span>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden w-full border border-red-300">
                      <div className="px-1.5 pt-1.5 pb-1">
                        <p className="text-[7px] font-bold text-gray-900 leading-tight mb-1">Detect AI-generated images</p>
                        <div className="aspect-[3/4] rounded overflow-hidden mb-1">
                          <img src={selectedAiPhoto} alt="" className="w-full h-full object-cover object-top" />
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[6px] font-bold text-gray-900">Likely AI-generated</p>
                          <div className="bg-red-600 rounded px-1 py-0.5"><span className="text-[7px] text-white font-bold">92%</span></div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1"><span className="text-[5px] text-gray-600 w-8">GenAI</span><div className="flex-1 h-1 bg-gray-100 rounded-full"><div className="h-full bg-red-500 rounded-full" style={{width:'92%'}} /></div><span className="text-[5px] text-gray-600">92%</span></div>
                          <div className="flex items-center gap-1"><span className="text-[5px] text-gray-600 w-8">Face</span><div className="flex-1 h-1 bg-gray-100 rounded-full"><div className="h-full bg-orange-400 rounded-full" style={{width:'10%'}} /></div><span className="text-[5px] text-gray-600">1%</span></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-red-400 text-[9px] font-bold mt-1">✗ AI Detected</p>
                  </div>
                  {/* IsThisAI — AI detected */}
                  <div className="flex flex-col items-center">
                    <div className="mb-1.5 bg-white rounded-lg px-2 py-0.5 flex items-center gap-0.5">
                      <span className="text-gray-800 text-[9px] font-bold">IsThis</span><div className="w-3 h-3 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-white text-[5px] font-bold">AI</span></div>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden w-full border border-red-300">
                      <div className="aspect-[3/4] overflow-hidden">
                        <img src={selectedAiPhoto} alt="" className="w-full h-full object-cover object-top" />
                      </div>
                      <div className="px-1.5 py-1">
                        <p className="text-[5px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Analysis Result</p>
                        <div className="flex items-center gap-0.5 mb-0.5">
                          <span className="text-red-500 text-[7px]">⊘</span>
                          <p className="text-[8px] font-bold text-red-500">AI-Generated</p>
                        </div>
                        <p className="text-[5px] text-gray-500 mb-0.5">99% Confidence</p>
                        <div className="h-1 bg-gray-100 rounded-full"><div className="h-full bg-red-500 rounded-full" style={{width:'99%'}} /></div>
                      </div>
                    </div>
                    <p className="text-red-400 text-[9px] font-bold mt-1">✗ AI Detected</p>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4 pt-2">
                <button onClick={next} className="w-full bg-red-500 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 7: AI Traces ────────────────────────────────── */}
          {step === 7 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-4">
                <ProgressBar step={7} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-white mb-1">AI traces found in your photo</h2>
              </div>
              <div className="px-4 pb-3">
                {tracesState !== 'clean' && (
                  <button
                    onClick={handleCleanTraces}
                    disabled={tracesState === 'cleaning'}
                    className={cn('w-full py-3 rounded-2xl font-semibold text-base mb-4 transition-all', tracesState === 'bad' ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-blue-600/50 text-white/50 cursor-not-allowed')}
                  >
                    {tracesState === 'cleaning' ? 'Removing AI traces...' : 'Remove all AI traces'}
                  </button>
                )}
                <div className="space-y-0 max-h-72 overflow-y-auto scrollbar-hide">
                  {AI_TRACES_BAD.map((trace, i) => {
                    const isCleaned = tracesState === 'clean' || (tracesState === 'cleaning' && i < cleanedCount)
                    return (
                      <div key={trace} className="flex items-center gap-3 py-2.5 border-b border-white/5">
                        {isCleaned ? (
                          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        <span className={cn('text-sm transition-colors', isCleaned ? 'text-green-400' : 'text-zinc-300')}>{trace}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="px-4 pb-4">
                <button onClick={next} disabled={tracesState !== 'clean'} className={cn('w-full py-4 rounded-2xl font-semibold text-base transition-all', tracesState === 'clean' ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 8: Undetectable ─────────────────────────────── */}
          {step === 8 && (
            <div className="bg-[#0d0d0d] rounded-3xl overflow-hidden">
              <div className="p-5 pb-3">
                <ProgressBar step={8} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-green-400 mb-1">Undetectable</h2>
                <p className="text-zinc-400 text-sm">Your photo now passes all major AI detection tools. Safe to upload to any dating app.</p>
              </div>
              <div className="px-3 pb-2">
                <div className="grid grid-cols-3 gap-2">
                  {/* sightengine — Human */}
                  <div className="flex flex-col items-center">
                    <div className="mb-1.5 bg-white rounded-lg px-2 py-0.5 flex items-center gap-0.5">
                      <span className="text-gray-700 text-[9px] font-bold">sight</span><span className="text-green-600 text-[9px] font-bold">engine</span>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden w-full border border-green-300">
                      <div className="px-1.5 pt-1.5 pb-1">
                        <p className="text-[7px] font-bold text-gray-900 leading-tight mb-1">Detect AI-generated images</p>
                        <div className="aspect-[3/4] rounded overflow-hidden mb-1">
                          <img src={selectedAiPhoto} alt="" className="w-full h-full object-cover object-top" />
                        </div>
                        <p className="text-[5px] text-gray-500 text-center mb-0.5">Tap to try an image or video</p>
                        <p className="text-[6px] font-bold text-green-700 leading-tight">Not likely to be AI-generated or Deepfake</p>
                        <div className="flex items-center justify-between mt-0.5 mb-1">
                          <div className="bg-green-700 rounded px-1 py-0.5"><span className="text-[7px] text-white font-bold">3%</span></div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1"><span className="text-[5px] text-gray-600 w-8">GenAI</span><div className="flex-1 h-1 bg-gray-100 rounded-full"><div className="h-full bg-gray-300 rounded-full" style={{width:'1%'}} /></div><span className="text-[5px] text-gray-600">1%</span></div>
                          <div className="flex items-center gap-1"><span className="text-[5px] text-gray-600 w-8">Face</span><div className="flex-1 h-1 bg-gray-100 rounded-full"><div className="h-full bg-orange-300 rounded-full" style={{width:'3%'}} /></div><span className="text-[5px] text-gray-600">3%</span></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-green-400 text-[9px] font-bold mt-1">✓ Human</p>
                  </div>
                  {/* TruthScan — Human */}
                  <div className="flex flex-col items-center">
                    <div className="mb-1.5 bg-white rounded-lg px-2 py-0.5 flex items-center gap-1">
                      <span className="text-blue-600 text-[9px] font-bold">✦</span>
                      <span className="text-[9px] font-bold text-gray-800">TruthScan</span>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden w-full border border-green-300">
                      <div className="px-1.5 pt-1.5 pb-1">
                        <p className="text-[7px] font-semibold text-gray-800 leading-tight mb-1">Basic AI Image Analysis</p>
                        <div className="h-1 bg-green-500 rounded-full mb-0.5" />
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[6px] text-green-600 font-bold">Real</span>
                        </div>
                        <div className="flex justify-between text-center mb-1">
                          <div><p className="text-[7px] font-bold text-gray-900">10%</p><p className="text-[5px] text-gray-500">AI Prob.</p></div>
                          <div><p className="text-[7px] font-bold text-gray-900">High</p><p className="text-[5px] text-gray-500">Confidence</p></div>
                          <div><p className="text-[7px] font-bold text-gray-900">Real</p><p className="text-[5px] text-gray-500">Class.</p></div>
                        </div>
                        <div className="aspect-[3/4] rounded overflow-hidden mb-1">
                          <img src={selectedAiPhoto} alt="" className="w-full h-full object-cover object-top" />
                        </div>
                        <div className="bg-green-600 rounded text-center py-0.5">
                          <p className="text-[6px] text-white font-bold">AI Probability: 10% AI</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-green-400 text-[9px] font-bold mt-1">✓ Human</p>
                  </div>
                  {/* IsThisAI — Human */}
                  <div className="flex flex-col items-center">
                    <div className="mb-1.5 bg-white rounded-lg px-2 py-0.5 flex items-center gap-0.5">
                      <span className="text-gray-800 text-[9px] font-bold">IsThis</span><div className="w-3 h-3 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-white text-[5px] font-bold">AI</span></div>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden w-full border border-green-300">
                      <div className="aspect-[3/4] overflow-hidden">
                        <img src={selectedAiPhoto} alt="" className="w-full h-full object-cover object-top" />
                      </div>
                      <div className="px-1.5 py-1">
                        <p className="text-[5px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Analysis Result</p>
                        <div className="flex items-center gap-0.5 mb-0.5">
                          <span className="text-green-500 text-[7px]">✓</span>
                          <p className="text-[8px] font-bold text-green-600">Likely Real</p>
                        </div>
                        <p className="text-[5px] text-gray-500 mb-0.5">90% Confidence</p>
                        <div className="h-1 bg-gray-100 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{width:'90%'}} /></div>
                      </div>
                    </div>
                    <p className="text-green-400 text-[9px] font-bold mt-1">✓ Human</p>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4 pt-2">
                <button onClick={next} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 9: Pricing ──────────────────────────────────── */}
          {step === 9 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-4 pb-0">
                <ProgressBar step={9} total={TOTAL_STEPS} onBack={back} />
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
                  {['100+ proven templates', 'Custom photos', "Don't get banned"].map(f => (
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

          {/* ── STEP 10: Email / Account ─────────────────────────── */}
          {step === 10 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-5">
                <ProgressBar step={9} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Almost there</h2>
                <p className="text-zinc-500 text-sm">Enter your email to receive your photos and proceed to payment.</p>
              </div>
              <div className="px-6 pb-6 space-y-3">
                {/* Google */}
                <button
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true)
                    try {
                      const currentPkgsG = PACKAGES[billing]
                      const pkgG = currentPkgsG.find(p => p.id === selectedPackage) || currentPkgsG[0]
                      const res = await fetch('/api/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ packageId: pkgG.id, priceId: pkgG.priceId, email: '' }),
                      })
                      const data = await res.json()
                      if (data.orderId && photos.length > 0) {
                        const fd = new FormData()
                        fd.append('orderId', data.orderId)
                        for (const photo of photos) fd.append('files', photo)
                        await fetch('/api/upload', { method: 'POST', body: fd }).catch(console.error)
                      }
                      if (data.url) {
                        localStorage.setItem('sw_pending_checkout', data.url)
                        const supabase = createClient()
                        await supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: { redirectTo: `${window.location.origin}/auth/callback?next=/go-checkout` },
                        })
                      } else {
                        console.error('[checkout] No URL:', data)
                        alert('Something went wrong. Please use email instead or try again.')
                        setLoading(false)
                      }
                    } catch (err) {
                      console.error('[checkout/google]', err)
                      alert('Could not connect to payment. Please use email instead.')
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
