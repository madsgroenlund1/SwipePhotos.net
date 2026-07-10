'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

// ── Target speed ──────────────────────────────────────────────────────────────
//
// All tracks animate at the same visual speed (px/s).
// Duration is computed on mount from each track's actual scrollWidth, so rows
// with different amounts of content still feel equally fast.
//
// Formula: track contains [base, base] → scrollWidth = 2 × baseWidth.
//          translateX(-50%) moves the track by baseWidth pixels.
//          duration = baseWidth / PX_PER_SEC = scrollWidth / 2 / PX_PER_SEC
//
const PX_PER_SEC = 60         // target visual speed for all rows
const PX_PER_SEC_MOBILE = 45  // slightly slower on mobile to ease GPU load

// ── Data ──────────────────────────────────────────────────────────────────────

// Row 1: Girls messaging first — DMs where girls reached out
const GIRL_HINGE = ['19.png', '27.png', '29.png', '31.png']
const COACH_NUMS = [1, 2, 4, 6, 7, 9, 10, 11]

// Row 2: More Matches, Instantly
// Previously only 2 landscape + 4 portrait → ~1540px → 17 px/s (way too slow).
// Added 2 landscape + 6 portrait from unused hinge-proof assets.
const MATCH_LANDSCAPE = ['25.png', '30.png', '20.png', '22.png']
const MATCH_PORTRAIT = [
  'SaveClip.App_683606128_18057773888511924_2683062959033343579_n.jpg',
  'SaveClip.App_717235006_18063817274511924_2352340353049146210_n.jpg',
  'SaveClip.App_707866872_18062536424511924_4639417724254262759_n.jpg',
  'SaveClip.App_717235171_18063817295511924_3814570059601791850_n.jpg',
  'SaveClip.App_710979003_18062536379511924_1255798379216902517_n.jpg',
  'SaveClip.App_717265001_18063120077511924_3091966479769834591_n.jpg',
  'SaveClip.App_712904452_18062831375511924_6285178280750042753_n.jpg',
  'SaveClip.App_717612342_18063817247511924_7111459865590874090_n.jpg',
  'SaveClip.App_718510729_18063401510511924_1637919744185736804_n.jpg',
  'SaveClip.App_718906918_18063708218511924_5132149619542184317_n.jpg',
]

// Row 3: Social proof — landscape screenshots + portrait clips + videos
const PROOF_LANDSCAPE = ['23.png', '21.png', '28.png', '32.png', '33.png']
const PROOF_PORTRAIT = [
  'SaveClip.App_713443460_18062698499511924_7652687373312959975_n.jpg',
  'SaveClip.App_718992768_18064092953511924_3367177254398508992_n.jpg',
  'SaveClip.App_716010437_18062973332511924_6108834314921062937_n.jpg',
  'SaveClip.App_720919660_18064379108511924_8001579692469733185_n.jpg',
  'SaveClip.App_717186277_18063541640511924_1689200368543379394_n.jpg',
  'SaveClip.App_721387155_18064243115511924_5533925465350606072_n.jpg',
]
const HINGE_VIDEOS = [
  'SaveClip.App_AQMfB9uhnW1Ia7pi714bJhkVT1hPnqBMmiy5cc-fRLv3wyVy5GscvJMW2bRGgQlynGUqajPqpopLICe4KDghN0Sj-f-5AR29ttZVTyo.mp4',
  'SaveClip.App_AQN67Gcd76phYs5oLRCqw7lr72HSEoPWOt4YatHq4p5jG-51Paw-XXj8X2D9btokSZRyF6JZ_pQKFeAxGRpasuBhIrwoFXHOprG7_GU.mp4',
  'SaveClip.App_AQO2KcXN0qVrLoTDbM5IGtQEwj4yXWu8ddHmC-qCutbs05JSv_wxDzU4k4NvYyIz-jV58xqyrdWYVt9l14gUcPOxBNBISkrC_CT2oe4.mp4',
  'SaveClip.App_AQOUz5mYExK8MjEJyA8KgtKeYk9XPODtlbpfhM-5B_m4TZrITYHPYECiFt181c5QSgpgX4tgiAaL8sD8lyOeoTE-6awRS2ROaBINrW4.mp4',
  'SaveClip.App_AQPnyIv4FTufTyd3-HbPvEJMygY15ec-UuFCk7YembUhys_lh0oZS2aqt3qWWQvhaZQ1zXq10FHnUxe1sdP_m9ovOcb9cPLar-KkZkk.mp4',
]

// ── Dimensions ────────────────────────────────────────────────────────────────
const ROW_H = 300          // px — uniform for all three rows
const LANDSCAPE_W = 400    // px — 4:3 (1365×1024) landscape screenshots
const PORTRAIT_W = 170     // px — 9:16 portrait photos & videos
const GAP = 12             // px — gap-3

// ── Card components ───────────────────────────────────────────────────────────

function LandscapeCard({ src, base }: { src: string; base: 'hinge-proof' | 'testimonials-coach-coner' }) {
  return (
    <div
      className="flex-shrink-0 rounded-xl overflow-hidden bg-[#111] border border-white/8 flex items-center justify-center p-2"
      style={{ width: LANDSCAPE_W, height: ROW_H }}
    >
      <div className="relative w-full h-full">
        <Image src={`/${base}/${src}`} alt="Proof" fill className="object-contain" unoptimized />
      </div>
    </div>
  )
}

function PortraitCard({ file }: { file: string }) {
  return (
    <div
      className="flex-shrink-0 rounded-xl overflow-hidden bg-[#111] border border-white/8 flex items-center justify-center p-2"
      style={{ width: PORTRAIT_W, height: ROW_H }}
    >
      <div className="relative w-full h-full">
        <Image src={`/hinge-proof/${file}`} alt="Proof" fill className="object-contain" unoptimized />
      </div>
    </div>
  )
}

function VideoCard({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.3 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="flex-shrink-0 rounded-xl overflow-hidden bg-[#0a0a0a] border border-white/8 flex items-center justify-center p-1.5"
      style={{ width: PORTRAIT_W, height: ROW_H }}
    >
      <video
        ref={videoRef}
        src={`/hinge-proof/${src}`}
        muted
        loop
        playsInline
        className="w-full h-full object-contain rounded-lg"
      />
    </div>
  )
}

function RowHeading({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="px-6 mb-4">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-lg leading-none">{emoji}</span>
        <h3 className="text-white font-semibold text-base leading-none">{title}</h3>
      </div>
      <p className="text-zinc-500 text-xs pl-7">{subtitle}</p>
    </div>
  )
}

// ── Speed-equalised marquee track ─────────────────────────────────────────────
//
// Renders [items, ...items] so translateX(-50%) loops seamlessly.
// Measures its own scrollWidth after mount and on resize, then sets
// animationDuration so all tracks share the same px/s target speed.

type TrackProps = {
  direction: 'left' | 'right'
  children: React.ReactNode
  reducedMotion: boolean
}

function MarqueeTrack({ direction, children, reducedMotion }: TrackProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState<number | null>(null)

  useEffect(() => {
    if (reducedMotion) return

    const isMobile = window.innerWidth < 768
    const speed = isMobile ? PX_PER_SEC_MOBILE : PX_PER_SEC

    function compute() {
      const el = trackRef.current
      if (!el) return
      // Track contains [base, base]. scrollWidth = 2×baseWidth.
      // translateX(-50%) moves by baseWidth pixels → duration = baseWidth / speed
      const baseWidth = el.scrollWidth / 2
      setDuration(Math.max(5, baseWidth / speed))
    }

    compute()
    const ro = new ResizeObserver(compute)
    if (trackRef.current) ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [reducedMotion])

  const animClass = direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'

  return (
    <div
      ref={trackRef}
      className={reducedMotion ? 'flex gap-3' : `flex gap-3 ${animClass}`}
      style={{
        width: 'max-content',
        height: ROW_H,
        // Override the CSS class duration with the computed value
        ...(duration !== null && !reducedMotion ? { animationDuration: `${duration}s` } : {}),
      }}
    >
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TestimonialsScroll() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Build arrays — each row has [base, base] for seamless looping
  const row1Base = [
    ...GIRL_HINGE.map(f => ({ kind: 'landscape-hinge' as const, file: f })),
    ...COACH_NUMS.map(n => ({ kind: 'landscape-coach' as const, file: `${n}.png` })),
  ]
  const row1Items = [...row1Base, ...row1Base]

  const row2Base = [
    ...MATCH_LANDSCAPE.map(f => ({ kind: 'landscape-hinge' as const, file: f })),
    ...MATCH_PORTRAIT.map(f => ({ kind: 'portrait' as const, file: f })),
  ]
  // Interleave so portrait cards are spread evenly, not clumped at the end
  const row2Interleaved = interleave(
    MATCH_LANDSCAPE.map(f => ({ kind: 'landscape-hinge' as const, file: f })),
    MATCH_PORTRAIT.map(f => ({ kind: 'portrait' as const, file: f })),
  )
  const row2Items = [...row2Interleaved, ...row2Interleaved]
  void row2Base // used for type inference above

  const row3Base = [
    ...PROOF_LANDSCAPE.map(f => ({ kind: 'landscape-hinge' as const, file: f })),
    ...PROOF_PORTRAIT.map(f => ({ kind: 'portrait' as const, file: f })),
    ...HINGE_VIDEOS.map(s => ({ kind: 'video' as const, file: s })),
  ]
  // Interleave landscape, portrait, video so types alternate throughout
  const row3Interleaved = interleave3(
    PROOF_LANDSCAPE.map(f => ({ kind: 'landscape-hinge' as const, file: f })),
    PROOF_PORTRAIT.map(f => ({ kind: 'portrait' as const, file: f })),
    HINGE_VIDEOS.map(s => ({ kind: 'video' as const, file: s })),
  )
  const row3Items = [...row3Interleaved, ...row3Interleaved]
  void row3Base

  // Estimated base widths for reduced-motion overflow-x:auto fallback
  const row2EstW =
    MATCH_LANDSCAPE.length * (LANDSCAPE_W + GAP) +
    MATCH_PORTRAIT.length * (PORTRAIT_W + GAP)

  return (
    <div className="w-full overflow-hidden space-y-8">

      {/* ── Row 1: Girls messaging first ── */}
      <div>
        <RowHeading
          emoji="💬"
          title="Girls Messaging First"
          subtitle="Real DMs — they reached out before he did"
        />
        <MarqueeTrack direction="left" reducedMotion={reducedMotion}>
          {row1Items.map((item, i) =>
            item.kind === 'landscape-coach'
              ? <LandscapeCard key={`r1-${i}`} src={item.file} base="testimonials-coach-coner" />
              : <LandscapeCard key={`r1-${i}`} src={item.file} base="hinge-proof" />
          )}
        </MarqueeTrack>
      </div>

      {/* ── Row 2: More Matches, Instantly ── */}
      <div>
        <RowHeading
          emoji="📈"
          title="More Matches, Instantly"
          subtitle="Match counts exploding within days of uploading AI photos"
        />
        {reducedMotion ? (
          // Reduced motion: show a static scrollable strip
          <div
            className="flex gap-3 overflow-x-auto scrollbar-hide"
            style={{ height: ROW_H, width: '100%', minWidth: row2EstW }}
          >
            {row2Interleaved.map((item, i) =>
              item.kind === 'portrait'
                ? <PortraitCard key={`r2-${i}`} file={item.file} />
                : <LandscapeCard key={`r2-${i}`} src={item.file} base="hinge-proof" />
            )}
          </div>
        ) : (
          <MarqueeTrack direction="right" reducedMotion={false}>
            {row2Items.map((item, i) =>
              item.kind === 'portrait'
                ? <PortraitCard key={`r2-${i}`} file={item.file} />
                : <LandscapeCard key={`r2-${i}`} src={item.file} base="hinge-proof" />
            )}
          </MarqueeTrack>
        )}
      </div>

      {/* ── Row 3: Results Speak for Themselves ── */}
      <div>
        <RowHeading
          emoji="🔥"
          title="Results Speak for Themselves"
          subtitle="Screenshots, clips and reactions from real users"
        />
        <MarqueeTrack direction="left" reducedMotion={reducedMotion}>
          {row3Items.map((item, i) =>
            item.kind === 'video'
              ? <VideoCard key={`r3-${i}`} src={item.file} />
              : item.kind === 'portrait'
              ? <PortraitCard key={`r3-${i}`} file={item.file} />
              : <LandscapeCard key={`r3-${i}`} src={item.file} base="hinge-proof" />
          )}
        </MarqueeTrack>
      </div>

    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Interleave two arrays so types alternate as evenly as possible
function interleave<A, B>(as: A[], bs: B[]): (A | B)[] {
  const result: (A | B)[] = []
  const aLen = as.length
  const bLen = bs.length
  const total = aLen + bLen
  let ai = 0
  let bi = 0
  for (let i = 0; i < total; i++) {
    // Choose A or B to maintain proportional spread
    const aWeight = ai < aLen ? (aLen - ai) / (total - i) : 0
    const bWeight = bi < bLen ? (bLen - bi) / (total - i) : 0
    if (aWeight >= bWeight && ai < aLen) {
      result.push(as[ai++])
    } else if (bi < bLen) {
      result.push(bs[bi++])
    } else {
      result.push(as[ai++])
    }
  }
  return result
}

// Interleave three arrays, cycling through in order
function interleave3<A, B, C>(as: A[], bs: B[], cs: C[]): (A | B | C)[] {
  const result: (A | B | C)[] = []
  const max = Math.max(as.length, bs.length, cs.length)
  for (let i = 0; i < max; i++) {
    if (i < as.length) result.push(as[i])
    if (i < bs.length) result.push(bs[i])
    if (i < cs.length) result.push(cs[i])
  }
  return result
}
