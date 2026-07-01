'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 9

const STYLE_OPTIONS = [
  { id: 'casual', label: 'Casual Outdoor', src: '/photos/presets/mannequin-1.jpg', free: true },
  { id: 'formal', label: 'Smart Formal', src: '/photos/presets/mannequin-2.jpg', free: true },
  { id: 'rooftop', label: 'Rooftop Bar', src: '/photos/presets/mannequin-1.jpg', free: false },
  { id: 'beach', label: 'Beach Vibes', src: '/photos/presets/mannequin-2.jpg', free: false },
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

const CAROUSEL_PHOTOS = [
  '/photos/before-after/julius/after/1.jpg',
  '/photos/before-after/alex/after/1.jpg',
  '/photos/before-after/benni/after/1.jpg',
  '/photos/before-after/black/after/1.jpg',
  '/photos/before-after/jason/after/1.jpg',
]

const DID_YOU_KNOW = [
  'Better photos = less texting needed',
  "We're the ONLY generator with anti-AI-detection",
  'SwipePhotos photos pass every AI scanner',
  'Men using SwipePhotos get 10x more matches',
]

const PACKAGES = [
  { id: 'starter', name: 'Starter', monthlyPrice: '€29', yearlyPrice: '€14.5', yearlyTotal: '€174', photos: '30 photos/mo', popular: false },
  { id: 'premium', name: 'Premium', monthlyPrice: '€99', yearlyPrice: '€49', yearlyTotal: '€588', photos: '200 photos/mo', popular: true },
]

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
  const [selectedPackage, setSelectedPackage] = useState<string>('premium')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const userPhotoUrl = photos.length > 0 ? URL.createObjectURL(photos[0]) : null

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

  // Progress animation for step 4
  useEffect(() => {
    if (step === 4) {
      setProgress(0)
      setDidYouKnowIdx(0)
      let p = 0
      progressRef.current = setInterval(() => {
        p += 0.5
        setProgress(Math.min(p, 100))
        setDidYouKnowIdx(Math.floor(p / 25) % DID_YOU_KNOW.length)
        if (p >= 100) clearInterval(progressRef.current!)
      }, 80)
      return () => { if (progressRef.current) clearInterval(progressRef.current!) }
    }
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
    if (!email.includes('@')) return
    setLoading(true)
    try {
      await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {}
    setLoading(false)
    router.push('/dashboard')
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
                  <div key={opt.id} className="relative" onClick={() => opt.free && setSelectedStyle(opt.id)}>
                    <div className={cn(
                      'relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer',
                      selectedStyle === opt.id ? 'border-blue-500' : 'border-white/10',
                      !opt.free && 'opacity-50 cursor-default'
                    )}>
                      <img src={opt.src} alt={opt.label} className="w-full h-full object-cover object-top" />
                      {!opt.free && (
                        <div className="absolute inset-0 bg-black/60 flex items-end justify-center pb-3">
                          <span className="text-zinc-400 text-xs text-center px-2">Browse 100+ proven templates later</span>
                        </div>
                      )}
                      {selectedStyle === opt.id && opt.free && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>
                    <p className="text-zinc-400 text-xs mt-1.5 text-center">{opt.label}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4 pt-2">
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
                <h2 className="text-2xl font-bold text-white mb-1">Upload 1–2 photos of yourself</h2>
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
                    <button onClick={() => setHasTattoos(false)} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all', hasTattoos === false ? 'bg-white/15 border-white/40 text-white' : 'bg-white/5 border-white/10 text-zinc-400')}>No</button>
                    <button onClick={() => setHasTattoos(true)} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all', hasTattoos === true ? 'bg-white/15 border-white/40 text-white' : 'bg-white/5 border-white/10 text-zinc-400')}>Yes</button>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={next}
                  disabled={photos.length === 0 && hasTattoos === null}
                  className={cn('w-full py-4 rounded-2xl font-semibold text-base transition-all', photos.length > 0 || hasTattoos !== null ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}
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
                <h2 className="text-2xl font-bold text-white mb-6 relative z-10">Generating your photo</h2>
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
                <button onClick={next} disabled={progress < 100} className={cn('w-full py-4 rounded-2xl font-semibold text-base transition-all', progress >= 100 ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Select favorite ──────────────────────────── */}
          {step === 5 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-4">
                <ProgressBar step={5} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-white mb-0">Select your favorite</h2>
              </div>
              <div className="px-4 pb-2">
                <div className="relative flex items-center justify-center" style={{ height: 280 }}>
                  {/* Side previews — always demo photos */}
                  {carouselIdx > 0 && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-2xl overflow-hidden opacity-40" style={{ width: 110, height: 220 }}>
                      <img src={CAROUSEL_PHOTOS[carouselIdx - 1]} alt="" className="w-full h-full object-cover object-top" />
                    </div>
                  )}
                  {carouselIdx < CAROUSEL_PHOTOS.length - 1 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded-2xl overflow-hidden opacity-40" style={{ width: 110, height: 220 }}>
                      <img src={CAROUSEL_PHOTOS[carouselIdx + 1]} alt="" className="w-full h-full object-cover object-top" />
                    </div>
                  )}
                  {/* Main card — always demo photos */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500/60 z-10" style={{ width: 170, height: 260 }}>
                    <img src={CAROUSEL_PHOTOS[carouselIdx]} alt="" className="w-full h-full object-cover object-top" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
                      <p className="text-white text-[10px] font-medium text-center opacity-80">AI example output</p>
                    </div>
                  </div>
                  {/* Nav arrows */}
                  {carouselIdx > 0 && (
                    <button onClick={() => setCarouselIdx(i => i - 1)} className="absolute left-8 z-20 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  )}
                  {carouselIdx < CAROUSEL_PHOTOS.length - 1 && (
                    <button onClick={() => setCarouselIdx(i => i + 1)} className="absolute right-8 z-20 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  )}
                </div>
                <p className="text-center text-zinc-600 text-sm mt-3">{carouselIdx + 1}/{CAROUSEL_PHOTOS.length}</p>
              </div>
              <div className="px-4 pb-4">
                <button onClick={next} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 6: DON'T USE YET ───────────────────────────── */}
          {step === 6 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-4">
                <ProgressBar step={6} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-red-500 mb-2">DON&apos;T USE THIS PHOTO YET!</h2>
                <p className="text-zinc-400 text-sm">Dating apps can detect it&apos;s AI generated and might permanently ban you.</p>
              </div>
              <div className="px-4 pb-2">
                <div className="grid grid-cols-3 gap-2">
                  {DETECTION_TOOLS.map((tool) => (
                    <div key={tool.name} className="bg-zinc-900 rounded-2xl p-3 border border-red-500/20">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">{tool.logo}</span>
                        </div>
                        <span className="text-zinc-400 text-[10px] font-medium truncate">{tool.name}</span>
                      </div>
                      <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2">
                        <img src={userPhotoUrl || CAROUSEL_PHOTOS[carouselIdx]} alt="" className="w-full h-full object-cover object-top" />
                      </div>
                      <div className="text-center">
                        <span className="text-red-400 text-[10px] font-bold">✗ AI Detected</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-4 pt-2">
                <button onClick={next} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">Continue →</button>
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
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-4">
                <ProgressBar step={8} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-green-400 mb-2">Undetectable</h2>
                <p className="text-zinc-400 text-sm">Your photo now passes all major AI detection tools. Safe to upload to any dating app.</p>
              </div>
              <div className="px-4 pb-2">
                <div className="grid grid-cols-3 gap-2">
                  {DETECTION_TOOLS.map((tool) => (
                    <div key={tool.name} className="bg-zinc-900 rounded-2xl p-3 border border-green-500/20">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">{tool.logo}</span>
                        </div>
                        <span className="text-zinc-400 text-[10px] font-medium truncate">{tool.name}</span>
                      </div>
                      <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2">
                        <img src={userPhotoUrl || CAROUSEL_PHOTOS[carouselIdx]} alt="" className="w-full h-full object-cover object-top" />
                      </div>
                      <div className="text-center">
                        <span className="text-green-400 text-[10px] font-bold">✓ Human</span>
                      </div>
                    </div>
                  ))}
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
                    <img src={userPhotoUrl || CAROUSEL_PHOTOS[carouselIdx]} alt="" className="w-full h-full object-cover object-top" />
                  </div>
                  {[
                    { icon: '🔥', pos: '-top-3 -left-4', label: '99+' },
                    { icon: '🏠', pos: '-top-3 -right-4', label: '99+' },
                    { icon: '📸', pos: '-bottom-3 -left-6', label: '99+' },
                    { icon: '💚', pos: '-bottom-3 -right-6', label: '99+' },
                  ].map(({ icon, pos, label }) => (
                    <div key={pos} className={`absolute ${pos} bg-zinc-800 rounded-xl w-10 h-10 flex items-center justify-center border border-white/10`}>
                      <span className="text-lg">{icon}</span>
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full px-1">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-2">
                <h2 className="text-xl font-bold text-white text-center mb-1">Your matches are waiting</h2>
                <div className="flex flex-col gap-1 mb-4">
                  {['100+ proven templates', 'Custom photos', "Don't get banned"].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span className="text-zinc-300 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                {/* Billing toggle */}
                <div className="flex items-center gap-2 bg-zinc-900 rounded-xl p-1 mb-3">
                  <button onClick={() => setBillingCycle('monthly')} className={cn('flex-1 py-1.5 rounded-lg text-sm font-medium transition-all', billingCycle === 'monthly' ? 'bg-zinc-700 text-white' : 'text-zinc-500')}>Monthly</button>
                  <button onClick={() => setBillingCycle('yearly')} className={cn('flex-1 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5', billingCycle === 'yearly' ? 'bg-zinc-700 text-white' : 'text-zinc-500')}>
                    Yearly
                    <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">50% OFF</span>
                  </button>
                </div>
                {/* Packages */}
                <div className="space-y-2 mb-4">
                  {PACKAGES.map(pkg => (
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
                        <span className="text-white font-bold">{billingCycle === 'monthly' ? pkg.monthlyPrice : pkg.yearlyPrice}</span>
                        <span className="text-zinc-500 text-xs">/mo</span>
                        {billingCycle === 'yearly' && <p className="text-zinc-600 text-[10px]">{pkg.yearlyTotal}/yr</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-4">
                <button onClick={next} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">Get started →</button>
              </div>
            </div>
          )}

          {/* ── STEP 10: Email / Account ─────────────────────────── */}
          {step === 10 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-4">
                <ProgressBar step={9} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
                <p className="text-zinc-500 text-sm">One step away from your photos.</p>
              </div>
              <div className="px-6 pb-6 space-y-3">
                {/* Apple */}
                <button
                  onClick={() => { window.location.href = '/api/auth/apple' }}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3.5 rounded-2xl text-sm hover:bg-zinc-100 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Continue with Apple
                </button>

                {/* Google */}
                <button
                  onClick={() => { window.location.href = '/api/auth/google' }}
                  className="w-full flex items-center justify-center gap-3 bg-white/8 border border-white/10 text-white font-semibold py-3.5 rounded-2xl text-sm hover:bg-white/12 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-zinc-600 text-xs">or</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                {/* Email */}
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleEmailSubmit}
                  disabled={!email.includes('@') || loading}
                  className={cn('w-full py-3.5 rounded-2xl font-semibold text-sm transition-all', email.includes('@') && !loading ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}
                >
                  {loading ? 'Setting up...' : 'Continue with Email →'}
                </button>

                <p className="text-center text-zinc-600 text-xs pt-1">Already have an account? <Link href="/auth/signin" className="text-zinc-400 hover:text-white">Sign in</Link></p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
