import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/Navbar'
import { BeforeAfterCarousel } from '@/components/BeforeAfterCarousel'

import { TestimonialsScroll } from '@/components/TestimonialsScroll'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      {/* HERO */}
      <section className="pt-32 pb-8 px-6 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
          {[
            { logo: 'tinder', label: 'Tinder' },
            { logo: 'hinge', label: 'Hinge' },
            { logo: 'bumble', label: 'Bumble' },
            { logo: 'instagram', label: 'Instagram' },
          ].map(({ logo, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-2"
            >
              <Image src={`/logos/dating-app-logos/${logo}.png`} alt={label} width={20} height={20} className="w-5 h-5 object-contain" />
              <span className="text-sm text-zinc-400 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* POINT 5: Specific promise with timeframe */}
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-4">
          Get 5–10x More Matches
          <br />
          <span className="text-blue-500">in 7 Days</span>
        </h1>

        {/* POINT 3: "Can't see it's AI" as hero subtitle — stolen from Connor */}
        <p className="text-zinc-500 text-base md:text-lg mb-6 italic">
          (Without a Photoshoot, Expensive Camera, or Leaving Your House)
        </p>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          Upload a few selfies. We generate ultra-realistic photos that look exactly like you —
          in professional settings you&apos;ve never been to, with the lighting and composition of a real photographer.
        </p>

        {/* Social proof row */}
        <div className="flex items-center gap-3 justify-center">
          <div className="flex -space-x-2">
            {[
              '/photos/before-after/julius/after/1.jpg',
              '/photos/before-after/alex/after/1.jpg',
              '/photos/before-after/benni/after/1.jpg',
              '/photos/before-after/black/after/1.jpg',
            ].map((src, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] overflow-hidden relative">
                <Image src={src} alt="user" fill className="object-cover object-top" sizes="32px" />
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-zinc-400 text-xs">Trusted by <span className="text-white font-semibold">10,000+</span> men worldwide</p>
          </div>
        </div>
      </section>

      {/* QUALITY TICKER */}
      <div className="w-full overflow-hidden border-y border-white/5 bg-white/[0.02] py-3 my-8">
        <div className="flex gap-0 animate-ticker" style={{ width: 'max-content' }}>
          {[...Array(4)].map((_, rep) => (
            <div key={rep} className="flex items-center gap-0 flex-shrink-0">
              {[
                { icon: '✓', text: 'PROFESSIONAL SETTINGS', color: 'text-blue-400' },
                { icon: '✓', text: 'YOUR REAL FEATURES', color: 'text-blue-400' },
                { icon: '✓', text: 'COACH-APPROVED TEMPLATES', color: 'text-blue-400' },
                { icon: '✓', text: 'NATURAL LIGHTING', color: 'text-blue-400' },
                { icon: '✓', text: '20+ PHOTOS DELIVERED', color: 'text-blue-400' },
                { icon: '✓', text: 'NO PHOTOGRAPHER NEEDED', color: 'text-blue-400' },
              ].map(({ icon, text, color }, i) => (
                <div key={i} className="flex items-center gap-6 px-8">
                  <span className={`font-bold text-sm ${color}`}>{icon}</span>
                  <span className="text-white/60 text-sm font-medium tracking-widest uppercase whitespace-nowrap">{text}</span>
                  <span className="text-white/20 text-lg">•</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* POINT 4: EMOTIONAL REFRAME — "You're not ugly, you just need better photos" */}
      <section className="py-20 px-6 max-w-3xl mx-auto text-center">
        <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest mb-6">The hard truth</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          You&apos;re not getting fewer matches
          <br />because you&apos;re <span className="text-zinc-500 line-through">ugly</span>.
        </h2>
        <p className="text-2xl md:text-3xl font-bold text-white mb-8">
          You&apos;re getting fewer matches because<br />
          <span className="text-blue-400">you&apos;re marketing yourself wrong.</span>
        </p>
        <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto">
          Women decide in under 1 second whether they&apos;re interested. If your photos don&apos;t instantly grab
          attention, build attraction, and create curiosity — you get ignored. Not because you&apos;re unattractive.
          Because you don&apos;t know how to present yourself correctly. <strong className="text-white">SwipePhotos fixes that.</strong>
        </p>
      </section>

      {/* BEFORE/AFTER CAROUSEL */}
      <BeforeAfterCarousel />

      {/* PHOTO GUIDE — Good vs Bad upload photos */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest mb-4">Step 1 — Upload</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What photos should you upload?
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            The quality of your result depends on your input. Here&apos;s exactly what works — and what doesn&apos;t.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* GOOD */}
          <div className="rounded-2xl border border-green-500/30 bg-green-950/10 overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-green-500/20">
              <span className="text-green-400 font-bold text-lg">✓</span>
              <span className="text-green-400 font-bold text-lg">Good</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { src: '/photos/guide/1.webp', label: 'Clear face, good light' },
                { src: '/photos/guide/4.webp', label: 'Smiling, relaxed pose' },
              ].map(({ src, label }) => (
                <div key={src} className="relative rounded-xl overflow-hidden aspect-[3/4]">
                  <Image src={src} alt={label} fill className="object-cover object-top" sizes="(max-width: 768px) 50vw, 33vw" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                    <span className="text-green-400 text-xs font-semibold">✓ {label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BAD */}
          <div className="rounded-2xl border border-red-500/30 bg-red-950/10 overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-red-500/20">
              <span className="text-red-400 font-bold text-lg">✗</span>
              <span className="text-red-400 font-bold text-lg">Bad</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-2">
              {[
                { src: '/photos/guide/1-selfie.webp', label: 'Selfie' },
                { src: '/photos/guide/1-mirror-selfie.webp', label: 'Mirror selfie' },
                { src: '/photos/guide/2-group-photo.webp', label: 'Group photo' },
                { src: '/photos/guide/2-jacket.webp', label: 'Covered up' },
                { src: '/photos/guide/3-sunglasses.webp', label: 'Sunglasses' },
                { src: '/photos/guide/3-dark.webp', label: 'Too dark' },
              ].map(({ src, label }) => (
                <div key={src} className="relative rounded-xl overflow-hidden aspect-[3/4]">
                  <Image src={src} alt={label} fill className="object-cover object-top" sizes="130px" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                    <span className="text-red-400 text-[10px] font-semibold">✗ {label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '☀️', text: 'Good natural lighting' },
            { icon: '👤', text: 'Face clearly visible' },
            { icon: '📐', text: 'Head-to-waist framing' },
            { icon: '🚫', text: 'No hats or sunglasses' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3">
              <span className="text-base flex-shrink-0">{icon}</span>
              <span className="text-zinc-300 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* POINT 2: CONCRETE TESTIMONIALS WITH SPECIFIC NUMBERS */}
      <section className="pt-8 pb-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest mb-4">Real results</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            I&apos;m not the only one who&apos;s seen results...
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            These aren&apos;t percentage increases. These are real numbers from real profiles.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Testimonial 1 — Marcus */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            {/* Before/After photos */}
            <div className="flex h-72 relative">
              <div className="relative flex-1 overflow-hidden">
                <Image src="/photos/before-after/benni/before/1.jpg" alt="Marcus before" fill className="object-cover object-top" sizes="(max-width: 768px) 50vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 left-2 text-red-400 text-[10px] font-bold uppercase tracking-wide bg-black/40 px-1.5 py-0.5 rounded">✗ Before</span>
              </div>
              <div className="relative flex-1 overflow-hidden">
                <Image src="/photos/before-after/benni/after/1.jpg" alt="Marcus after" fill className="object-cover" style={{ objectPosition: 'center 20%' }} sizes="(max-width: 768px) 50vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 left-2 text-green-400 text-[10px] font-bold uppercase tracking-wide bg-black/40 px-1.5 py-0.5 rounded">✓ After</span>
              </div>
            </div>
            <div className="bg-blue-600/10 border-y border-blue-500/20 px-6 py-4">
              <div className="text-blue-400 text-sm font-semibold uppercase tracking-wide mb-1">Marcus, 28</div>
              <div className="text-white font-bold text-xl">3 likes/month → <span className="text-green-400">142 likes in 3 days</span></div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-2">Before</p>
                <ul className="space-y-1.5 text-zinc-400 text-sm">
                  <li>• Getting only a few likes a month</li>
                  <li>• Had to always make the first move</li>
                  <li>• Never had a rose sent to him</li>
                  <li>• Thought the problem was his looks</li>
                </ul>
              </div>
              <div>
                <p className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-2">After SwipePhotos</p>
                <ul className="space-y-1.5 text-white text-sm">
                  <li>• 142 likes in the first 3 days</li>
                  <li>• Now averages 20+ likes a day</li>
                  <li>• Women message him first</li>
                  <li>• Gets roses sent to him daily</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Testimonial 2 — Andreas */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex h-72 relative">
              <div className="relative flex-1 overflow-hidden">
                <Image src="/photos/before-after/andreas/before/1.jpg" alt="Andreas before" fill className="object-cover object-top" sizes="(max-width: 768px) 50vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 left-2 text-red-400 text-[10px] font-bold uppercase tracking-wide bg-black/40 px-1.5 py-0.5 rounded">✗ Before</span>
              </div>
              <div className="relative flex-1 overflow-hidden">
                <Image src="/photos/before-after/andreas/after/1.jpg" alt="Andreas after" fill className="object-cover" style={{ objectPosition: 'center 20%' }} sizes="(max-width: 768px) 50vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 left-2 text-green-400 text-[10px] font-bold uppercase tracking-wide bg-black/40 px-1.5 py-0.5 rounded">✓ After</span>
              </div>
            </div>
            <div className="bg-blue-600/10 border-y border-blue-500/20 px-6 py-4">
              <div className="text-blue-400 text-sm font-semibold uppercase tracking-wide mb-1">Andreas, 24</div>
              <div className="text-white font-bold text-xl">5 likes/week → <span className="text-green-400">55 likes overnight</span></div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-2">Before</p>
                <ul className="space-y-1.5 text-zinc-400 text-sm">
                  <li>• Friends said he was good-looking</li>
                  <li>• Rarely opened the app anymore</li>
                  <li>• Barely got matches back from likes</li>
                  <li>• No idea what was wrong</li>
                </ul>
              </div>
              <div>
                <p className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-2">After SwipePhotos</p>
                <ul className="space-y-1.5 text-white text-sm">
                  <li>• 55 likes in under 24 hours</li>
                  <li>• More in 1 day than in 2 months before</li>
                  <li>• Booked dates the first weekend</li>
                  <li>• Likes from women he actually wants</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Testimonial 3 — Julius */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex h-72 relative">
              <div className="relative flex-1 overflow-hidden">
                <Image src="/photos/before-after/julius/before/2.webp" alt="Julius before" fill className="object-cover" style={{ objectPosition: 'center 10%' }} sizes="(max-width: 768px) 50vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 left-2 text-red-400 text-[10px] font-bold uppercase tracking-wide bg-black/40 px-1.5 py-0.5 rounded">✗ Before</span>
              </div>
              <div className="relative flex-1 overflow-hidden">
                <Image src="/photos/before-after/julius/after/1.jpg" alt="Julius after" fill className="object-cover" style={{ objectPosition: 'center 15%' }} sizes="(max-width: 768px) 50vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 left-2 text-green-400 text-[10px] font-bold uppercase tracking-wide bg-black/40 px-1.5 py-0.5 rounded">✓ After</span>
              </div>
            </div>
            <div className="bg-blue-600/10 border-y border-blue-500/20 px-6 py-4">
              <div className="text-blue-400 text-sm font-semibold uppercase tracking-wide mb-1">Julius, 22</div>
              <div className="text-white font-bold text-xl">Never used apps → <span className="text-green-400">20 likes/day</span></div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-2">Before</p>
                <ul className="space-y-1.5 text-zinc-400 text-sm">
                  <li>• Had never used Hinge before</li>
                  <li>• No idea what photos to use</li>
                  <li>• Would have got zero results</li>
                  <li>• Would have thought he was the problem</li>
                </ul>
              </div>
              <div>
                <p className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-2">After SwipePhotos</p>
                <ul className="space-y-1.5 text-white text-sm">
                  <li>• 20 likes a day, consistently</li>
                  <li>• 5 dates booked in under a week</li>
                  <li>• Top 1% of profiles on Hinge</li>
                  <li>• Women message him first</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POINT 1: PERSONAL STORY — founder quote with specific numbers */}
      <section className="pt-4 pb-12 px-6">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-950/40 to-zinc-900/60 border border-blue-500/20 rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
              <Image src="/logo.png" alt="SwipePhotos logo" width={56} height={56} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold">Mads, Founder of SwipePhotos</div>
              <div className="text-zinc-500 text-sm">Built this after seeing the problem firsthand</div>
            </div>
          </div>
          <blockquote className="text-white text-xl md:text-2xl font-medium leading-relaxed mb-6">
            &ldquo;I went from getting 5–7 matches a week to <span className="text-blue-400 font-bold">20–30 matches every single day</span>.
            Same app. Same me. Just new photos.
            <br /><br />
            Girls started messaging me first. That had never happened before. I&apos;ve had over
            <span className="text-blue-400 font-bold"> 700 likes in a month</span> — and not one person
            has ever mentioned &apos;AI&apos;. This isn&apos;t AI slop. It looks completely real.&rdquo;
          </blockquote>
          <p className="text-zinc-400 text-base">
            That&apos;s why I built SwipePhotos — so anyone can get the same results, in minutes, without a photographer.
          </p>
        </div>
      </section>

      {/* QUALITY SECTION */}
      <section className="py-16 px-6 max-w-3xl mx-auto text-center">
        <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest mb-4">Quality results</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Photos that look like
          <br />
          <span className="text-blue-400">they were taken by a pro.</span>
        </h2>
        <p className="text-zinc-400 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          Our AI preserves your real face, skin tone, and features — placing you in professional
          settings with natural lighting and composition. The result looks like you hired a photographer.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            {
              svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-blue-400"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
              label: 'Looks exactly like you',
            },
            {
              svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-blue-400"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
              label: 'Professional settings',
            },
            {
              svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-blue-400"><path d="M12 3v1m0 16v1m8.66-9H21m-18 0H1.34M17.66 5.34l-.7.7M7.04 17.66l-.7.7M17.66 18.66l-.7-.7M7.04 6.34l-.7-.7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
              label: 'Natural lighting',
            },
            {
              svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-blue-400"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
              label: 'Coach-approved templates',
            },
          ] as Array<{ svg: React.ReactNode; label: string }>).map(({ svg, label }) => (
            <div key={label} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-400/10 flex items-center justify-center">
                {svg}
              </div>
              <span className="text-zinc-300 text-sm text-center font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-8 bg-[#0A0A0A]">
        <div className="text-center mb-6 px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            &ldquo;It&apos;s honestly been life-changing&rdquo;
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Recommended by the biggest dating coaches and hundreds of men across the world.
          </p>
        </div>

        <TestimonialsScroll />
      </section>

      {/* STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center gap-1.5 pb-5 pt-4 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.95) 60%, transparent)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
        <Link
          href="/onboarding"
          className="pointer-events-auto flex items-center gap-3 bg-blue-600 hover:brightness-110 text-white font-bold text-base px-10 py-4 rounded-full transition-all shadow-[0_8px_40px_rgba(59,130,246,0.5)] animate-pulse-glow"
        >
          Generate Your Photos →
        </Link>
        <p className="text-zinc-300 text-xs">Try for free · No credit card required</p>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 px-6 pb-32 text-center">
        <div className="flex items-center justify-center gap-0.5 mb-4">
          <span className="text-white font-bold">SwipePhotos</span>
          <span className="text-blue-500 font-bold">.net</span>
        </div>
        <p className="text-zinc-600 text-sm mb-1">© 2026 SwipePhotos.net</p>
        <p className="text-zinc-700 text-xs mb-3">Grønlund Investments EMV · CVR: DK42292028</p>
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400 text-sm transition-colors">
              Privacy Policy
            </Link>
            <span className="text-zinc-700">·</span>
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-400 text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
