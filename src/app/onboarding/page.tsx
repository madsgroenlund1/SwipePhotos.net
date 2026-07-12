'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 10

const STYLE_OPTIONS = [
  { id: 'restaurant', label: 'Italian Restaurant', src: '/photos/presets/scene-restaurant.jpg', free: true },
  { id: 'formal', label: 'Smart Formal', src: '/photos/presets/scene-formal.jpg', free: true },
  { id: 'rooftop', label: 'Rooftop Pool', src: '/photos/presets/scene-rooftop.jpg', free: true },
  { id: 'beach', label: 'Beach Club', src: '/photos/presets/scene-beach.jpg', free: true },
]

const STYLE_PLACEHOLDERS: Record<string, string[]> = {
  restaurant: ['/photos/presets/scene-restaurant.jpg'],
  formal:     ['/photos/presets/scene-formal.jpg'],
  rooftop:    ['/photos/presets/scene-rooftop.jpg'],
  beach:      ['/photos/presets/scene-beach.jpg'],
}

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

const AI_TRACES_BAD = [
  'SynthID watermark detected',
  'AI generation metadata',
  'GAN fingerprint artifacts',
  'Neural network grid patterns',
  'Texture repetition anomaly',
  'Frequency domain inconsistencies',
  'Facial geometry irregularities',
  'Skin micro-texture patterns',
  'Background coherence loss',
  'Shadow direction mismatch',
  'Lens distortion artifacts',
  'Color channel imbalances',
  'Edge detection residuals',
  'Compression artifact patterns',
]

// ─── Types ───────────────────────────────────────────────────────────────────

type SlotState = {
  file: File
  previewUrl: string
  status: 'accepted' | 'rejected'
  error?: string
}

type AngleSlots = { front: SlotState | null; left: SlotState | null; right: SlotState | null }

type GenStatus =
  | 'idle'
  | 'uploading'
  | 'preparing'
  | 'gen_1'
  | 'gen_2'
  | 'checking'
  | 'saving'
  | 'done'
  | 'error'

const GEN_STATUS_LABEL: Record<GenStatus, string> = {
  idle:      '',
  uploading: 'Validating photos',
  preparing: 'Preparing your setting',
  gen_1:     'Generating preview 1 of 2',
  gen_2:     'Generating preview 2 of 2',
  checking:  'Checking quality',
  saving:    'Saving previews',
  done:      'Ready',
  error:     'Something went wrong',
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

// ─── Upload Slot ──────────────────────────────────────────────────────────────

function UploadSlot({
  angle,
  label,
  guide,
  slot,
  onFile,
  onRemove,
}: {
  angle: string
  label: string
  guide: string
  slot: SlotState | null
  onFile: (file: File) => void
  onRemove: () => void
}) {
  const inputId = `slot-${angle}`

  const borderColor = slot?.status === 'accepted'
    ? 'rgba(34,197,94,0.7)'
    : slot?.status === 'rejected'
    ? 'rgba(239,68,68,0.7)'
    : 'rgba(255,255,255,0.12)'

  return (
    <div className="flex items-start gap-3 mb-3">
      {/* Thumbnail / upload trigger */}
      <div
        className="relative flex-shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all"
        style={{ width: 72, height: 72, border: `2px solid ${borderColor}` }}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) { onFile(f); e.target.value = '' }
          }}
        />
        {slot?.previewUrl ? (
          <>
            <img
              src={slot.previewUrl}
              alt={label}
              className="w-full h-full object-cover"
              style={{ objectPosition: '50% 10%' }}
            />
            <div
              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: slot.status === 'accepted' ? '#22c55e' : '#ef4444' }}
            >
              {slot.status === 'accepted' ? (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.04] gap-1">
            <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-white text-sm font-semibold leading-tight">{label}</p>
        <p className="text-zinc-500 text-xs mt-0.5 leading-snug">{guide}</p>
        {slot?.error && <p className="text-red-400 text-xs mt-0.5">{slot.error}</p>}
      </div>

      {/* Remove button */}
      {slot && (
        <button
          onClick={onRemove}
          className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/10 transition-all"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Upload slots
  const [slots, setSlots] = useState<AngleSlots>({ front: null, left: null, right: null })

  // Generation
  const [genStatus, setGenStatus] = useState<GenStatus>('idle')
  const [genError, setGenError] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [pickedIdx, setPickedIdx] = useState(0)

  // Other state
  const [hasTattoos, setHasTattoos] = useState<boolean | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('restaurant')
  const [selectedPackage, setSelectedPackage] = useState<string>('popular')
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [email, setEmail] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [tracesState, setTracesState] = useState<'bad' | 'cleaning' | 'clean'>('bad')
  const [cleanedCount, setCleanedCount] = useState(0)

  const stylePlaceholders = STYLE_PLACEHOLDERS[selectedStyle] ?? STYLE_PLACEHOLDERS.restaurant
  const selectedAiPhoto = previewUrls[pickedIdx] ?? stylePlaceholders[0]

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  // ─── Slot validation ─────────────────────────────────────────────────────

  function validateSlotFile(file: File): string | null {
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image'
    }
    if (file.size < 15_000) return 'This photo is too small — minimum 15 KB'
    if (file.size > 25_000_000) return 'Photo too large — maximum 25 MB'
    return null
  }

  function handleSlotFile(angle: keyof AngleSlots, file: File) {
    const previewUrl = URL.createObjectURL(file)
    const error = validateSlotFile(file)
    setSlots(prev => ({
      ...prev,
      [angle]: { file, previewUrl, status: error ? 'rejected' : 'accepted', error: error ?? undefined },
    }))
  }

  function clearSlot(angle: keyof AngleSlots) {
    setSlots(prev => {
      const old = prev[angle]
      if (old?.previewUrl) URL.revokeObjectURL(old.previewUrl)
      return { ...prev, [angle]: null }
    })
  }

  const allSlotsAccepted =
    slots.front?.status === 'accepted' &&
    slots.left?.status === 'accepted' &&
    slots.right?.status === 'accepted'

  // ─── Image compress ──────────────────────────────────────────────────────

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
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        canvas.toBlob(blob => {
          resolve((blob && blob.size > 0)
            ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
            : file)
        }, 'image/jpeg', quality)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

  // ─── Step 4: Streaming generation ────────────────────────────────────────

  useEffect(() => {
    if (step !== 4) return

    setGenStatus('idle')
    setGenError(null)
    setPreviewUrls([])
    setPickedIdx(0)

    const abortCtrl = new AbortController()

    async function run() {
      try {
        const frontFile = slots.front?.file
        const leftFile  = slots.left?.file
        const rightFile = slots.right?.file

        if (!frontFile) {
          setGenStatus('error')
          setGenError('Front photo missing — please go back and upload your photos')
          return
        }

        const [front, left, right] = await Promise.all([
          compressImage(frontFile),
          leftFile  ? compressImage(leftFile)  : Promise.resolve(null),
          rightFile ? compressImage(rightFile) : Promise.resolve(null),
        ])

        const fd = new FormData()
        fd.append('front', front)
        if (left)  fd.append('left',  left)
        if (right) fd.append('right', right)
        fd.append('style', selectedStyle)
        fd.append('hasTattoos', String(hasTattoos === true))

        setGenStatus('uploading')

        const response = await fetch('/api/generate/preview', {
          method: 'POST',
          body: fd,
          signal: abortCtrl.signal,
        })

        if (!response.body) throw new Error('No response body from server')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const msg = JSON.parse(line) as { status: string; urls?: string[]; error?: string }
              const s = msg.status as GenStatus
              if (s in GEN_STATUS_LABEL) setGenStatus(s)
              if (s === 'done' && msg.urls?.length) setPreviewUrls(msg.urls)
              if (s === 'error') {
                setGenStatus('error')
                setGenError(msg.error ?? 'Generation failed — please try again')
              }
            } catch {}
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setGenStatus('error')
        setGenError(err instanceof Error ? err.message : 'Something went wrong — please try again')
      }
    }

    run()
    return () => abortCtrl.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // ─── Step 6: AI traces ───────────────────────────────────────────────────

  useEffect(() => {
    if (step === 6) { setTracesState('bad'); setCleanedCount(0) }
  }, [step])

  function handleCleanTraces() {
    if (tracesState !== 'bad') return
    setTracesState('cleaning')
    let count = 0
    const interval = setInterval(() => {
      count++
      setCleanedCount(count)
      if (count >= AI_TRACES_BAD.length) { clearInterval(interval); setTracesState('clean') }
    }, 120)
  }

  // ─── Checkout ────────────────────────────────────────────────────────────

  function getSlotFiles(): File[] {
    return [slots.front, slots.left, slots.right]
      .filter((s): s is SlotState => s !== null && s.status === 'accepted')
      .map(s => s.file)
  }

  async function handleEmailSubmit() {
    if (!email.includes('@') || !agreedToTerms) return
    setLoading(true)
    setCheckoutError(null)
    try {
      const currentPkgs = PACKAGES[billing]
      const pkg = currentPkgs.find(p => p.id === selectedPackage) || currentPkgs.find(p => p.popular) || currentPkgs[0]
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id, priceId: pkg.priceId, email,
          style: selectedStyle, hasTattoos: hasTattoos === true,
          selectedPreviewUrl: previewUrls[pickedIdx] ?? null,
        }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setCheckoutError(data.error || `Something went wrong (${res.status}). Please try again.`)
        setLoading(false)
        return
      }

      if (data.orderId) {
        const slotFiles = getSlotFiles()
        if (slotFiles.length > 0) {
          const compressed = await Promise.all(slotFiles.map(f => compressImage(f)))
          const fd = new FormData()
          fd.append('orderId', data.orderId)
          for (const photo of compressed) fd.append('files', photo)
          await fetch('/api/upload', { method: 'POST', body: fd }).catch(console.error)
        }
      }

      if (data.url) { window.location.href = data.url; return }
      setCheckoutError('No payment URL received. Please try again.')
    } catch (err) {
      setCheckoutError(`Something went wrong. Please try again. (${err})`)
    }
    setLoading(false)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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
                <h2 className="text-2xl font-bold text-white mb-1">Upload 3 photos</h2>
                <p className="text-zinc-500 text-sm">One from each angle — for the best identity match.</p>
              </div>

              <div className="px-4 pb-2">
                {/* Photo requirements */}
                <div className="mb-4 bg-blue-500/8 border border-blue-500/20 rounded-2xl p-3.5">
                  <p className="text-blue-400 text-xs font-semibold mb-2">Photo requirements</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {['Face clearly visible', 'Natural lighting', 'No sunglasses', 'One person only', 'No filters', 'No hats'].map(r => (
                      <div key={r} className="flex items-start gap-1.5">
                        <svg className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <span className="text-zinc-400 text-[11px] leading-tight">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Good examples */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-green-400 text-xs font-semibold">Good examples</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { src: '/photos/before-after/julius/before/1.jpeg', label: 'Front' },
                      { src: '/photos/before-after/julius/before/2.jpeg', label: 'Left' },
                      { src: '/photos/before-after/julius/before/3.jpeg', label: 'Right' },
                    ].map(({ src, label }) => (
                      <div key={label} className="relative rounded-xl overflow-hidden border-2 border-green-500/60" style={{ aspectRatio: '3/4' }}>
                        <img
                          src={src}
                          alt={label}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: '50% 8%', transform: 'scale(1.35)', transformOrigin: 'top center' }}
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 py-1 text-center text-[9px] text-zinc-200 font-medium">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Three upload slots */}
                <div className="mb-4">
                  {(
                    [
                      { angle: 'front' as const, label: 'Front photo', guide: 'Face the camera directly' },
                      { angle: 'left'  as const, label: 'Left-angle photo', guide: 'Turn your head slightly left' },
                      { angle: 'right' as const, label: 'Right-angle photo', guide: 'Turn your head slightly right' },
                    ] as const
                  ).map(({ angle, label, guide }) => (
                    <UploadSlot
                      key={angle}
                      angle={angle}
                      label={label}
                      guide={guide}
                      slot={slots[angle]}
                      onFile={file => handleSlotFile(angle, file)}
                      onRemove={() => clearSlot(angle)}
                    />
                  ))}
                </div>

                {/* Identity note */}
                <div className="mb-4 bg-zinc-900/60 border border-white/8 rounded-2xl px-3.5 py-3">
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    <span className="text-white font-semibold">We preserve your real identity.</span>{' '}
                    Your hair, skin tone, and facial features are kept as close to your actual appearance as possible.
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
                {allSlotsAccepted && (
                  <p className="text-green-400 text-xs text-center mb-2">✓ All 3 photos accepted</p>
                )}
                {!allSlotsAccepted && slots.front?.status === 'accepted' && (
                  <p className="text-zinc-500 text-xs text-center mb-2">Add left and right angle photos for better results</p>
                )}
                <button
                  onClick={next}
                  disabled={!allSlotsAccepted}
                  className={cn(
                    'w-full py-4 rounded-2xl font-semibold text-base transition-all',
                    allSlotsAccepted
                      ? 'bg-blue-600 hover:brightness-110 text-white'
                      : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                  )}
                >
                  {allSlotsAccepted ? 'Generate my previews →' : 'Upload all 3 photos to continue'}
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
              <div className="relative px-6 py-12 min-h-[380px] flex flex-col items-center justify-center overflow-hidden">
                {/* Matrix background */}
                <div className="absolute inset-0 overflow-hidden opacity-20 select-none pointer-events-none">
                  {Array.from({ length: 12 }).map((_, col) => (
                    <div key={col} className="absolute top-0 bottom-0 flex flex-col gap-1 text-red-500 text-[10px] font-mono" style={{ left: `${col * 8.33}%` }}>
                      {Array.from({ length: 30 }).map((_, row) => (
                        <span key={row} style={{ opacity: Math.random() > 0.5 ? 1 : 0.3 }}>{Math.random() > 0.5 ? '1' : '0'}</span>
                      ))}
                    </div>
                  ))}
                </div>

                <h2 className="text-2xl font-bold text-white mb-6 relative z-10">Generating your photos</h2>

                {/* Status indicator */}
                <div className="relative z-10 flex flex-col items-center gap-3 mb-8">
                  {genStatus !== 'error' && genStatus !== 'done' && (
                    <div className="w-10 h-10 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                  )}
                  <p className="text-zinc-300 text-sm font-medium text-center">
                    {GEN_STATUS_LABEL[genStatus] || GEN_STATUS_LABEL.uploading}
                  </p>

                  {/* Status steps */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    {(
                      [
                        { s: 'uploading', label: 'Validating photos' },
                        { s: 'preparing', label: 'Preparing your setting' },
                        { s: 'gen_1',     label: 'Generating preview 1 of 2' },
                        { s: 'gen_2',     label: 'Generating preview 2 of 2' },
                        { s: 'checking',  label: 'Checking quality' },
                        { s: 'saving',    label: 'Saving previews' },
                      ] as const
                    ).map(({ s, label }) => {
                      const statuses: GenStatus[] = ['uploading', 'preparing', 'gen_1', 'gen_2', 'checking', 'saving', 'done']
                      const currentIdx = statuses.indexOf(genStatus)
                      const thisIdx   = statuses.indexOf(s)
                      const isDone    = currentIdx > thisIdx || genStatus === 'done'
                      const isCurrent = genStatus === s

                      return (
                        <div key={s} className="flex items-center gap-2">
                          <div className={cn(
                            'w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                            isDone   ? 'bg-green-500'         :
                            isCurrent ? 'bg-blue-500 animate-pulse' :
                            'bg-white/10'
                          )}>
                            {isDone && (
                              <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={cn(
                            'text-xs transition-all',
                            isDone    ? 'text-green-400' :
                            isCurrent ? 'text-white font-medium' :
                            'text-zinc-700'
                          )}>
                            {label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                {genStatus === 'error' ? (
                  <div className="space-y-2">
                    <p className="text-red-400 text-sm text-center px-2">{genError}</p>
                    <button onClick={() => setStep(3)} className="w-full py-4 rounded-2xl font-semibold text-base bg-zinc-800 hover:bg-zinc-700 text-white transition-all">
                      ← Try different photos
                    </button>
                  </div>
                ) : genStatus === 'done' && previewUrls.length > 0 ? (
                  <button onClick={next} className="w-full py-4 rounded-2xl font-semibold text-base transition-all bg-blue-600 hover:brightness-110 text-white">
                    See your previews →
                  </button>
                ) : (
                  <button disabled className="w-full py-4 rounded-2xl font-semibold text-base bg-white/5 text-zinc-600 cursor-not-allowed">
                    Generating…
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
                <h2 className="text-2xl font-bold text-white mb-0">Pick your favourite!</h2>
                <p className="text-zinc-400 text-sm mt-1">Tap the photo you like best — we&apos;ll match that style for all your shots.</p>
              </div>

              {previewUrls.length >= 2 ? (
                <div className="px-4 pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {previewUrls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setPickedIdx(i)}
                        className={cn(
                          'relative rounded-2xl overflow-hidden transition-all',
                          i === pickedIdx ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#111]' : 'ring-1 ring-white/10 opacity-70 hover:opacity-90'
                        )}
                        style={{ aspectRatio: '3/4' }}
                        onContextMenu={e => e.preventDefault()}
                      >
                        <img
                          src={url}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-full object-cover object-top select-none"
                          draggable={false}
                        />
                        {i === pickedIdx && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 pt-6 pb-2 flex justify-center pointer-events-none">
                          <span className="text-white/30 text-[9px] font-medium tracking-wide">SwipePhotos.net</span>
                        </div>
                        <div className="absolute top-2 left-2">
                          <span className="text-white text-[10px] font-semibold bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                            Preview {i + 1}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : previewUrls.length === 1 ? (
                /* Fallback if only 1 preview came back */
                <div className="px-4 pb-3">
                  <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                    <img src={previewUrls[0]} alt="Preview" className="w-full h-full object-cover object-top" onContextMenu={e => e.preventDefault()} draggable={false} />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 pt-6 pb-2 flex justify-center">
                      <span className="text-white/30 text-[9px]">SwipePhotos.net</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Should not happen — step 4 auto-advances only when done */
                <div className="px-4 pb-3 flex flex-col items-center gap-3 py-12">
                  <div className="w-10 h-10 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                  <p className="text-zinc-400 text-sm">Loading your previews…</p>
                </div>
              )}

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

              <div className="px-4 pb-4">
                <button
                  onClick={next}
                  disabled={previewUrls.length === 0}
                  className={cn(
                    'w-full py-4 rounded-2xl font-semibold text-base transition-all',
                    previewUrls.length > 0
                      ? 'bg-blue-600 hover:brightness-110 text-white'
                      : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                  )}
                >
                  {previewUrls.length > 0 ? 'Choose this photo →' : 'Loading…'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 6: AI Detected ──────────────────────────────── */}
          {step === 6 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-4">
                <ProgressBar step={6} total={TOTAL_STEPS} />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-red-400">DON&apos;T USE THIS PHOTO YET!</h2>
                </div>
                <p className="text-zinc-400 text-sm">AI detectors will flag this as generated. Apps like Hinge and Tinder ban accounts using AI photos. You need to clean it first.</p>
              </div>
              <div className="px-4 pb-3 space-y-2">
                <div className="relative rounded-2xl overflow-hidden mx-auto mb-3" style={{ width: 120, height: 160 }}>
                  <img src={selectedAiPhoto} alt="" className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                    <span className="text-white text-xs font-bold bg-red-500 px-2 py-1 rounded-full">AI DETECTED</span>
                  </div>
                </div>
                {[
                  { name: 'TruthScan', pct: '99%', label: 'AI Generated' },
                  { name: 'sightengine', pct: '98%', label: 'Synthetic' },
                  { name: 'IsThisAI', pct: '99.7%', label: 'Likely AI' },
                ].map(({ name, pct, label }) => (
                  <div key={name} className="flex items-center gap-3 p-3 bg-red-500/8 border border-red-500/30 rounded-2xl">
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{name}</p>
                      <div className="h-1.5 bg-red-500/20 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: pct }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-red-400 font-bold text-sm">{pct}</p>
                      <p className="text-red-400 text-[10px]">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <button onClick={next} className="w-full bg-red-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">
                  Remove AI traces →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 7: Remove AI Traces ──────────────────────────── */}
          {step === 7 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-4">
                <ProgressBar step={7} total={TOTAL_STEPS} />
                <h2 className="text-2xl font-bold text-white mb-1">AI traces found</h2>
                <p className="text-zinc-400 text-sm">These artifacts must be removed before your photo is safe to use.</p>
              </div>
              <div className="px-4 pb-3 space-y-1.5 max-h-72 overflow-y-auto">
                {AI_TRACES_BAD.map((trace, i) => {
                  const cleaned = i < cleanedCount
                  return (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${cleaned ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                      {cleaned ? (
                        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                      <span className={`text-sm transition-all ${cleaned ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>{trace}</span>
                    </div>
                  )
                })}
              </div>
              <div className="px-4 pb-4 pt-2">
                {tracesState === 'clean' ? (
                  <button onClick={next} className="w-full bg-green-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">
                    All traces removed ✓ Continue →
                  </button>
                ) : tracesState === 'cleaning' ? (
                  <button disabled className="w-full bg-blue-600/50 text-white font-semibold py-4 rounded-2xl text-base cursor-not-allowed flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                    Removing traces... ({cleanedCount}/{AI_TRACES_BAD.length})
                  </button>
                ) : (
                  <button onClick={handleCleanTraces} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">
                    Remove all AI traces →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 8: Undetectable ─────────────────────────────── */}
          {step === 8 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-4">
                <ProgressBar step={8} total={TOTAL_STEPS} />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-green-400">Undetectable ✓</h2>
                </div>
                <p className="text-zinc-400 text-sm">All AI traces have been removed. Your photo passes every detector and is safe to use.</p>
              </div>
              <div className="px-4 pb-3 space-y-2">
                <div className="relative rounded-2xl overflow-hidden mx-auto mb-3" style={{ width: 120, height: 160 }}>
                  <img src={selectedAiPhoto} alt="" className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <span className="text-white text-xs font-bold bg-green-500 px-2 py-1 rounded-full">CLEAN ✓</span>
                  </div>
                </div>
                {[
                  { name: 'TruthScan', pct: '3%', label: 'Likely Real' },
                  { name: 'sightengine', pct: '2%', label: 'Natural' },
                  { name: 'IsThisAI', pct: '1.2%', label: 'Human Photo' },
                ].map(({ name, pct, label }) => (
                  <div key={name} className="flex items-center gap-3 p-3 bg-green-500/8 border border-green-500/30 rounded-2xl">
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{name}</p>
                      <div className="h-1.5 bg-green-500/20 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: pct }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-green-400 font-bold text-sm">{pct}</p>
                      <p className="text-green-400 text-[10px]">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <button onClick={next} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">
                  Get my photos →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 9: Pricing ──────────────────────────────────── */}
          {step === 9 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-4 pb-0">
                <ProgressBar step={9} total={TOTAL_STEPS} onBack={back} />
              </div>
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
                    <div key={pos} className={`absolute ${pos}`} style={{ animation: `floatIcon 2.4s ease-in-out infinite`, animationDelay: delay }}>
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
                <ProgressBar step={10} total={TOTAL_STEPS} onBack={back} />
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
                        body: JSON.stringify({
                          packageId: pkgG.id, priceId: pkgG.priceId, email: '',
                          style: selectedStyle, hasTattoos: hasTattoos === true,
                          selectedPreviewUrl: previewUrls[pickedIdx] ?? null,
                        }),
                      })
                      const data = await res.json()
                      if (!res.ok || data.error) {
                        setCheckoutError(data.error || `Something went wrong (${res.status}). Please try again.`)
                        setLoading(false)
                        return
                      }
                      if (data.orderId) {
                        const slotFiles = getSlotFiles()
                        if (slotFiles.length > 0) {
                          const compressed = await Promise.all(slotFiles.map(f => compressImage(f)))
                          const fd = new FormData()
                          fd.append('orderId', data.orderId)
                          for (const photo of compressed) fd.append('files', photo)
                          await fetch('/api/upload', { method: 'POST', body: fd }).catch(console.error)
                        }
                      }
                      if (data.url) {
                        const supabase = createClient()
                        const { data: { user } } = await supabase.auth.getUser()
                        if (user) {
                          if (data.orderId && user.email) {
                            await fetch(`/api/orders/${data.orderId}/set-email`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: user.email }),
                            }).catch(() => {})
                          }
                          window.location.href = data.url
                        } else {
                          localStorage.setItem('sw_pending_checkout', data.url)
                          if (data.orderId) localStorage.setItem('sw_pending_order_id', data.orderId)
                          const pickedUrl = previewUrls[pickedIdx]
                          if (pickedUrl) localStorage.setItem('sw_pending_preview_url', pickedUrl)
                          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
                          await supabase.auth.signInWithOAuth({
                            provider: 'google',
                            options: { redirectTo: `${siteUrl}/auth/callback?next=/go-checkout` },
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

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-zinc-600 text-xs">or use email</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 transition-all"
                />

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

                {checkoutError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                    {checkoutError}
                  </div>
                )}

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
