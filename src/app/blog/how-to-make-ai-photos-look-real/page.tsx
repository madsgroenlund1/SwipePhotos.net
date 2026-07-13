import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How to Perfect Your AI Photos After You Get Them — SwipePhotos.net',
  description: 'A simple 2-minute edit in the Apple Photos app — auto-enhance, light and color — is the final 1% that makes your AI photos indistinguishable from a real camera shot.',
  openGraph: {
    title: 'How to Perfect Your AI Photos After You Get Them',
    description: 'The simple 2-minute edit that makes your AI photos look straight off an iPhone camera roll.',
    type: 'article',
  },
}

// Red arrow pointing right, with a label to its left
function ArrowLabel({ top, left, width, label }: { top: string; left: string; width: string; label: string }) {
  return (
    <div className="absolute flex items-center gap-1.5" style={{ top, left, width }}>
      <span className="bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg">{label}</span>
      <svg className="text-red-500 drop-shadow-md flex-1 min-w-6" viewBox="0 0 40 16" fill="none" aria-hidden preserveAspectRatio="none">
        <path d="M2 8h28m0 0l-7-6m7 6l-7 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
          How to Perfect Your AI Photos After You Get Them
        </h1>

        <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
          Your photos arrive ready to use — but a quick 2-minute pass in the Apple Photos editor is the
          final 1% that makes them feel like they came straight off your camera roll. Here&apos;s the exact routine.
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-zinc-300 leading-relaxed">
          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Why edit at all?</h2>
          <p>
            Every photo on your phone has been through Apple&apos;s image pipeline — its light balance, its
            color rendering, its subtle processing. When your AI photo gets the same one-pass treatment,
            it blends perfectly with the rest of your profile. Small adjustments, big difference.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">The 3 controls that matter</h2>

          {/* Annotated screenshot */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 max-w-sm mx-auto my-8">
            <img src="/photos/blog/edit-guide-apple.jpg" alt="Apple Photos adjust screen" className="w-full h-auto" />
            <ArrowLabel top="78.5%" left="8%" width="36%" label="1. Tap Auto" />
            <ArrowLabel top="85%"   left="4%" width="28%" label="2. Fine-tune" />
            <ArrowLabel top="92.5%" left="2%" width="24%" label="3. Adjust tools" />
          </div>

          <h3 className="text-xl font-bold text-white mt-8 mb-3">Step 1 — Start with Auto</h3>
          <p>
            Open the photo → tap <strong className="text-white">Edit</strong> → tap the{' '}
            <strong className="text-white">magic wand</strong> (Auto). Apple analyses the image and applies
            its own balanced light and color correction — the same look every iPhone photo gets. Then drag
            the dial below to taste: usually somewhere between <strong className="text-white">50 and 80</strong> feels
            most natural. 100 is often too much.
          </p>

          <h3 className="text-xl font-bold text-white mt-8 mb-3">Step 2 — Light: Exposure &amp; Brilliance</h3>
          <p>
            Swipe through the adjust tools to <strong className="text-white">Exposure</strong> and{' '}
            <strong className="text-white">Brilliance</strong>:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong className="text-white">Exposure +5 to +10</strong> if the photo feels slightly dark — never more.</li>
            <li><strong className="text-white">Brilliance +10 to +20</strong> lifts shadows and adds depth without blowing out highlights. This is the single most flattering slider for portraits.</li>
            <li>Leave <strong className="text-white">Highlights</strong> and <strong className="text-white">Shadows</strong> alone unless something looks clearly off.</li>
          </ul>

          <h3 className="text-xl font-bold text-white mt-8 mb-3">Step 3 — Color: Warmth &amp; Vibrance</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong className="text-white">Warmth +5 to +10</strong> gives skin a healthy, golden-hour tone. Cold photos read as &ldquo;stock photo&rdquo;.</li>
            <li><strong className="text-white">Vibrance +5 to +15</strong> deepens colors without making skin look orange — always prefer Vibrance over Saturation.</li>
            <li>If skin looks too red, pull <strong className="text-white">Tint</strong> a touch toward green (−5).</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">The golden rule: keep it subtle</h2>
          <p>
            Every adjustment should stay in the <strong className="text-white">±5 to ±20 range</strong>. If you can
            immediately tell the photo was edited, you&apos;ve gone too far — tap and hold the photo while editing to
            compare with the original, and dial back until the edit is invisible but the photo simply looks{' '}
            <em>better</em>.
          </p>
          <p>
            Skip the Filters tab entirely. Named filters (Vivid, Dramatic…) apply a recognisable look that
            experienced swipers subconsciously register as processed.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">The 60-second checklist</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Auto (magic wand) → dial to ~50–80</li>
            <li>Brilliance +10–20, Exposure only if needed</li>
            <li>Warmth +5–10, Vibrance +5–15</li>
            <li>Compare with the original — if you can see the edit, reduce it</li>
            <li>Done. Save and upload.</li>
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
