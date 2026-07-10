'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

// ── Row 1: Girls messaging first ──────────────────────────────────────────
// Hinge match cards where girls sent first message / rose
const GIRL_HINGE = [
  { file: '19.png', label: 'break hearts / gorge' },
  { file: '27.png', label: 'I love you' },
  { file: '29.png', label: 'Can I have your insta' },
  { file: '31.png', label: 'Sent you a rose' },
]
const COACH_SCREENSHOTS = [1, 2, 4, 6, 7, 9, 10, 11]

// ── Row 2: Match explosion numbers ────────────────────────────────────────
const MATCH_HINGE = [
  { file: '25.png', label: '96 notifications' },
  { file: '30.png', label: 'roses keep coming' },
  { file: 'SaveClip.App_683606128_18057773888511924_2683062959033343579_n.jpg', label: '7 in gym' },
  { file: 'SaveClip.App_707866872_18062536424511924_4639417724254262759_n.jpg', label: 'match flood' },
  { file: 'SaveClip.App_710979003_18062536379511924_1255798379216902517_n.jpg', label: 'match flood 2' },
  { file: 'SaveClip.App_712904452_18062831375511924_6285178280750042753_n.jpg', label: 'match flood 3' },
]

// ── Row 3: Reviews + videos ───────────────────────────────────────────────
const REVIEW_HINGE = [
  { file: '23.png', label: 'match profiles' },
  { file: '21.png', label: 'more matches' },
  { file: '28.png', label: 'roses sent' },
  { file: '32.png', label: 'more proof' },
  { file: '33.png', label: 'more proof 2' },
  { file: 'SaveClip.App_713443460_18062698499511924_7652687373312959975_n.jpg', label: 'proof' },
  { file: 'SaveClip.App_716010437_18062973332511924_6108834314921062937_n.jpg', label: 'proof 2' },
  { file: 'SaveClip.App_717186277_18063541640511924_1689200368543379394_n.jpg', label: 'proof 3' },
]

const YOUTUBE_VIDEOS = [
  { file: 'He-Got-100-Matches-Using-AI-Photos.jpg', title: 'He Got 100 Matches Using AI Photos', views: '243K views' },
  { file: 'How-To-Create-Epic-AI-Photos.jpg', title: 'How To Create Epic AI Photos', views: '118K views' },
  { file: 'The-4-AI-photos-that-got-me-10x-more-Tinder-matches.jpg', title: 'The 4 AI Photos That Got Me 10x More Tinder Matches', views: '391K views' },
]

// Hinge-proof mp4 filenames
const HINGE_VIDEOS = [
  'SaveClip.App_AQMfB9uhnW1Ia7pi714bJhkVT1hPnqBMmiy5cc-fRLv3wyVy5GscvJMW2bRGgQlynGUqajPqpopLICe4KDghN0Sj-f-5AR29ttZVTyo.mp4',
  'SaveClip.App_AQN67Gcd76phYs5oLRCqw7lr72HSEoPWOt4YatHq4p5jG-51Paw-XXj8X2D9btokSZRyF6JZ_pQKFeAxGRpasuBhIrwoFXHOprG7_GU.mp4',
  'SaveClip.App_AQO2KcXN0qVrLoTDbM5IGtQEwj4yXWu8ddHmC-qCutbs05JSv_wxDzU4k4NvYyIz-jV58xqyrdWYVt9l14gUcPOxBNBISkrC_CT2oe4.mp4',
  'SaveClip.App_AQOUz5mYExK8MjEJyA8KgtKeYk9XPODtlbpfhM-5B_m4TZrITYHPYECiFt181c5QSgpgX4tgiAaL8sD8lyOeoTE-6awRS2ROaBINrW4.mp4',
  'SaveClip.App_AQPnyIv4FTufTyd3-HbPvEJMygY15ec-UuFCk7YembUhys_lh0oZS2aqt3qWWQvhaZQ1zXq10FHnUxe1sdP_m9ovOcb9cPLar-KkZkk.mp4',
]

// ── Card components ───────────────────────────────────────────────────────

function HingeCard({ file, objectPosition = 'object-center' }: { file: string; objectPosition?: string }) {
  return (
    <div className="flex-shrink-0 w-[360px] h-[280px] rounded-xl overflow-hidden bg-[#0A0A0A] relative border border-white/8">
      <Image
        src={`/hinge-proof/${file}`}
        alt="Hinge proof"
        fill
        className={`object-cover ${objectPosition}`}
        unoptimized
      />
    </div>
  )
}

function CoachCard({ n }: { n: number }) {
  // Card 2 has white borders around the subject — zoom in hard to fill the frame
  const zoom = n === 2 ? { transform: 'scale(2.2)', transformOrigin: 'center 30%' } : undefined
  return (
    <div className="flex-shrink-0 w-[280px] h-[280px] rounded-xl overflow-hidden bg-[#111] border border-white/8 relative">
      <Image
        src={`/testimonials-coach-coner/${n}.png`}
        alt={`Coach result ${n}`}
        fill
        className="object-cover object-top"
        style={zoom}
        unoptimized
      />
    </div>
  )
}

function DiscordCard({ n }: { n: number }) {
  return (
    <div className="flex-shrink-0 w-[300px] h-[280px] rounded-xl overflow-hidden bg-[#1E1F22] border border-white/6 relative">
      <Image
        src={`/testimonials-discord-screenshots/${n}.webp`}
        alt={`Testimonial ${n}`}
        fill
        className="object-cover object-center"
        unoptimized
      />
    </div>
  )
}

function ResultCard({ before, after, name, stat }: { before: string; after: string; name: string; stat: string }) {
  return (
    <div className="flex-shrink-0 w-[280px] h-[280px] bg-[#111] rounded-xl overflow-hidden border border-white/8 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1 overflow-hidden">
          <Image src={before} alt="Before" fill className="object-cover object-top" sizes="140px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <span className="absolute bottom-2 left-2 text-red-400 text-[10px] font-bold uppercase tracking-wide">✗ Before</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <Image src={after} alt="After" fill className="object-cover object-top" sizes="140px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <span className="absolute bottom-2 left-2 text-green-400 text-[10px] font-bold uppercase tracking-wide">✓ After</span>
        </div>
      </div>
      <div className="px-3 py-2 shrink-0">
        <p className="text-white text-sm font-semibold">{name}</p>
        <p className="text-green-400 text-xs mt-0.5 font-medium">{stat}</p>
      </div>
    </div>
  )
}

function YoutubeCard({ thumb }: { thumb: typeof YOUTUBE_VIDEOS[0] }) {
  return (
    <div className="flex-shrink-0 w-[280px] h-[280px] bg-[#1A1B1E] rounded-xl overflow-hidden border border-white/6 flex flex-col">
      <div className="relative" style={{ height: '157px' }}>
        <Image
          src={`/video-testimonial-thumbnails/${thumb.file}`}
          alt={thumb.title}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-11 h-11 rounded-full bg-white/10 border-2 border-white/40 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-l-[12px] border-transparent border-l-white ml-1" />
          </div>
        </div>
      </div>
      <div className="p-3 flex flex-col justify-center flex-1">
        <p className="text-white text-sm font-medium leading-tight">{thumb.title}</p>
        <p className="text-zinc-500 text-xs mt-1.5">{thumb.views}</p>
      </div>
    </div>
  )
}

function AutoplayVideoCard({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex-shrink-0 w-[200px] h-[280px] rounded-xl overflow-hidden bg-black border border-white/8 relative">
      <video
        ref={videoRef}
        src={`/hinge-proof/${src}`}
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>
  )
}

function RowLabel({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-2 px-6 mb-3">
      <span className="text-base">{emoji}</span>
      <span className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">{text}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function TestimonialsScroll() {
  // Row 1: Girl DMs + Coach notifications — doubled
  const row1Base = [
    ...GIRL_HINGE.map(h => ({ type: 'hinge' as const, file: h.file })),
    ...COACH_SCREENSHOTS.map(n => ({ type: 'coach' as const, n })),
  ]
  const row1 = [...row1Base, ...row1Base]

  // Row 2: Match explosion numbers — doubled
  const row2Base = [
    ...MATCH_HINGE.map(h => ({ type: 'hinge' as const, file: h.file })),
  ]
  const row2 = [...row2Base, ...row2Base]

  // Row 3: Reviews + videos — doubled
  const row3Base = [
    ...REVIEW_HINGE.map(h => ({ type: 'hinge' as const, file: h.file })),
    ...HINGE_VIDEOS.map(src => ({ type: 'video' as const, src })),
  ]
  const row3 = [...row3Base, ...row3Base]

  return (
    <div className="w-full overflow-hidden space-y-4 py-2">
      {/* Row 1 — Girls messaging first */}
      <div>
        <RowLabel emoji="💬" text="Girls messaging first" />
        <div className="flex gap-3 animate-marquee-left" style={{ width: 'max-content' }}>
          {row1.map((item, i) =>
            item.type === 'coach'
              ? <CoachCard key={`r1-${i}`} n={item.n} />
              : <HingeCard key={`r1-${i}`} file={item.file} />
          )}
        </div>
      </div>

      {/* Row 2 — Match explosions */}
      <div>
        <RowLabel emoji="📈" text="More matches, instantly" />
        <div className="flex gap-3 animate-marquee-right" style={{ width: 'max-content' }}>
          {row2.map((item, i) => (
            <HingeCard key={`r2-${i}`} file={item.file} />
          ))}
        </div>
      </div>

      {/* Row 3 — What they're saying + video proof */}
      <div>
        <RowLabel emoji="🔥" text="Results speak for themselves" />
        <div className="flex gap-3 animate-marquee-left-slow" style={{ width: 'max-content' }}>
          {row3.map((item, i) => (
            item.type === 'video'
              ? <AutoplayVideoCard key={`r3-${i}`} src={item.src} />
              : <HingeCard key={`r3-${i}`} file={item.file} />
          ))}
        </div>
      </div>
    </div>
  )
}
