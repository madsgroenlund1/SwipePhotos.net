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
  { id: 'starter', name: 'Starter', monthlyPrice: '$19', yearlyPrice: '$8', yearlyTotal: '$99', photos: '30 photos/mo', popular: false },
  { id: 'premium', name: 'Premium', monthlyPrice: '$99', yearlyPrice: '$49', yearlyTotal: '$591', photos: '200 photos/mo', popular: true },
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
                  {/* Side previews */}
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
                  {/* Main card */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500/60 z-10" style={{ width: 170, height: 260 }}>
                    <img src={CAROUSEL_PHOTOS[carouselIdx]} alt="" className="w-full h-full object-cover object-top" />
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
                        <img src={CAROUSEL_PHOTOS[carouselIdx]} alt="" className="w-full h-full object-cover object-top" />
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
                        <img src={CAROUSEL_PHOTOS[carouselIdx]} alt="" className="w-full h-full object-cover object-top" />
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
                    <img src={CAROUSEL_PHOTOS[carouselIdx]} alt="" className="w-full h-full object-cover object-top" />
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
                    <div key={pkg.id} className={cn('flex items-center gap-3 p-3 rounded-2xl border', pkg.popular ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/10 bg-white/3')}>
                      <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0', pkg.popular ? 'border-blue-500 bg-blue-500' : 'border-zinc-600')}>
                        {pkg.popular && <div className="w-2 h-2 bg-white rounded-full" />}
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
              </div>
              <div className="px-6 pb-2">
                <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
                <p className="text-zinc-500 text-sm mb-6">Welcome! Please fill in the details to get started.</p>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 pt-4">
                <button
                  onClick={handleEmailSubmit}
                  disabled={!email.includes('@') || loading}
                  className={cn('w-full py-4 rounded-2xl font-semibold text-base transition-all', email.includes('@') && !loading ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}
                >
                  {loading ? 'Setting up...' : 'Continue →'}
                </button>
                <p className="text-center text-zinc-600 text-xs mt-3">Already have an account? <Link href="/auth/signin" className="text-zinc-400 hover:text-white">Sign in</Link></p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
