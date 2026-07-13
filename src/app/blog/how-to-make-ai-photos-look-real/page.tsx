import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How to Quickly Edit Your Photo — Brightness, Tan and More — SwipePhotos.net',
  description: 'A simple step-by-step guide to editing your dating photos in the Apple Photos app: increase brightness, add a natural tan, and fix lighting in under 2 minutes.',
  openGraph: {
    title: 'How to Quickly Edit Your Photo — Brightness, Tan and More',
    description: 'Step-by-step guide with screenshots: brighten, warm up and perfect any photo in under 2 minutes.',
    type: 'article',
  },
}

// Small red arrow pointing at a specific spot on the screenshot below it.
function Arrow({ top, left, rotate = 0, size = 34 }: { top: string; left: string; rotate?: number; size?: number }) {
  return (
    <svg
      className="absolute text-red-500 drop-shadow-lg"
      style={{ top, left, width: size, height: size, transform: `translate(-50%, -50%) rotate(${rotate}deg)` }}
      viewBox="0 0 24 24" fill="none" aria-hidden
    >
      <path d="M12 20V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Step({ n, title, body, img, alt, arrows }: {
  n: number; title: string; body: string; img: string; alt: string
  arrows?: { top: string; left: string; rotate?: number }[]
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{n}</div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <p className="text-zinc-400 text-sm leading-relaxed mb-4">{body}</p>
      <div className="relative rounded-2xl overflow-hidden border border-white/10 max-w-xs mx-auto">
        <img src={img} alt={alt} className="w-full h-auto" />
        {arrows?.map((a, i) => <Arrow key={i} {...a} />)}
      </div>
    </div>
  )
}

export default async function BlogPost2() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <Link href="/blog" className="text-zinc-500 hover:text-zinc-400 text-sm mb-8 inline-block">
          ← Back to Blog
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">How-To Guide</span>
          <span className="text-zinc-600 text-sm">June 8, 2026 · 4 min read</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
          How to Quickly Edit Your Photo — Brightness, Tan and More
        </h1>

        <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
          Your photos arrive ready to use — but a 2-minute pass in the free Apple Photos editor is the
          final touch that makes them pop: brighter, a natural tan, better contrast. Here&apos;s the exact
          routine, step by step.
        </p>

        <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed">
          <Step
            n={1}
            title="Open Edit → tap Auto"
            body="Open the photo, tap Edit, then tap the magic wand at the bottom of the toolbar. This applies Apple's own balanced correction as a starting point — every iPhone photo goes through something similar."
            img="/photos/blog/edit-step1-start.jpg"
            alt="Apple Photos Adjust screen before any edits"
            arrows={[{ top: '79.7%', left: '50%' }]}
          />

          <Step
            n={2}
            title="Drag the dial to taste"
            body="After tapping Auto, a dial appears below the tools. Drag it left or right to control how strong the auto-correction is — usually somewhere in the middle looks most natural. Too far right and it starts looking over-processed."
            img="/photos/blog/edit-step2-auto.jpg"
            alt="Auto adjustment dial after tapping the magic wand"
            arrows={[{ top: '89%', left: '50%', rotate: -90 }]}
          />

          <Step
            n={3}
            title="Increase brightness — Exposure"
            body="Swipe to the Exposure tool. This is your main brightness control. Push it up (positive) if the photo feels dark, or pull it down a little if it's overexposed. Keep changes small — ±10 to ±20 is usually plenty."
            img="/photos/blog/edit-step3-exposure.jpg"
            alt="Exposure slider example"
            arrows={[{ top: '79.7%', left: '32.2%' }]}
          />

          <Step
            n={4}
            title="Add depth — Brilliance"
            body="Brilliance lifts shadows and adds subtle depth without blowing out highlights. It's the single most flattering slider for portraits — a value around +20 to +35 gives skin a healthy, three-dimensional look."
            img="/photos/blog/edit-step4-brilliance.jpg"
            alt="Brilliance slider example"
            arrows={[{ top: '79.7%', left: '49.8%' }]}
          />

          <Step
            n={5}
            title="Recover detail — Highlights"
            body="If bright areas (like light clothing or a bright background) look washed out, pull Highlights down. This brings back detail without darkening the rest of the photo — don't overdo it, a small negative value is enough."
            img="/photos/blog/edit-step5-highlights.jpg"
            alt="Highlights slider example"
            arrows={[{ top: '79.7%', left: '49.8%' }]}
          />

          <Step
            n={6}
            title="Open up dark areas — Shadows"
            body="Push Shadows up slightly to lighten dark areas — this is what makes a photo feel bright and clear without raising the overall exposure too much. A moderate positive value works for most photos."
            img="/photos/blog/edit-step6-shadows.jpg"
            alt="Shadows slider example"
            arrows={[{ top: '79.7%', left: '49.8%' }]}
          />

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Adding a natural tan — Warmth</h2>
          <p>
            Scroll to the <strong className="text-white">Warmth</strong> tool (the half-black, half-white circle icon).
            Drag it toward the warm side (+10 to +25) to shift skin tone toward a natural, sun-kissed golden hue instead
            of a flat or cool tone. This is the fastest way to make a photo look like it was taken somewhere warm and
            sunny, even if it wasn&apos;t. Pair it with a touch of <strong className="text-white">Vibrance</strong> (+5 to +15)
            for richer, more saturated skin without looking orange — always prefer Vibrance over Saturation, which
            affects everything equally and can look artificial.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">The golden rule: keep it subtle</h2>
          <p>
            Every slider above should stay in a range you&apos;d barely notice on its own. If you can immediately tell
            the photo was edited, you&apos;ve gone too far — press and hold the photo while editing to compare with the
            original, and dial back until the change is invisible but the photo simply looks <em>better</em>. Skip the
            Filters tab entirely — named filters apply a look that experienced swipers subconsciously register as
            processed.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">The result</h2>
          <div className="relative rounded-2xl overflow-hidden border border-white/10 max-w-xs mx-auto my-6">
            <img src="/photos/blog/edit-final-result.jpg" alt="Final edited photo result" className="w-full h-auto" />
          </div>
          <p className="text-center text-zinc-500 text-sm italic">Same photo, 2 minutes of editing — brighter, warmer, more natural.</p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">The 60-second checklist</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Auto (magic wand) → dial to taste</li>
            <li>Exposure — brighten if needed</li>
            <li>Brilliance +20 to +35</li>
            <li>Highlights — small negative if anything looks washed out</li>
            <li>Shadows — small positive to open up dark areas</li>
            <li>Warmth +10 to +25 for a natural tan, Vibrance +5 to +15</li>
            <li>Compare with the original — if you can see the edit, reduce it</li>
          </ul>
        </div>

        <div className="mt-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-white font-bold text-xl mb-2">Don&apos;t have your photos yet?</h3>
          <p className="text-zinc-400 text-sm mb-4">Generate professional AI dating photos that look exactly like you.</p>
          <Link
            href="/onboarding"
            className="inline-block bg-blue-600 hover:brightness-110 text-white font-semibold px-8 py-3 rounded-full transition-all"
          >
            Generate Your Photos →
          </Link>
        </div>
      </main>
    </div>
  )
}
