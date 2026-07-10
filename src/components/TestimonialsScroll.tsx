'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

// ── Data ──────────────────────────────────────────────────────────────────────

// Row 1: Girls messaging first — DMs where girls reached out
const GIRL_HINGE = ['19.png', '27.png', '29.png', '31.png']
// Coach proof screenshots (same 4:3 format)
const COACH_NUMS = [1, 2, 4, 6, 7, 9, 10, 11]

// Row 2: Match explosion — mix of portrait phone pics + landscape screenshots
const MATCH_LANDSCAPE = ['25.png', '30.png']
const MATCH_PORTRAIT = [
  'SaveClip.App_683606128_18057773888511924_2683062959033343579_n.jpg',
  'SaveClip.App_707866872_18062536424511924_4639417724254262759_n.jpg',
  'SaveClip.App_710979003_18062536379511924_1255798379216902517_n.jpg',
  'SaveClip.App_712904452_18062831375511924_6285178280750042753_n.jpg',
]

// Row 3: Social proof — landscape screenshots + portrait social media clips + videos
const PROOF_LANDSCAPE = ['23.png', '21.png', '28.png', '32.png', '33.png']
const PROOF_PORTRAIT = [
  'SaveClip.App_713443460_18062698499511924_7652687373312959975_n.jpg',
  'SaveClip.App_716010437_18062973332511924_6108834314921062937_n.jpg',
  'SaveClip.App_717186277_18063541640511924_1689200368543379394_n.jpg',
]
const HINGE_VIDEOS = [
  'SaveClip.App_AQMfB9uhnW1Ia7pi714bJhkVT1hPnqBMmiy5cc-fRLv3wyVy5GscvJMW2bRGgQlynGUqajPqpopLICe4KDghN0Sj-f-5AR29ttZVTyo.mp4',
  'SaveClip.App_AQN67Gcd76phYs5oLRCqw7lr72HSEoPWOt4YatHq4p5jG-51Paw-XXj8X2D9btokSZRyF6JZ_pQKFeAxGRpasuBhIrwoFXHOprG7_GU.mp4',
  'SaveClip.App_AQO2KcXN0qVrLoTDbM5IGtQEwj4yXWu8ddHmC-qCutbs05JSv_wxDzU4k4NvYyIz-jV58xqyrdWYVt9l14gUcPOxBNBISkrC_CT2oe4.mp4',
  'SaveClip.App_AQOUz5mYExK8MjEJyA8KgtKeYk9XPODtlbpfhM-5B_m4TZrITYHPYECiFt181c5QSgpgX4tgiAaL8sD8lyOeoTE-6awRS2ROaBINrW4.mp4',
  'SaveClip.App_AQPnyIv4FTufTyd3-HbPvEJMygY15ec-UuFCk7YembUhys_lh0oZS2aqt3qWWQvhaZQ1zXq10FHnUxe1sdP_m9ovOcb9cPLar-KkZkk.mp4',
]

// ── Dimensions ────────────────────────────────────────────────────────────────
//
// All *.png screenshots are 1365×1024 (4:3 landscape, ratio 1.334).
// All SaveClip *.jpg are 608×1080 (portrait, ratio 0.563).
// Videos are 9:16 portrait (ratio 0.5625).
//
// Uniform row height: 300px.
// Landscape card width:  300 × (1365/1024) ≈ 400px
// Portrait card width:   300 × (608/1080)  ≈ 170px
// Video card width:      300 × (9/16)      ≈ 169px  (use 170px)
//
const ROW_H = 300          // px — same for all three rows
const LANDSCAPE_W = 400    // px — 4:3 landscape screenshots
const PORTRAIT_W = 170     // px — 9:16 portrait photos & videos

// ── Card components ───────────────────────────────────────────────────────────

// 4:3 landscape screenshot (hinge-proof/*.png, testimonials-coach-coner/*.png)
function LandscapeCard({ src, base }: { src: string; base: 'hinge-proof' | 'testimonials-coach-coner' }) {
  return (
    <div
      className="flex-shrink-0 rounded-xl overflow-hidden bg-[#111] border border-white/8 flex items-center justify-center p-2"
      style={{ width: LANDSCAPE_W, height: ROW_H }}
    >
      <div className="relative w-full h-full">
        <Image
          src={`/${base}/${src}`}
          alt="Proof"
          fill
          className="object-contain"
          unoptimized
        />
      </div>
    </div>
  )
}

// 9:16 portrait photo (SaveClip *.jpg)
function PortraitCard({ file }: { file: string }) {
  return (
    <div
      className="flex-shrink-0 rounded-xl overflow-hidden bg-[#111] border border-white/8 flex items-center justify-center p-2"
      style={{ width: PORTRAIT_W, height: ROW_H }}
    >
      <div className="relative w-full h-full">
        <Image
          src={`/hinge-proof/${file}`}
          alt="Proof"
          fill
          className="object-contain"
          unoptimized
        />
      </div>
    </div>
  )
}

// 9:16 portrait video
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

// Row heading
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

// ── Main component ────────────────────────────────────────────────────────────

export function TestimonialsScroll() {
  // Row 1 items — girls messaging first + coach screenshots
  const row1Base = [
    ...GIRL_HINGE.map(f => ({ kind: 'landscape-hinge' as const, file: f })),
    ...COACH_NUMS.map(n => ({ kind: 'landscape-coach' as const, file: `${n}.png` })),
  ]
  const row1 = [...row1Base, ...row1Base]

  // Row 2 items — landscape match screenshots + portrait match photos
  const row2Base = [
    ...MATCH_LANDSCAPE.map(f => ({ kind: 'landscape-hinge' as const, file: f })),
    ...MATCH_PORTRAIT.map(f => ({ kind: 'portrait' as const, file: f })),
  ]
  const row2 = [...row2Base, ...row2Base]

  // Row 3 items — landscape proof screenshots + portrait social clips + videos
  const row3Base = [
    ...PROOF_LANDSCAPE.map(f => ({ kind: 'landscape-hinge' as const, file: f })),
    ...PROOF_PORTRAIT.map(f => ({ kind: 'portrait' as const, file: f })),
    ...HINGE_VIDEOS.map(s => ({ kind: 'video' as const, file: s })),
  ]
  const row3 = [...row3Base, ...row3Base]

  return (
    <div className="w-full overflow-hidden" style={{ gap: 0 }}>

      {/* ── Row 1: Girls messaging first ── */}
      <div className="mb-8">
        <RowHeading
          emoji="💬"
          title="Girls Messaging First"
          subtitle="Real DMs — they reached out before he did"
        />
        <div
          className="flex gap-3 animate-marquee-left"
          style={{ width: 'max-content', height: ROW_H }}
        >
          {row1.map((item, i) =>
            item.kind === 'landscape-coach'
              ? <LandscapeCard key={`r1-${i}`} src={item.file} base="testimonials-coach-coner" />
              : <LandscapeCard key={`r1-${i}`} src={item.file} base="hinge-proof" />
          )}
        </div>
      </div>

      {/* ── Row 2: More Matches, Instantly ── */}
      <div className="mb-8">
        <RowHeading
          emoji="📈"
          title="More Matches, Instantly"
          subtitle="Match counts exploding within days of uploading AI photos"
        />
        <div
          className="flex gap-3 animate-marquee-right"
          style={{ width: 'max-content', height: ROW_H }}
        >
          {row2.map((item, i) =>
            item.kind === 'portrait'
              ? <PortraitCard key={`r2-${i}`} file={item.file} />
              : <LandscapeCard key={`r2-${i}`} src={item.file} base="hinge-proof" />
          )}
        </div>
      </div>

      {/* ── Row 3: Results Speak for Themselves ── */}
      <div>
        <RowHeading
          emoji="🔥"
          title="Results Speak for Themselves"
          subtitle="Screenshots, clips and reactions from real users"
        />
        <div
          className="flex gap-3 animate-marquee-left-slow"
          style={{ width: 'max-content', height: ROW_H }}
        >
          {row3.map((item, i) =>
            item.kind === 'video'
              ? <VideoCard key={`r3-${i}`} src={item.file} />
              : item.kind === 'portrait'
              ? <PortraitCard key={`r3-${i}`} file={item.file} />
              : <LandscapeCard key={`r3-${i}`} src={item.file} base="hinge-proof" />
          )}
        </div>
      </div>

    </div>
  )
}
