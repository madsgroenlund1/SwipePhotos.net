'use client'

import Image from 'next/image'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// ─── Card data ────────────────────────────────────────────────────────────────
// Order is deliberately shuffled so no two adjacent slots show the same person
// at the loop seam (julius → benni transition is intentional, not a duplicate).

const CARDS = [
  { id: 'benni',  name: 'Benni',  age: 29, city: 'Berlin',     beforeCount: 3, beforeExt: 'jpg',  afterExt: 'jpg',  multiplier: '6x'  },
  { id: 'jason',  name: 'Jason',  age: 31, city: 'Vienna',     beforeCount: 3, beforeExt: 'jpg',  afterExt: 'jpg',  multiplier: '10x' },
  { id: 'black',  name: 'Marcus', age: 26, city: 'Madrid',     beforeCount: 3, beforeExt: 'jpg',  afterExt: 'jpg',  multiplier: '15x' },
  { id: 'julius', name: 'Julius', age: 23, city: 'Copenhagen', beforeCount: 3, beforeExt: 'jpeg', afterExt: 'jpg',  multiplier: '20x' },
]

// ─── Layout constants ─────────────────────────────────────────────────────────
// These must match the Tailwind classes on BeforeAfterCard (w-[400px]).
// With integer px values, seqPx = N × CARD_STEP exactly — no sub-pixel drift.

const CARD_WIDTH = 400
const CARD_GAP   = 16
const CARD_STEP  = CARD_WIDTH + CARD_GAP   // 416 px
const SPEED_PX_S = 80

type CardData = typeof CARDS[0]

// ─── BeforeAfterCard ──────────────────────────────────────────────────────────

function BeforeAfterCard({ id, name, age, city, beforeCount, beforeExt, afterExt, multiplier }: CardData) {
  const beforeNums = Array.from({ length: Math.min(beforeCount, 3) }, (_, i) => i + 1)

  return (
    <div className="flex-shrink-0 w-[400px] bg-[#111] border border-white/8 rounded-2xl p-4 flex gap-3">
      <div className="flex flex-col gap-2 w-[110px]">
        <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1">Before</div>
        {beforeNums.map((n) => (
          <div key={n} className="w-full aspect-[3/4] rounded-lg overflow-hidden relative bg-zinc-900">
            <Image
              src={`/photos/before-after/${id}/before/${n}.${beforeExt}`}
              alt={`${name} before ${n}`}
              fill
              className="object-cover"
              sizes="110px"
            />
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="text-[10px] text-blue-400 font-medium uppercase tracking-wider mb-1">After ✨</div>
        <div className="flex-1 rounded-xl overflow-hidden relative bg-zinc-900" style={{ minHeight: '200px' }}>
          <Image
            src={`/photos/before-after/${id}/after/1.${afterExt}`}
            alt={`${name} after`}
            fill
            className="object-cover"
            sizes="260px"
          />
          <div className="absolute inset-0 flex flex-col justify-between p-3">
            <div className="self-end bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              +{multiplier} matches
            </div>
            <div>
              <div className="text-white font-semibold text-sm drop-shadow-lg">{name}, {age}</div>
              <div className="text-blue-300 text-xs drop-shadow">📍 {city}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Infinite marquee ─────────────────────────────────────────────────────────
//
// Architecture: [COPY A][COPY B]  (A === B, identical)
//
//   The track animates translateX(0) → translateX(-seqPx).
//   seqPx = the pixel width of COPY A (including the trailing gap before B).
//
//   At 100 % progress Copy B[0] sits at screen-left.
//   The animation resets instantly to 0 % → Copy A[0] sits at screen-left.
//   Since A === B the eye sees nothing.
//
// seqPx is computed, not measured — card widths are exact integers:
//   seqPx = N × CARD_STEP  (N = seq.length = reps × CARDS.length)
//
// Proof (flex gap 16 px, N cards in Copy A):
//   N cards × 400 px + N gaps × 16 px = N × 416 px = N × CARD_STEP  ✓
//   (The gap AFTER the last A card and BEFORE the first B card is included.)
//
// repsRef never decreases — once expanded for a wide viewport the DOM stays
// large so zooming back in never creates a seam.

function computeReps(vw: number): number {
  const baseW = CARDS.length * CARD_STEP          // width of one 4-card pass
  return Math.max(2, Math.ceil((vw * 2.5) / baseW))
}

function MarqueeRow() {
  const repsRef = useRef(4)                        // start large → no jump on most viewports
  const [reps, setReps]                   = useState(4)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Correct reps before the first browser paint so the animation starts with
  // the right seqPx. useLayoutEffect is client-only; during SSR it is a no-op.
  useLayoutEffect(() => {
    const needed = computeReps(window.innerWidth)
    if (needed > repsRef.current) {
      repsRef.current = needed
      setReps(needed)
    }
  }, [])

  // Prefers-reduced-motion.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  // Increase reps when viewport grows (ultrawide, zoom-out, window resize).
  useEffect(() => {
    if (reducedMotion) return
    const ro = new ResizeObserver(() => {
      const needed = computeReps(window.innerWidth)
      if (needed > repsRef.current) {
        repsRef.current = needed
        setReps(needed)
      }
    })
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [reducedMotion])

  // seq = all CARDS repeated `reps` times (each unique card appears once per
  // 4-card cycle; no two identical cards are ever adjacent).
  const seq   = Array.from({ length: reps }, () => CARDS).flat()
  const seqPx = seq.length * CARD_STEP             // exact, integer math
  const dur   = seqPx / SPEED_PX_S

  if (reducedMotion) {
    return (
      <div className="flex gap-4 overflow-x-auto w-full py-2">
        {CARDS.map((card, i) => <BeforeAfterCard key={i} {...card} />)}
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden">
      <div
        style={{
          display:                'flex',
          flexWrap:               'nowrap',
          gap:                    `${CARD_GAP}px`,
          width:                  'max-content',
          // Inline animationName keeps animationDuration from being overridden
          // by the CSS class shorthand (which also sets duration).
          animationName:          'marquee-left',
          animationDuration:      `${dur}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          ['--marquee-x' as string]: `-${seqPx}px`,
        }}
      >
        {/* ── Copy A — visible to assistive technology ── */}
        {seq.map((card, i) => (
          <BeforeAfterCard key={`a${i}`} {...card} />
        ))}

        {/* ── Copy B — identical duplicate; hidden from screen readers ── */}
        {seq.map((card, i) => (
          <div key={`b${i}`} aria-hidden="true" style={{ flexShrink: 0 }}>
            <BeforeAfterCard {...card} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Public export ────────────────────────────────────────────────────────────

export function BeforeAfterCarousel() {
  return (
    <div className="w-full overflow-hidden py-8">
      <MarqueeRow />
    </div>
  )
}
