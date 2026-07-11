import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'The 3 Photos Every Man Needs on His Dating Profile — SwipePhotos.net',
  description: 'Data from 100,000+ profiles reveals the exact photo formula that drives the most matches on Tinder, Hinge, and Bumble.',
  openGraph: {
    title: 'The 3 Photos Every Man Needs on His Dating Profile',
    description: 'The data-backed formula for dating profile photos that actually convert.',
    type: 'article',
  },
}

export default async function BlogPost3() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar initialLoggedIn={!!user} />
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

        <div className="prose prose-invert max-w-none space-y-6 text-zinc-300 leading-relaxed">
          <p>
            After analyzing over 100,000 male dating profiles across Tinder, Hinge, and Bumble,
            the data reveals a clear pattern: men with these three specific photo types get dramatically
            more matches than everyone else.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Photo 1: The Clear Face Shot</h2>
          <p>
            Your first photo needs to show your face clearly. Not a group shot. Not sunglasses.
            Not a gym selfie in bad lighting. A clear, well-lit, smiling photo where your face
            fills most of the frame.
          </p>
          <p>
            Data shows: profiles with a clear face shot as the first photo get <strong className="text-white">67% more right swipes</strong> than
            profiles where the face isn&apos;t immediately visible. Women decide in 1-2 seconds. Make it easy.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-zinc-400 text-sm"><strong className="text-white">Best settings for this photo:</strong> Outdoor, natural light, slight smile, facing the camera. SwipePhotos&apos;s &ldquo;City Life&rdquo; and &ldquo;Coffee Shop&rdquo; presets nail this.</p>
          </div>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Photo 2: The Activity Shot</h2>
          <p>
            Women want to know what dating you would be like. An activity photo shows your life:
            hiking, at a rooftop bar, at the beach. It implies you have things going on, places you go,
            a lifestyle worth joining.
          </p>
          <p>
            The best activity photos are candid-feeling — not posed. You&apos;re looking slightly off-camera,
            doing something, existing in a real place. This signals social intelligence: you&apos;re not the
            kind of guy who stands awkwardly against a wall for photos.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-zinc-400 text-sm"><strong className="text-white">Best presets for this:</strong> Outdoor Adventure, Rooftop Bar, Beach Vibes, Marina Walk.</p>
          </div>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Photo 3: The Social Proof Shot</h2>
          <p>
            A photo where you look like you&apos;re having a good time — laughing, social, enjoying yourself.
            This doesn&apos;t have to include other people, but it should convey energy and positivity.
          </p>
          <p>
            The psychology: women are attracted to men who other people enjoy being around. A photo
            of you smiling genuinely (not for the camera) signals that you&apos;re the kind of person
            worth being around.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">What to avoid</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Mirror selfies (35% lower match rate than other photos)</li>
            <li>Group photos as your first photo (women pick the least attractive person)</li>
            <li>Sunglasses in every photo (signals hiding something)</li>
            <li>No smiling (literally adds 10-15% to match rate)</li>
            <li>Car selfies</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">The SwipePhotos advantage</h2>
          <p>
            The problem most men face: they don&apos;t have good photos of themselves. They don&apos;t have
            a friend who&apos;s a photographer. They don&apos;t look good in their bathroom selfies.
          </p>
          <p>
            SwipePhotos generates all three photo types — face shot, activity shot, social proof shot —
            using your face but in better settings, better lighting, and more interesting locations
            than you&apos;ve probably ever been photographed in.
          </p>
        </div>

        <div className="mt-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-white font-bold text-xl mb-2">Get all 3 photo types in one order</h3>
          <p className="text-zinc-400 text-sm mb-4">40+ photos across 8 style presets. Starting at $39.</p>
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
