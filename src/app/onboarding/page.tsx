'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useUser, SignUp } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'
import { PLANS } from '@/lib/pricing'

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 10

// ─── AI-trace items (UnrealPhotos-style detection flow) ──────────────────────
const AI_TRACES = [
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

const STYLE_OPTIONS = [
  { id: 'restaurant', label: 'Italian Restaurant', src: '/photos/presets/scene-restaurant.jpg' },
  { id: 'formal',     label: 'Smart Formal',        src: '/photos/presets/scene-formal.jpg'     },
  { id: 'rooftop',   label: 'Rooftop Pool',         src: '/photos/presets/scene-rooftop.jpg'    },
  { id: 'beach',     label: 'Beach Club',            src: '/photos/presets/scene-beach.jpg'      },
]

const STYLE_PLACEHOLDERS: Record<string, string> = {
  restaurant: '/photos/presets/scene-restaurant.jpg',
  formal:     '/photos/presets/scene-formal.jpg',
  rooftop:    '/photos/presets/scene-rooftop.jpg',
  beach:      '/photos/presets/scene-beach.jpg',
}

const PACKAGES = PLANS

// ─── Refinement steps (honest, no fake percentages) ──────────────────────────

const REFINE_STEPS = [
  { status: 'preparing',          label: 'Preparing selected preview'          },
  { status: 'checking_alignment', label: 'Checking face alignment'             },
  { status: 'blending',           label: 'Improving face and neck blending'    },
  { status: 'skin_tone',          label: 'Matching skin tone and lighting'     },
  { status: 'texture',            label: 'Preserving natural skin texture'     },
  { status: 'artifacts',          label: 'Correcting minor visual artifacts'   },
  { status: 'quality',            label: 'Optimizing image quality'            },
  { status: 'saving',             label: 'Saving final preview'                },
  { status: 'done',               label: 'Ready'                               },
] as const

type RefineStatus = typeof REFINE_STEPS[number]['status'] | 'idle' | 'error'

const REFINE_ORDER: RefineStatus[] = [
  'idle', 'preparing', 'checking_alignment', 'blending', 'skin_tone',
  'texture', 'artifacts', 'quality', 'saving', 'done', 'error',
]

// Generation status labels
type GenStatus = 'idle'|'uploading'|'preparing'|'gen_1'|'gen_2'|'checking'|'saving'|'done'|'error'
const GEN_STATUS_LABEL: Record<GenStatus, string> = {
  idle: '', uploading: 'Validating photos', preparing: 'Preparing your setting',
  gen_1: 'Generating preview 1 of 2', gen_2: 'Generating preview 2 of 2',
  checking: 'Checking quality', saving: 'Saving previews', done: 'Ready', error: 'Something went wrong',
}
const GEN_ORDER: GenStatus[] = ['idle','uploading','preparing','gen_1','gen_2','checking','saving','done']

// ─── Types ───────────────────────────────────────────────────────────────────

type SlotState = { file: File; previewUrl: string; status: 'accepted'|'rejected'; error?: string }
type AngleSlots = { front: SlotState|null; left: SlotState|null; right: SlotState|null; body: SlotState|null }

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(step/total)*100}%` }} />
      </div>
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-3 h-3', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function UploadSlot({ angle, label, guide, slot, onFile, onRemove }: {
  angle: string; label: string; guide: string
  slot: SlotState|null; onFile: (f: File) => void; onRemove: () => void
}) {
  const inputId = `slot-${angle}`
  const borderColor = slot?.status === 'accepted' ? 'rgba(34,197,94,0.7)' : slot?.status === 'rejected' ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.12)'
  return (
    <div className="flex items-start gap-3 mb-3">
      <div
        className="relative flex-shrink-0 rounded-xl overflow-hidden cursor-pointer"
        style={{ width: 72, height: 72, border: `2px solid ${borderColor}` }}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value='' } }} />
        {slot?.previewUrl ? (
          <>
            <img src={slot.previewUrl} alt={label} className="w-full h-full object-cover" style={{ objectPosition: '50% 10%' }} />
            <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: slot.status==='accepted' ? '#22c55e' : '#ef4444' }}>
              {slot.status==='accepted' ? <CheckIcon className="text-white" /> : <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/[0.04]">
            <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-white text-sm font-semibold leading-tight">{label}</p>
        <p className="text-zinc-500 text-xs mt-0.5 leading-snug">{guide}</p>
        {slot?.error && <p className="text-red-400 text-xs mt-0.5">{slot.error}</p>}
      </div>
      {slot && (
        <button onClick={onRemove} className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/10 transition-all">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  )
}

// ─── Mock AI-detector cards (visual only — the actual work is the real
//     AuraSR refinement pass behind the "Remove all AI traces" button) ────────

type DetectorBrand = 'TruthScan' | 'sightengine' | 'IsThisAI'

function BrandChip({ brand }: { brand: DetectorBrand }) {
  return (
    <div className="inline-flex items-center gap-1 bg-white rounded-md px-2 py-1 shadow-sm">
      {brand === 'TruthScan' && (
        <><span className="text-blue-600 text-[10px]">✦</span><span className="text-[10px] font-extrabold text-blue-900">TruthScan</span></>
      )}
      {brand === 'sightengine' && (
        <span className="text-[10px] font-bold text-gray-900">sight<span className="font-extrabold text-blue-600">engine</span></span>
      )}
      {brand === 'IsThisAI' && (
        <><span className="text-[10px] font-extrabold text-gray-900">IsThis</span><span className="text-[9px] font-extrabold text-white bg-blue-500 rounded-full px-1">AI</span></>
      )}
    </div>
  )
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

function DetectorCard({ img, brand, detected }: { img: string; brand: DetectorBrand; detected: boolean }) {
  const accent = detected ? 'text-red-500' : 'text-green-600'
  const pillBg = detected ? 'bg-red-500' : 'bg-green-600'
  return (
    <div className="min-w-0">
      <div className="flex justify-center mb-1.5"><BrandChip brand={brand} /></div>
      <div className={cn('rounded-xl border-2 overflow-hidden bg-white text-left',
        detected ? 'border-red-500/80 shadow-lg shadow-red-500/10' : 'border-green-500/80 shadow-lg shadow-green-500/10')}>

        {brand === 'TruthScan' && (
          <div className="p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-gray-900 text-[9px] font-bold">Basic AI Image Analysis</span>
              <span className="text-gray-400 text-[9px]">✕</span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <MiniBar pct={detected ? 92 : 12} color={detected ? 'bg-red-500' : 'bg-green-600'} />
              <span className={cn('text-[7px] font-bold border rounded px-1', detected ? 'text-red-500 border-red-200' : 'text-green-600 border-green-200')}>{detected ? 'Synthetic' : 'Real'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center mb-2">
              {[
                [detected ? '99% AI' : '10% AI', 'AI Probability'],
                ['High', 'Confidence'],
                [detected ? 'AI Generated' : 'Real', 'Classification'],
              ].map(([v, l]) => (
                <div key={l}><div className="text-gray-900 text-[8px] font-extrabold leading-tight">{v}</div><div className="text-gray-400 text-[6px]">{l}</div></div>
              ))}
            </div>
            <div className="border border-dashed border-blue-300 rounded-lg p-1.5 flex flex-col items-center mb-1.5">
              <img src={img} alt="" className="w-12 h-14 object-cover object-top rounded" onContextMenu={e => e.preventDefault()} />
              <span className="text-gray-400 text-[6px] mt-1">{detected ? 'Generated Image.jpg (2.74 MB)' : 'IMG_9452.JPG (2.83 MB)'}</span>
              <span className={cn('text-white text-[7px] font-bold rounded-full px-2 py-0.5 mt-1', pillBg)}>AI Probability: {detected ? '99%' : '10%'} AI</span>
            </div>
            <div className="text-gray-900 text-[8px] font-bold">Detailed AI Analysis</div>
            <div className="text-gray-400 text-[6px]">In-depth analysis of visual patterns and AI indicators</div>
          </div>
        )}

        {brand === 'sightengine' && (
          <div className="p-2.5">
            <div className="text-gray-900 text-[10px] font-extrabold text-center leading-tight mb-2">Detect AI-generated images</div>
            <div className="flex justify-center mb-1">
              <img src={img} alt="" className="w-20 h-24 object-cover object-top rounded" onContextMenu={e => e.preventDefault()} />
            </div>
            <div className="text-gray-400 text-[6px] text-center mb-2">Tap to try an image or video</div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-gray-900 text-[8px] font-extrabold leading-tight">{detected ? 'Likely AI-generated' : 'Not likely to be AI-generated'}</span>
              <span className={cn('text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded', pillBg)}>{detected ? '92%' : '3%'}</span>
            </div>
            {[
              ['GenAI', detected ? 92 : 1],
              ['Face manipulation', detected ? 1 : 3],
            ].map(([label, pct]) => (
              <div key={String(label)} className="flex items-center gap-1.5 mb-1">
                <span className="text-gray-500 text-[6px] w-14 flex-shrink-0">{label}</span>
                <MiniBar pct={Number(pct)} color={detected ? 'bg-red-500' : 'bg-gray-400'} />
                <span className="text-gray-500 text-[6px]">{pct}%</span>
              </div>
            ))}
          </div>
        )}

        {brand === 'IsThisAI' && (
          <div className="p-2.5">
            <div className="flex justify-center mb-2">
              <img src={img} alt="" className="w-20 h-24 object-cover object-top rounded" onContextMenu={e => e.preventDefault()} />
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-[6px] font-bold tracking-wide">ANALYSIS RESULT</span>
              <span className="text-gray-500 text-[6px] border border-gray-200 rounded-full px-1.5">↗ Share</span>
            </div>
            <div className={cn('border rounded-lg p-1.5 mb-1.5', detected ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50')}>
              <div className={cn('text-[9px] font-extrabold', accent)}>{detected ? '⚠ AI-Generated' : '✓ Likely Real'}</div>
              <div className="text-gray-500 text-[6px] mb-1">{detected ? '99% Confidence' : '90% Confidence'}</div>
              <MiniBar pct={detected ? 99 : 90} color={detected ? 'bg-red-500' : 'bg-green-600'} />
            </div>
            <div className="border border-gray-200 rounded-lg p-1.5">
              <div className="text-gray-900 text-[7px] font-bold mb-1">Detailed Reasoning 🔒</div>
              <div className="space-y-0.5 mb-1">
                <div className="h-1 bg-gray-200 rounded blur-[1px]" />
                <div className="h-1 bg-gray-200 rounded blur-[1px] w-4/5" />
                <div className="h-1 bg-gray-200 rounded blur-[1px] w-3/5" />
              </div>
              <div className="text-blue-500 text-[6px] font-bold border border-blue-200 rounded-full px-1.5 py-0.5 inline-block">🔒 Upgrade to unlock</div>
            </div>
          </div>
        )}
      </div>
      <div className={cn('pt-1.5 text-center text-[11px] font-bold', accent)}>
        {detected ? '✕ AI Detected' : '✓ Human'}
      </div>
    </div>
  )
}

// All three detector cards side by side — no scrolling
function DetectorRow({ img, detected }: { img: string; detected: boolean }) {
  const brands: DetectorBrand[] = detected ? ['TruthScan', 'sightengine', 'IsThisAI'] : ['sightengine', 'TruthScan', 'IsThisAI']
  return (
    <div className="grid grid-cols-3 gap-2">
      {brands.map(brand => <DetectorCard key={brand} img={img} brand={brand} detected={detected} />)}
    </div>
  )
}

// Skeleton row shown while "scanning"/"verifying" — empty cards with an
// animated progress bar, revealed as the real result cards afterwards.
function DetectorSkeletonRow({ detected }: { detected: boolean }) {
  const brands: DetectorBrand[] = detected ? ['TruthScan', 'sightengine', 'IsThisAI'] : ['sightengine', 'TruthScan', 'IsThisAI']
  return (
    <div className="grid grid-cols-3 gap-2">
      {brands.map((brand, i) => (
        <div key={brand} className="min-w-0">
          <div className="flex justify-center mb-1.5"><BrandChip brand={brand} /></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center" style={{ aspectRatio: '3/5' }}>
            <div className="w-3/5 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', detected ? 'bg-red-500' : 'bg-green-500')}
                style={{ animation: 'fillbar 2.4s ease-in-out forwards', animationDelay: `${i * 0.2}s`, width: '0%' }} />
            </div>
          </div>
        </div>
      ))}
      <style>{`@keyframes fillbar { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const { user: clerkUser } = useUser()

  // Upload slots
  const [slots, setSlots] = useState<AngleSlots>({ front: null, left: null, right: null, body: null })

  // Generation
  const [genStatus, setGenStatus]     = useState<GenStatus>('idle')
  const [genError, setGenError]       = useState<string|null>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [pickedIdx, setPickedIdx]     = useState(0)

  // Refinement (runs behind the "Remove all AI traces" button on step 7)
  const [refineStatus, setRefineStatus] = useState<RefineStatus>('idle')
  const [refineError, setRefineError]   = useState<string|null>(null)
  const [refinedUrl, setRefinedUrl]     = useState<string|null>(null)
  const [removingTraces, setRemovingTraces] = useState(false)
  const [tracesCleared, setTracesCleared]   = useState(0)
  // Short "scanning" reveal phases before the detection verdicts
  const [scanDone, setScanDone]     = useState(false)
  const [verifyDone, setVerifyDone] = useState(false)

  // Other
  const [hasTattoos, setHasTattoos]         = useState<boolean|null>(null)
  const [tattooFile, setTattooFile]         = useState<File|null>(null)
  const [tattooPreview, setTattooPreview]   = useState<string|null>(null)
  const [selectedStyle, setSelectedStyle]   = useState('restaurant')
  const [selectedPackage, setSelectedPackage] = useState('popular')
  const [billing, setBilling] = useState<'monthly'|'yearly'>('monthly')
  const priceIdFor = (pkg: typeof PACKAGES[number]) => billing === 'yearly' ? pkg.yearlyPriceId : pkg.monthlyPriceId
  const [checkoutReady, setCheckoutReady]   = useState(false)
  const [loading, setLoading]               = useState(false)
  const [checkoutError, setCheckoutError]   = useState<string|null>(null)

  const stylePlaceholder = STYLE_PLACEHOLDERS[selectedStyle] ?? STYLE_PLACEHOLDERS.restaurant
  // Use refined URL if available, fall back to picked raw preview, then placeholder
  const displayPhoto = refinedUrl ?? previewUrls[pickedIdx] ?? stylePlaceholder

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  // ─── Slot helpers ──────────────────────────────────────────────────────────

  function validateSlotFile(file: File): string|null {
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type)) return 'Please upload a JPEG, PNG, or WebP image'
    if (file.size < 15_000)    return 'This photo is too small — minimum 15 KB'
    if (file.size > 25_000_000) return 'Photo too large — maximum 25 MB'
    return null
  }

  function handleSlotFile(angle: keyof AngleSlots, file: File) {
    const previewUrl = URL.createObjectURL(file)
    const error = validateSlotFile(file)
    setSlots(prev => ({ ...prev, [angle]: { file, previewUrl, status: error ? 'rejected' : 'accepted', error: error ?? undefined } }))
  }

  function clearSlot(angle: keyof AngleSlots) {
    setSlots(prev => { const old = prev[angle]; if (old?.previewUrl) URL.revokeObjectURL(old.previewUrl); return { ...prev, [angle]: null } })
  }

  const allSlotsAccepted = slots.front?.status === 'accepted' && slots.left?.status === 'accepted' && slots.right?.status === 'accepted' && slots.body?.status === 'accepted'

  // ─── Image compress ────────────────────────────────────────────────────────

  function compressImage(file: File, maxPx = 1024, quality = 0.85): Promise<File> {
    return new Promise(resolve => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        canvas.toBlob(blob => resolve((blob && blob.size > 0) ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file), 'image/jpeg', quality)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

  function getSlotFiles(): File[] {
    return [slots.front, slots.left, slots.right, slots.body].filter((s): s is SlotState => s !== null && s.status === 'accepted').map(s => s.file)
  }

  // ─── Step 4: streaming generation ─────────────────────────────────────────

  useEffect(() => {
    if (step !== 4) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGenStatus('idle'); setGenError(null); setPreviewUrls([]); setPickedIdx(0)
    const abortCtrl = new AbortController()

    async function run() {
      const frontFile = slots.front?.file
      if (!frontFile) { setGenStatus('error'); setGenError('Front photo missing'); return }
      try {
        const [front, left, right, body] = await Promise.all([
          compressImage(frontFile),
          slots.left?.file  ? compressImage(slots.left.file)  : Promise.resolve(null),
          slots.right?.file ? compressImage(slots.right.file) : Promise.resolve(null),
          slots.body?.file  ? compressImage(slots.body.file)  : Promise.resolve(null),
        ])
        const fd = new FormData()
        fd.append('front', front)
        if (left)  fd.append('left', left)
        if (right) fd.append('right', right)
        if (body)  fd.append('body', body)
        fd.append('style', selectedStyle)
        fd.append('hasTattoos', String(hasTattoos === true))
        if (hasTattoos === true && tattooFile) {
          fd.append('tattooPhoto', await compressImage(tattooFile))
        }
        setGenStatus('uploading')

        const response = await fetch('/api/generate/preview', { method: 'POST', body: fd, signal: abortCtrl.signal })
        if (!response.body) throw new Error('No response body')
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const msg = JSON.parse(line) as { status: string; urls?: string[]; error?: string }
              const s = msg.status as GenStatus
              if (s in GEN_STATUS_LABEL) setGenStatus(s)
              if (s === 'done' && msg.urls?.length) setPreviewUrls(msg.urls)
              if (s === 'error') { setGenStatus('error'); setGenError(msg.error ?? 'Generation failed') }
            } catch {}
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setGenStatus('error'); setGenError(err instanceof Error ? err.message : 'Something went wrong')
      }
    }
    run()
    return () => abortCtrl.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // ─── Step 7: streaming refinement (triggered by "Remove all AI traces") ───

  useEffect(() => {
    if (step !== 7 || !removingTraces) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRefineStatus('idle'); setRefineError(null); setRefinedUrl(null)
    const abortCtrl = new AbortController()

    async function run() {
      const selectedUrl = previewUrls[pickedIdx]
      if (!selectedUrl) { setRefineStatus('error'); setRefineError('No preview selected'); return }
      try {
        const response = await fetch('/api/refine/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ previewUrl: selectedUrl }),
          signal: abortCtrl.signal,
        })
        if (!response.body) throw new Error('No response body')
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const msg = JSON.parse(line) as { status: string; url?: string; error?: string }
              setRefineStatus(msg.status as RefineStatus)
              if (msg.status === 'done' && msg.url) setRefinedUrl(msg.url)
              if (msg.status === 'error') { setRefineStatus('error'); setRefineError(msg.error ?? 'Refinement failed') }
            } catch {}
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setRefineStatus('error'); setRefineError(err instanceof Error ? err.message : 'Something went wrong')
      }
    }
    run()
    return () => abortCtrl.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, removingTraces])

  // Scanning phase on the scare screen (step 6) and verify phase on the
  // Undetectable screen (step 8) — brief suspense before the verdict.
  useEffect(() => {
    if (step === 6) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScanDone(false)
      const t = setTimeout(() => setScanDone(true), 2600)
      return () => clearTimeout(t)
    }
    if (step === 8) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVerifyDone(false)
      const t = setTimeout(() => setVerifyDone(true), 2000)
      return () => clearTimeout(t)
    }
  }, [step])

  // Trace-clearing animation: tick one item green every ~1.6s while the real
  // refinement runs; hold the last item until refinement completes.
  useEffect(() => {
    if (!removingTraces || refineStatus === 'error') return
    if (refineStatus === 'done') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTracesCleared(AI_TRACES.length)
      const t = setTimeout(next, 900)
      return () => clearTimeout(t)
    }
    const iv = setInterval(() => {
      setTracesCleared(n => Math.min(n + 1, AI_TRACES.length - 1))
    }, 1600)
    return () => clearInterval(iv)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removingTraces, refineStatus])

  // ─── Checkout ─────────────────────────────────────────────────────────────

  // Create the Stripe checkout session + upload photos, then either go
  // straight to payment (signed in) or stash it and show the Clerk box.
  async function prepareCheckout() {
    setLoading(true); setCheckoutError(null)
    try {
      const pkg = PACKAGES.find(p => p.id === selectedPackage) || PACKAGES.find(p => p.popular) || PACKAGES[1]
      const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? ''
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, priceId: priceIdFor(pkg), email: clerkEmail, style: selectedStyle, hasTattoos: hasTattoos===true, selectedPreviewUrl: displayPhoto }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setCheckoutError(data.error || `Something went wrong (${res.status})`); setLoading(false); return }
      if (data.orderId) {
        const files = getSlotFiles()
        if (files.length > 0) {
          const compressed = await Promise.all(files.map(f => compressImage(f)))
          const fd = new FormData(); fd.append('orderId', data.orderId)
          for (const c of compressed) fd.append('files', c)
          await fetch('/api/upload', { method: 'POST', body: fd }).catch(console.error)
        }
      }
      if (!data.url) { setCheckoutError('No payment URL received. Please try again.'); setLoading(false); return }

      if (clerkUser && clerkEmail) {
        // Already signed in → straight to Stripe
        if (data.orderId) {
          await fetch(`/api/orders/${data.orderId}/set-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: clerkEmail }) }).catch(() => {})
        }
        window.location.href = data.url
        return
      }

      // Not signed in — stash and show the Clerk sign-up box. After sign-up
      // Clerk force-redirects to /go-checkout which forwards to Stripe.
      localStorage.setItem('sw_pending_checkout', data.url)
      if (data.orderId) localStorage.setItem('sw_pending_order_id', data.orderId)
      if (displayPhoto) localStorage.setItem('sw_pending_preview_url', displayPhoto)
      setCheckoutReady(true)
      setLoading(false)
    } catch {
      setCheckoutError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // Prepare the checkout as soon as the user reaches the final step
  useEffect(() => {
    if (step !== 10) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckoutReady(false)
    prepareCheckout()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
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
                <button onClick={next} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">Continue →</button>
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
                {STYLE_OPTIONS.map(opt => (
                  <div key={opt.id} onClick={() => setSelectedStyle(opt.id)}>
                    <div className={cn('relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer', selectedStyle===opt.id ? 'border-blue-500' : 'border-white/10')}>
                      <img src={opt.src} alt={opt.label} className="w-full h-full object-cover object-top" />
                      {selectedStyle===opt.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckIcon className="text-white w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-zinc-400 text-xs mt-1.5 text-center">{opt.label}</p>
                  </div>
                ))}
              </div>
              <div className="relative px-4 mt-1 mb-2 overflow-hidden" style={{ height: 80 }}>
                <div className="grid grid-cols-4 gap-1.5 opacity-50">
                  {['1', '2', '3', '4'].map(n => (
                    <div key={n} className="aspect-[3/4] rounded-xl overflow-hidden">
                      <img src={`/photos/template-strip/${n}.jpg`} alt="" className="w-full h-full object-cover object-top" />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent flex items-end justify-center pb-2">
                  <p className="text-zinc-500 text-xs font-medium">Browse 40 templates after purchase</p>
                </div>
              </div>
              <div className="px-4 pb-4 pt-1">
                <button onClick={next} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Upload ───────────────────────────────────── */}
          {step === 3 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-4">
                <ProgressBar step={3} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-white mb-1">Upload 4 photos</h2>
                <p className="text-zinc-500 text-sm">One from each angle — for the best identity match.</p>
                <p className="text-zinc-500 text-sm mt-1.5">Keep your mouth closed with a slight, natural smile — relaxed and positive gives the best results.</p>
              </div>
              <div className="px-4 pb-2">
                {/* Requirements */}
                <div className="mb-4 bg-blue-500/8 border border-blue-500/20 rounded-2xl p-3.5">
                  <p className="text-blue-400 text-xs font-semibold mb-2">Photo requirements</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {['Face clearly visible','Natural lighting','No sunglasses','One person only','No filters','No hats'].map(r => (
                      <div key={r} className="flex items-start gap-1.5">
                        <CheckIcon className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-400 text-[11px] leading-tight">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Good examples */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckIcon className="text-green-400" />
                    <span className="text-green-400 text-xs font-semibold">Good examples</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { src: '/photos/upload-examples/left.jpg',  label: 'Left'  },
                      { src: '/photos/upload-examples/front.jpg', label: 'Front' },
                      { src: '/photos/upload-examples/right.jpg', label: 'Right' },
                    ].map(({ src, label }) => (
                      <div key={label} className="relative rounded-xl overflow-hidden border-2 border-green-500/60" style={{ aspectRatio: '3/4' }}>
                        <img src={src} alt={label} className="w-full h-full object-cover object-top" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 py-1 text-center text-[9px] text-zinc-200 font-medium">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Full-body slot */}
                <div className="mb-1 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <UploadSlot angle="body" label="Full-body photo" guide="Show your whole body — head to shoes"
                      slot={slots.body} onFile={f => handleSlotFile('body', f)} onRemove={() => clearSlot('body')} />
                  </div>
                  <div className="flex-shrink-0 w-14">
                    <div className="relative rounded-xl overflow-hidden border border-green-500/40" style={{ aspectRatio: '3/4' }}>
                      <img src="/photos/upload-examples/body.jpg" alt="Full-body example" className="w-full h-full object-cover object-top" />
                    </div>
                    <p className="text-green-400 text-[8px] text-center mt-0.5 font-medium">✓ Example</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 mb-4" />

                {/* Upload slots */}
                <div className="mb-4">
                  {([
                    { angle: 'left'  as const, label: 'Left-angle photo',  guide: 'Turn your head slightly left'    },
                    { angle: 'front' as const, label: 'Front photo',       guide: 'Face the camera directly'        },
                    { angle: 'right' as const, label: 'Right-angle photo', guide: 'Turn your head slightly right'   },
                  ]).map(({ angle, label, guide }) => (
                    <UploadSlot key={angle} angle={angle} label={label} guide={guide}
                      slot={slots[angle]} onFile={f => handleSlotFile(angle, f)} onRemove={() => clearSlot(angle)} />
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
                  <p className="text-zinc-500 text-xs mb-2">Upload a clear photo of your tattoos so we can reproduce them accurately.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setHasTattoos(false)} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all', hasTattoos===false ? 'bg-white/15 border-white/40 text-white' : 'bg-white/5 border-white/10 text-zinc-400')}>No</button>
                    <button onClick={() => setHasTattoos(true)}  className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all', hasTattoos===true  ? 'bg-white/15 border-white/40 text-white' : 'bg-white/5 border-white/10 text-zinc-400')}>Yes — I have tattoos</button>
                  </div>

                  {hasTattoos === true && (
                    <div className="mt-3 bg-white/[0.03] border border-white/8 rounded-2xl p-3.5">
                      <div className="flex gap-3">
                        {/* Example with arrow pointing at the tattoo */}
                        <div className="flex-shrink-0 w-24">
                          <div className="relative rounded-xl overflow-hidden border border-green-500/40" style={{ aspectRatio: '3/4' }}>
                            <img src="/photos/upload-examples/tattoo-example.jpg" alt="Tattoo example" className="w-full h-full object-cover object-top" />
                            {/* Red arrow, left → right, pointing at the tattoo */}
                            <svg className="absolute text-red-500 drop-shadow-md" style={{ left: '1%', top: '64%', width: '34%' }} viewBox="0 0 40 16" fill="none" aria-hidden>
                              <path d="M2 8h28m0 0l-7-6m7 6l-7 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <p className="text-green-400 text-[9px] text-center mt-1 font-medium">✓ Good example</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Upload slot */}
                          <input id="tattoo-file" type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) {
                                if (tattooPreview) URL.revokeObjectURL(tattooPreview)
                                setTattooFile(f); setTattooPreview(URL.createObjectURL(f))
                              }
                              e.target.value = ''
                            }} />
                          <button type="button" onClick={() => document.getElementById('tattoo-file')?.click()}
                            className="w-full border border-dashed border-white/15 hover:border-blue-500/40 rounded-xl px-3 py-2.5 text-zinc-400 hover:text-zinc-200 text-xs transition-all flex items-center justify-center gap-2 mb-2">
                            {tattooPreview ? (
                              <><img src={tattooPreview} alt="" className="w-6 h-6 rounded object-cover" /> Change photo</>
                            ) : (
                              <>＋ Upload a photo of your tattoos</>
                            )}
                          </button>
                          <p className="text-zinc-500 text-[11px] leading-relaxed">Make sure the tattoo is clearly visible, in natural light and not covered by clothing.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4">
                {allSlotsAccepted && <p className="text-green-400 text-xs text-center mb-2">✓ All 4 photos accepted</p>}
                <button onClick={next} disabled={!allSlotsAccepted} className={cn('w-full py-4 rounded-2xl font-semibold text-base transition-all', allSlotsAccepted ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}>
                  {allSlotsAccepted ? 'Generate my previews →' : 'Upload all 4 photos to continue'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Generating ───────────────────────────────── */}
          {step === 4 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-0">
                <ProgressBar step={4} total={TOTAL_STEPS} onBack={() => setStep(3)} />
              </div>
              <div className="relative px-6 py-12 min-h-[380px] flex flex-col items-center justify-center overflow-hidden">
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
                <div className="relative z-10 flex flex-col items-center gap-3 mb-8">
                  {genStatus !== 'error' && genStatus !== 'done' && (
                    <div className="w-10 h-10 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                  )}
                  <p className="text-zinc-300 text-sm font-medium text-center">{GEN_STATUS_LABEL[genStatus] || GEN_STATUS_LABEL.uploading}</p>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {([
                      { s: 'uploading' as GenStatus, label: 'Validating photos'         },
                      { s: 'preparing' as GenStatus, label: 'Preparing your setting'    },
                      { s: 'gen_1'     as GenStatus, label: 'Generating preview 1 of 2' },
                      { s: 'gen_2'     as GenStatus, label: 'Generating preview 2 of 2' },
                      { s: 'checking'  as GenStatus, label: 'Checking quality'          },
                      { s: 'saving'    as GenStatus, label: 'Saving previews'           },
                    ]).map(({ s, label }) => {
                      const ci = GEN_ORDER.indexOf(genStatus), ti = GEN_ORDER.indexOf(s)
                      const isDone = ci > ti || genStatus === 'done'
                      const isCur  = genStatus === s
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <div className={cn('w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all', isDone ? 'bg-green-500' : isCur ? 'bg-blue-500 animate-pulse' : 'bg-white/10')}>
                            {isDone && <CheckIcon className="text-white w-2 h-2" />}
                          </div>
                          <span className={cn('text-xs transition-all', isDone ? 'text-green-400' : isCur ? 'text-white font-medium' : 'text-zinc-700')}>{label}</span>
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
                    <button onClick={() => setStep(3)} className="w-full py-4 rounded-2xl font-semibold text-base bg-zinc-800 hover:bg-zinc-700 text-white transition-all">← Try different photos</button>
                  </div>
                ) : genStatus === 'done' && previewUrls.length > 0 ? (
                  <button onClick={next} className="w-full py-4 rounded-2xl font-semibold text-base bg-blue-600 hover:brightness-110 text-white transition-all">See your previews →</button>
                ) : (
                  <button disabled className="w-full py-4 rounded-2xl font-semibold text-base bg-white/5 text-zinc-600 cursor-not-allowed">Generating…</button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 5: Pick preview ─────────────────────────────── */}
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
                      <button key={i} onClick={() => setPickedIdx(i)}
                        className={cn('relative rounded-2xl overflow-hidden transition-all', i===pickedIdx ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#111]' : 'ring-1 ring-white/10 opacity-70 hover:opacity-90')}
                        style={{ aspectRatio: '3/4' }} onContextMenu={e => e.preventDefault()}>
                        <img src={url} alt={`Preview ${i+1}`} className="w-full h-full object-cover object-top select-none" draggable={false} />
                        {i===pickedIdx && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckIcon className="text-white w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="text-white text-[10px] font-semibold bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">Preview {i+1}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-4 pb-3 flex flex-col items-center gap-3 py-12">
                  <div className="w-10 h-10 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                  <p className="text-zinc-400 text-sm">Loading previews…</p>
                </div>
              )}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2">
                  {['1', '2', '3', '4'].map(n => (
                    <div key={n} className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border border-white/10">
                      <img src={`/photos/template-strip/${n}.jpg`} alt="" className="w-full h-full object-cover object-top" />
                    </div>
                  ))}
                  <span className="ml-auto text-white text-xs font-semibold bg-white/10 border border-white/10 rounded-full px-3 py-1.5 whitespace-nowrap">+40 styles</span>
                </div>
              </div>
              <div className="px-4 pb-4">
                <button onClick={next} disabled={previewUrls.length === 0}
                  className={cn('w-full py-4 rounded-2xl font-semibold text-base transition-all', previewUrls.length > 0 ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}>
                  {previewUrls.length > 0 ? 'Choose this photo →' : 'Loading…'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 6: Don't use this photo yet (AI detected) ───── */}
          {step === 6 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-0">
                <ProgressBar step={6} total={TOTAL_STEPS} onBack={back} />
              </div>
              <div className="px-5 pt-2 pb-3 text-center">
                <h2 className={cn('text-2xl font-extrabold mb-1.5 tracking-tight', scanDone ? 'text-red-500 uppercase' : 'text-white')}>
                  {scanDone ? "Don't use this photo yet!" : 'Scanning your photo…'}
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {scanDone ? "Dating apps can detect it's AI generated and might permanently ban you." : 'Running it through the major AI detectors.'}
                </p>
              </div>
              <div className="px-4 pb-3">
                {scanDone
                  ? <DetectorRow img={previewUrls[pickedIdx] ?? stylePlaceholder} detected />
                  : <DetectorSkeletonRow detected />}
              </div>
              <div className="px-4 pb-4">
                <button onClick={next} disabled={!scanDone}
                  className={cn('w-full font-semibold py-4 rounded-2xl transition-all text-base', scanDone ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}>
                  {scanDone ? 'Continue →' : 'Scanning…'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 7: AI traces + real refinement ──────────────── */}
          {step === 7 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-0">
                <ProgressBar step={7} total={TOTAL_STEPS} />
              </div>
              <div className="px-5 pt-2 pb-3">
                <h2 className="text-2xl font-bold text-white mb-3">AI traces found in your photo</h2>
                {!removingTraces && (
                  <button onClick={() => { setTracesCleared(0); setRemovingTraces(true) }}
                    className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:brightness-110 text-white font-bold py-3.5 rounded-2xl transition-all text-base shadow-lg shadow-red-500/20 mb-3">
                    Remove all AI traces
                  </button>
                )}
                <div className="space-y-1.5">
                  {AI_TRACES.map((trace, i) => {
                    const cleared = removingTraces && i < tracesCleared
                    return (
                      <div key={trace} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/6 rounded-xl px-3 py-2">
                        {cleared ? <CheckIcon className="text-green-400 w-3 h-3 flex-shrink-0" /> : (
                          <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        <span className={cn('text-sm transition-all', cleared ? 'text-green-400 line-through' : 'text-zinc-300')}>{trace}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="px-4 pb-4 pt-2">
                {refineStatus === 'error' ? (
                  <div className="space-y-2">
                    <p className="text-red-400 text-sm text-center px-2">{refineError}</p>
                    <button onClick={() => { setRemovingTraces(false); setStep(5) }} className="w-full py-4 rounded-2xl font-semibold text-base bg-zinc-800 hover:bg-zinc-700 text-white transition-all">← Pick a different preview</button>
                  </div>
                ) : (
                  <button disabled className="w-full py-4 rounded-2xl font-semibold text-base bg-white/5 text-zinc-600 cursor-not-allowed">
                    {removingTraces ? (refineStatus === 'done' ? 'All traces removed ✓' : 'Removing traces…') : 'Continue →'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 8: Undetectable ─────────────────────────────── */}
          {step === 8 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-0">
                <ProgressBar step={8} total={TOTAL_STEPS} />
              </div>
              <div className="px-5 pt-2 pb-3 text-center">
                <h2 className={cn('text-3xl font-extrabold mb-1.5', verifyDone ? 'text-green-400' : 'text-white')}>
                  {verifyDone ? 'Undetectable' : 'Verifying your new photo…'}
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {verifyDone ? 'Your photo now passes all major AI detection tools. Safe to upload to any dating app.' : 'Re-running all AI detection tools.'}
                </p>
              </div>
              <div className="px-4 pb-3">
                {verifyDone
                  ? <DetectorRow img={displayPhoto} detected={false} />
                  : <DetectorSkeletonRow detected={false} />}
              </div>
              <div className="px-4 pb-4">
                <button onClick={next} disabled={!verifyDone}
                  className={cn('w-full font-semibold py-4 rounded-2xl transition-all text-base', verifyDone ? 'bg-blue-600 hover:brightness-110 text-white' : 'bg-white/5 text-zinc-600 cursor-not-allowed')}>
                  {verifyDone ? 'Continue →' : 'Verifying…'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 9: Your matches are waiting + pricing ───────── */}
          {step === 9 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-4 pb-0">
                <ProgressBar step={9} total={TOTAL_STEPS} onBack={back} />
              </div>
              {/* Central photo with floating app icons */}
              <div className="relative flex justify-center pt-4 pb-6">
                <div className="relative">
                  <div className="w-40 h-48 rounded-3xl overflow-hidden border border-white/15 shadow-xl">
                    <img src={displayPhoto} alt="Your AI photo" className="w-full h-full object-cover object-top" onContextMenu={e => e.preventDefault()} />
                  </div>
                  {/* App icons with realistic (non-guaranteed) counters */}
                  {[
                    { pos: '-top-3 -left-6',     delay: '0s',   logo: 'tinder',    count: '99+' },
                    { pos: '-top-3 -right-6',    delay: '0.4s', logo: 'hinge',     count: '99+' },
                    { pos: '-bottom-3 -left-8',  delay: '0.8s', logo: 'bumble',    count: '99+' },
                    { pos: '-bottom-5 -right-6', delay: '1.2s', logo: 'instagram', count: '99+' },
                  ].map(({ pos, delay, logo, count }) => (
                    <div key={logo} className={`absolute ${pos}`} style={{ animation: `floatIcon 2.4s ease-in-out infinite`, animationDelay: delay }}>
                      <div className="relative w-11 h-11">
                        <div className="w-11 h-11 rounded-xl overflow-hidden shadow-xl">
                          <img src={`/logos/dating-app-logos/${logo}.png`} alt={logo} className="w-full h-full object-cover" />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[20px] h-[18px] flex items-center justify-center px-1 shadow-md border border-[#111]">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-2 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Your matches are waiting</h2>
                <div className="flex flex-col items-center gap-1 mb-3">
                  {['40+ proven templates', 'Photos that look like the real you', "Don't get banned"].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckIcon className="text-green-400 w-3.5 h-3.5" />
                      <span className="text-zinc-300 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-2">
                {/* Monthly / Yearly toggle */}
                <div className="flex bg-white/[0.04] border border-white/10 rounded-2xl p-1 mb-3">
                  <button onClick={() => setBilling('monthly')}
                    className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all', billing==='monthly' ? 'bg-white/10 text-white' : 'text-zinc-500')}>
                    Monthly
                  </button>
                  <button onClick={() => setBilling('yearly')}
                    className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5', billing==='yearly' ? 'bg-white/10 text-white' : 'text-zinc-500')}>
                    Yearly
                    <span className="bg-green-500/15 text-green-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">50% OFF</span>
                  </button>
                </div>
                <div className="space-y-2 mb-3">
                  {PACKAGES.map(pkg => (
                    <div key={pkg.id} onClick={() => setSelectedPackage(pkg.id)} className={cn('flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all', selectedPackage===pkg.id ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/10 bg-white/[0.03] hover:border-white/20')}>
                      <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0', selectedPackage===pkg.id ? 'border-blue-500 bg-blue-500' : 'border-zinc-600')}>
                        {selectedPackage===pkg.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-semibold">{pkg.name}</span>
                          {pkg.popular && <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Popular</span>}
                        </div>
                        <span className="text-zinc-500 text-xs">{pkg.photos}</span>
                      </div>
                      <div className="text-right">
                        {billing === 'yearly' ? (
                          <>
                            <div><span className="text-green-400 font-bold">€{Math.round(pkg.yearly/12)}</span><span className="text-zinc-500 text-xs">/mo</span></div>
                            <div className="text-zinc-600 text-[10px]">€{pkg.yearly}/yr</div>
                          </>
                        ) : (
                          <div><span className="text-white font-bold">€{pkg.monthly}</span><span className="text-zinc-500 text-xs">/mo</span></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-4">
                <button onClick={next} className="w-full bg-blue-600 hover:brightness-110 text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg shadow-blue-500/20">Get started →</button>
              </div>
            </div>
          )}

          {/* ── STEP 10: Sign in with Clerk → payment ────────────── */}
          {step === 10 && (
            <div className="bg-[#111] rounded-3xl overflow-hidden">
              <div className="p-6 pb-2">
                <ProgressBar step={10} total={TOTAL_STEPS} onBack={back} />
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight text-center">Almost there</h2>
                <p className="text-zinc-500 text-sm text-center">Create your account to save your photos and continue to payment.</p>
              </div>
              <div className="px-2 pb-6 flex justify-center">
                {checkoutError ? (
                  <div className="px-4 py-6 w-full">
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-3">{checkoutError}</div>
                    <button onClick={prepareCheckout} className="w-full bg-blue-600 hover:brightness-110 text-white font-semibold py-4 rounded-2xl transition-all text-base">Try again</button>
                  </div>
                ) : !checkoutReady || loading ? (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                    <p className="text-zinc-500 text-sm">Preparing your order…</p>
                  </div>
                ) : (
                  <SignUp
                    routing="hash"
                    appearance={clerkAppearance}
                    signInUrl="/auth/signin?redirect_url=%2Fgo-checkout"
                    forceRedirectUrl="/go-checkout"
                  />
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
