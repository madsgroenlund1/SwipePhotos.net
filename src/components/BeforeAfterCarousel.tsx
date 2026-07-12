'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const CARDS = [
  { id: 'benni',  name: 'Benni',  age: 29, city: 'Berlin',     beforeCount: 3, beforeExt: 'jpg',  afterExt: 'jpg',  multiplier: '6x'  },
  { id: 'black',  name: 'Marcus', age: 26, city: 'Madrid',     beforeCount: 3, beforeExt: 'jpg',  afterExt: 'jpg',  multiplier: '15x' },
  { id: 'jason',  name: 'Jason',  age: 31, city: 'Vienna',     beforeCount: 3, beforeExt: 'jpg',  afterExt: 'jpg',  multiplier: '10x' },
  { id: 'julius', name: 'Julius', age: 23, city: 'Copenhagen', beforeCount: 3, beforeExt: 'jpeg', afterExt: 'jpg',  multiplier: '20x' },
]

// Must match the CSS: card width (w-[400px]) + gap-4 (16px)
const CARD_STEP = 416
// Target scroll speed in px / second (both rows share the same speed)
const SPEED_PX_S = 80

type CardData = typeof CARDS[0]

function BeforeAfterCard({ id, name, age, city, beforeCount, beforeExt, afterExt, multiplier }: CardData) {
  const beforeNums = Array.from({ length: Math.min(beforeCount, 3) }, (_, i) => i + 1)

  return (
    <div className="flex-shrink-0 w-[400px] bg-[#111] border border-white/8 rounded-2xl p-4 flex gap-3">
      {/* Before photos */}
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

      {/* After photo */}
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

// ─── Marquee row ──────────────────────────────────────────────────────────────
//
// How the seamless loop works:
//   The CSS animation moves the track from translateX(0) → translateX(-50%).
//   This means the visible window always sits inside the FIRST half of the track.
//   The second half is an exact copy, so the moment the animation resets to 0
//   the eye sees no jump — the last frame of the animation looks identical to
//   the first frame of the next cycle.
//
// The gap bug:
//   If the viewport is wider than the first half of the track, the user can
//   see "off the edge" of the track — the black background behind it.
//
// The fix:
//   We measure the viewport width and repeat the base card sequence enough
//   times so that the first half (= base × reps) is at least 3× the viewport.
//   A ResizeObserver ensures this holds at any window size or zoom level.
//   repsRef never decreases, so resizing to narrower doesn't shrink the track
//   mid-animation (which would cause a visible jump).

function MarqueeRow({ baseCards, direction }: { baseCards: CardData[]; direction: 'left' | 'right' }) {
  const repsRef = useRef(6)
  const [reps, setReps] = useState(6)
  // Pre-compute dur from default reps so the animation never restarts on first mount.
  const [dur, setDur] = useState(() => repsRef.current * baseCards.length * CARD_STEP / SPEED_PX_S)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  useEffect(() => {
    const baseW = baseCards.length * CARD_STEP

    function update() {
      const vw = window.innerWidth
      // Half-track must be > vw. We use 3× for headroom (zoom-out, sub-pixel
      // rounding, browser chrome, partial visibility at animation boundary).
      const needed = Math.max(4, Math.ceil((vw * 3) / baseW))

      // Only ever increase reps — never shrink the track mid-animation.
      if (needed > repsRef.current) {
        repsRef.current = needed
        setReps(needed)
      }

      // Duration = half-track / speed. Uses the current (possibly just-bumped)
      // reps value so speed stays consistent.
      const halfTrack = baseW * repsRef.current
      setDur(halfTrack / SPEED_PX_S)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build [base × reps] then duplicate it → two identical halves.
  // translateX(-50%) scrolls through the first half; the second is the seamless copy.
  const half  = Array.from({ length: reps }, () => baseCards).flat()

  // Exact pixel translation = N cards × CARD_STEP.
  // Using an absolute value avoids sub-pixel rounding errors from translateX(-50%).
  const halfTrack = half.length * CARD_STEP

  return (
    <div
      className={reducedMotion ? 'flex gap-4 overflow-x-auto' : `flex gap-4 ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`}
      style={reducedMotion ? { width: '100%' } : {
        width: 'max-content',
        animationDuration: `${dur}s`,
        ['--marquee-x' as string]: `-${halfTrack}px`,
      }}
      aria-hidden={direction === 'right' ? 'true' : undefined}
    >
      {/* Semantic first half — the only copy screen readers see */}
      {half.map((card, i) => (
        <BeforeAfterCard key={`${direction}-a-${i}`} {...card} />
      ))}
      {/* Duplicate second half for seamless loop — hidden from assistive tech */}
      {!reducedMotion && (
        <span aria-hidden="true" style={{ display: 'contents' }}>
          {half.map((card, i) => (
            <BeforeAfterCard key={`${direction}-b-${i}`} {...card} />
          ))}
        </span>
      )}
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function BeforeAfterCarousel() {
  // Row 2 starts at a different offset so the two rows show visually distinct
  // cards side-by-side, making the mosaic feel richer.
  const row2base = [...CARDS.slice(2), ...CARDS.slice(0, 2)]

  return (
    <div className="w-full overflow-hidden py-8 space-y-4">
      <MarqueeRow baseCards={CARDS}     direction="left"  />
      <MarqueeRow baseCards={row2base}  direction="right" />
    </div>
  )
}
