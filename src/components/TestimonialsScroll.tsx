'use client'

import Image from 'next/image'

// Only screenshots with good aspect ratio (readable, not too thin)
// Filtered out: 9,10,14,15,16,17,18,20,25,26,29,32,33 (too thin/small to read)
const GOOD_SCREENSHOTS = [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 19, 21, 22, 23, 24, 27, 28, 30, 31]

const VIDEO_THUMBNAILS = [
  { file: 'He-Got-100-Matches-Using-AI-Photos.jpg', title: 'He Got 100 Matches Using AI Photos', views: '243K views' },
  { file: 'How-To-Create-Epic-AI-Photos.jpg', title: 'How To Create Epic AI Photos', views: '118K views' },
  { file: 'The-4-AI-photos-that-got-me-10x-more-Tinder-matches.jpg', title: 'The 4 AI Photos That Got Me 10x More Tinder Matches', views: '391K views' },
]

function ScreenshotCard({ n }: { n: number }) {
  return (
    <div className="flex-shrink-0 w-[300px] rounded-xl overflow-hidden bg-[#1E1F22] border border-white/5">
      <Image
        src={`/testimonials-discord-screenshots/${n}.webp`}
        alt={`Testimonial ${n}`}
        width={300}
        height={300}
        className="w-full h-auto object-contain"
        unoptimized
      />
    </div>
  )
}

function VideoCard({ thumb }: { thumb: typeof VIDEO_THUMBNAILS[0] }) {
  return (
    <div className="flex-shrink-0 w-[300px] bg-[#1E1F22] rounded-xl overflow-hidden border border-white/5">
      <div className="relative">
        <Image
          src={`/video-testimonial-thumbnails/${thumb.file}`}
          alt={thumb.title}
          width={300}
          height={168}
          className="w-full h-auto object-cover"
          unoptimized
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/40 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-transparent border-l-white ml-1" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="text-white text-sm font-medium leading-tight">{thumb.title}</p>
        <p className="text-zinc-500 text-xs mt-1">{thumb.views}</p>
      </div>
    </div>
  )
}

export function TestimonialsScroll() {
  const count = GOOD_SCREENSHOTS.length // 20

  // Split into 3 rows, doubled for seamless loop
  const row1 = [...GOOD_SCREENSHOTS.slice(0, 7), ...GOOD_SCREENSHOTS.slice(0, 7)]
  const row2 = [...GOOD_SCREENSHOTS.slice(7, 14), ...GOOD_SCREENSHOTS.slice(7, 14)]
  const row3 = [...GOOD_SCREENSHOTS.slice(14, count), ...GOOD_SCREENSHOTS.slice(14, count)]

  return (
    <div className="w-full overflow-hidden space-y-4 py-4">
      {/* Row 1 — scrolls left */}
      <div className="flex gap-4 animate-marquee-left" style={{ width: 'max-content' }}>
        {row1.map((n, i) => (
          <ScreenshotCard key={`r1-${i}`} n={n} />
        ))}
      </div>

      {/* Row 2 — scrolls right, video cards interleaved */}
      <div className="flex gap-4 animate-marquee-right" style={{ width: 'max-content' }}>
        {row2.map((n, i) => {
          if (i === 2) return (
            <div key={`r2-v-${i}`} className="flex gap-4">
              <VideoCard thumb={VIDEO_THUMBNAILS[0]} />
              <ScreenshotCard n={n} />
            </div>
          )
          if (i === 9) return (
            <div key={`r2-v-${i}`} className="flex gap-4">
              <VideoCard thumb={VIDEO_THUMBNAILS[1]} />
              <ScreenshotCard n={n} />
            </div>
          )
          return <ScreenshotCard key={`r2-${i}`} n={n} />
        })}
      </div>

      {/* Row 3 — scrolls left slow */}
      <div className="flex gap-4 animate-marquee-left-slow" style={{ width: 'max-content' }}>
        {row3.map((n, i) => (
          i === 3
            ? <div key={`r3-v-${i}`} className="flex gap-4"><VideoCard thumb={VIDEO_THUMBNAILS[2]} /><ScreenshotCard n={n} /></div>
            : <ScreenshotCard key={`r3-${i}`} n={n} />
        ))}
      </div>
    </div>
  )
}
