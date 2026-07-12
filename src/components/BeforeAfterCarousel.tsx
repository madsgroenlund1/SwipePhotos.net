'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

const CARDS = [
  { id: 'benni',  name: 'Benni',  age: 29, city: 'Berlin',     beforeCount: 3, beforeExt: 'jpg',  afterExt: 'jpg',  multiplier: '6x'  },
  { id: 'black',  name: 'Marcus', age: 26, city: 'Madrid',     beforeCount: 3, beforeExt: 'jpg',  afterExt: 'jpg',  multiplier: '15x' },
  { id: 'jason',  name: 'Jason',  age: 31, city: 'Vienna',     beforeCount: 3, beforeExt: 'jpg',  afterExt: 'jpg',  multiplier: '10x' },
  { id: 'julius', name: 'Julius', age: 23, city: 'Copenhagen', beforeCount: 3, beforeExt: 'jpeg', afterExt: 'jpg',  multiplier: '20x' },
]

// CSS card width + gap-4 (16px). Must match w-[400px] in BeforeAfterCard.
const CARD_WIDTH = 400
const CARD_GAP   = 16
const CARD_STEP  = CARD_WIDTH + CARD_GAP
const SPEED_PX_S = 80

type CardData = typeof CARDS[0]

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

// ─── MarqueeRow ───────────────────────────────────────────────────────────────
//
// Seamless-loop architecture:
//   The track holds [COPY A][COPY B] where A === B (identical card sequence).
//   For direction="left":  animation runs translateX(0) → translateX(-seqPx)
//   For direction="right": animation runs translateX(-seqPx) → translateX(0)
//   When the animation resets, it jumps from showing the start of B back to
//   showing the start of A — since A === B, the eye sees no discontinuity.
//
// seqPx is the distance from card[0] of copy A to card[0] of copy B, measured
// from the ACTUAL DOM via getBoundingClientRect(). This eliminates sub-pixel
// accumulation errors at any zoom level or devicePixelRatio.
//
// Enough repetitions are added so that the sequence is always ≥ 3× the
// viewport width — covering zoom-out, ultrawide monitors, and browser chrome.

function MarqueeRow({ baseCards, direction }: { baseCards: CardData[]; direction: 'left' | 'right' }) {
  const trackRef  = useRef<HTMLDivElement>(null)  // the animated strip
  const splitRef  = useRef<HTMLDivElement>(null)  // wrapper around copy B's first card
  const repsRef   = useRef(6)                     // never decreases
  const [reps, setReps]                   = useState(6)
  const [seqPx, setSeqPx]                = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Build the repeated sequence — same for both copies.
  const seq = Array.from({ length: reps }, () => baseCards).flat()

  // Measure the exact pixel distance from the start of copy A to the start of
  // copy B. getBoundingClientRect() values are affected equally by the track's
  // CSS transform, so the difference is always the true layout distance.
  const measure = useCallback(() => {
    const track = trackRef.current
    const split = splitRef.current
    if (!track || !split) return
    const px = split.getBoundingClientRect().left - track.getBoundingClientRect().left
    if (px > 0) setSeqPx(px)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    function update() {
      // Ensure the sequence is ≥ 3× the current viewport width.
      const vw     = window.innerWidth
      const baseW  = baseCards.length * CARD_STEP
      const needed = Math.max(4, Math.ceil((vw * 3) / baseW))
      if (needed > repsRef.current) {
        repsRef.current = needed
        setReps(needed)
        // measure() will be called by the [reps] effect after the re-render.
        return
      }
      measure()
    }

    update()

    const ro = new ResizeObserver(update)
    ro.observe(document.documentElement)

    // Re-measure after fonts and images settle — they can shift layout.
    document.fonts.ready.then(update)
    window.addEventListener('load', update, { once: true })

    return () => {
      ro.disconnect()
      window.removeEventListener('load', update)
    }
  }, [reducedMotion, baseCards.length, measure])

  // Re-measure after reps changes (new DOM nodes are present).
  useEffect(() => {
    if (!reducedMotion) measure()
  }, [reps, reducedMotion, measure])

  // Fallback: computed value used before the DOM measurement is ready.
  const fallbackPx = reps * baseCards.length * CARD_STEP
  const animPx     = seqPx > 0 ? seqPx : fallbackPx
  const dur        = animPx / SPEED_PX_S

  if (reducedMotion) {
    return (
      <div className="flex gap-4 overflow-x-auto w-full">
        {baseCards.map((card, i) => <BeforeAfterCard key={i} {...card} />)}
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden">
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: `${CARD_GAP}px`,
          width: 'max-content',
          // Use animationName so the duration inline style is never shadowed
          // by the CSS class shorthand that also sets duration.
          animationName:            direction === 'left' ? 'marquee-left' : 'marquee-right',
          animationDuration:        `${dur}s`,
          animationTimingFunction:  'linear',
          animationIterationCount:  'infinite',
          // --marquee-x is read by the @keyframes in globals.css.
          ['--marquee-x' as string]: `-${animPx}px`,
        }}
      >
        {/* ── Copy A (semantic, visible to screen readers) ── */}
        {seq.map((card, i) => (
          <BeforeAfterCard key={`a${i}`} {...card} />
        ))}

        {/* ── Copy B (hidden from AT; exact duplicate for seamless loop) ── */}
        {seq.map((card, i) => (
          // The wrapper div lets us attach a ref without modifying BeforeAfterCard.
          // flexShrink:0 keeps it the same size as copy A's direct-child cards.
          <div
            key={`b${i}`}
            ref={i === 0 ? splitRef : undefined}
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <BeforeAfterCard {...card} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function BeforeAfterCarousel() {
  // Row 2 is offset by 2 cards so adjacent rows show different people side-by-side.
  const row2base = [...CARDS.slice(2), ...CARDS.slice(0, 2)]

  return (
    <div className="w-full overflow-hidden py-8 space-y-4">
      <MarqueeRow baseCards={CARDS}    direction="left"  />
      <MarqueeRow baseCards={row2base} direction="right" />
    </div>
  )
}
