import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The 3 Photos Every Man Needs on His Dating Profile — SwipePhotos.net',
  description: 'Face, social proof and a spark of intrigue — the three-photo formula that consistently drives the most matches on Tinder, Hinge and Bumble.',
  openGraph: {
    title: 'The 3 Photos Every Man Needs on His Dating Profile',
    description: 'The proven three-photo formula: a clear face shot, a social shot, and a spark shot.',
    type: 'article',
  },
}

function PhotoExample({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="my-8">
      <div className="rounded-2xl overflow-hidden border border-white/10 max-w-sm mx-auto">
        <img src={src} alt={alt} className="w-full h-auto" />
      </div>
      <figcaption className="text-zinc-500 text-xs text-center mt-2 italic">{caption}</figcaption>
    </figure>
  )
}

export default async function BlogPost3() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <Link href="/blog" className="text-zinc-500 hover:text-zinc-400 text-sm mb-8 inline-block">
          ← Back to Blog
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">Dating Strategy</span>
          <span className="text-zinc-600 text-sm">June 1, 2026 · 5 min read</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
          The 3 Photos Every Man Needs on His Dating Profile
        </h1>

        <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
          Most profiles fail for the same reason: six photos that all say the same thing. The profiles
          that convert follow a simple three-photo formula — a clear face, social proof, and a spark
          of intrigue. Here&apos;s each one, with an example.
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-zinc-300 leading-relaxed">
          <h2 className="text-2xl font-bold text-white mt-10 mb-4">1. The Face Shot — she has to see you clearly</h2>
          <p>
            Your first photo decides everything, and it has one job: show your face, clearly, in good
            light. Chest-up framing, no sunglasses, no group, no clutter. A genuine, relaxed
            expression — a closed-mouth smile or calm confidence — outperforms both the forced grin
            and the dead-serious stare.
          </p>
          <PhotoExample
            src="/photos/blog/photo-face.jpg"
            alt="Clear, well-lit photo where the face is fully visible"
            caption="Clear face, natural light, an interesting setting that doesn't steal the attention."
          />
          <p>
            Bonus points for a setting with a little texture — a nice interior, a city backdrop,
            an event — as long as <em>you</em> stay the subject.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">2. The Social Shot — proof you have a life</h2>
          <p>
            One photo with friends signals the single most attractive trait you can show without
            saying a word: other people enjoy your company. Keep it to two or three people so
            there&apos;s no &ldquo;which one is he?&rdquo; moment, and make sure you&apos;re easy to identify.
          </p>
          <PhotoExample
            src="/photos/blog/photo-social.jpg"
            alt="Photo with a friend on a boat"
            caption="A friend, a setting, a story — social proof without a crowded group shot."
          />
          <p>
            One social shot is enough. Two or more and your profile starts reading as
            &ldquo;always with the boys&rdquo;.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">3. The Spark Shot — give her a reason to open</h2>
          <p>
            The third photo creates intrigue: a hobby, a physique shot if you&apos;ve earned it, travel,
            sport — something that starts a conversation or raises an eyebrow. This is the photo
            that turns &ldquo;he&apos;s cute&rdquo; into a like with a comment.
          </p>
          <PhotoExample
            src="/photos/blog/photo-spark.jpg"
            alt="Confident physique photo"
            caption="Confidence, style, or physique — one photo that sparks curiosity. Never more than one."
          />
          <p>
            The rule: it must feel effortless. A gym-mirror flex with bad lighting tries too hard;
            a well-shot moment where the physique or hobby is simply <em>part of the scene</em> lands.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Putting the profile together</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong className="text-white">Photo 1:</strong> Face shot — always first, non-negotiable</li>
            <li><strong className="text-white">Photo 2–3:</strong> Lifestyle variations: different outfits, different locations</li>
            <li><strong className="text-white">Photo 4:</strong> Social shot</li>
            <li><strong className="text-white">Photo 5:</strong> Spark shot</li>
            <li><strong className="text-white">Photo 6:</strong> Optional — a full-body shot in good style</li>
          </ul>
          <p>
            Every photo should look like it was taken on a different day. Six photos from the same
            afternoon in the same shirt reads as &ldquo;this is all he has&rdquo;.
          </p>
        </div>

        <div className="mt-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-white font-bold text-xl mb-2">Missing one of the three?</h3>
          <p className="text-zinc-400 text-sm mb-4">SwipePhotos generates all of them — face, lifestyle and spark — from 4 selfies.</p>
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
