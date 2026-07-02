import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/Navbar'
import { BeforeAfterCarousel } from '@/components/BeforeAfterCarousel'
import { AnimatedAIDetection } from '@/components/AnimatedAIDetection'
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
            { logo: 'bumble', label: 'Bumble' },
            { logo: 'hinge', label: 'Hinge' },
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

        <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6">
          Get 10x more matches with
          <br />
          <span className="text-blue-500">undetectable AI photos</span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          The best AI photo generator for men on dating apps. Upload a few photos of yourself.
          Generate photos in 1-click that fully look like you. Proven to work. Undetectable.
        </p>

        {/* Social proof row — no button here, button is sticky at bottom */}
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

      {/* AI DETECTION TICKER */}
      <div className="w-full overflow-hidden border-y border-white/5 bg-white/[0.02] py-3 my-8">
        <div className="flex gap-0 animate-ticker" style={{ width: 'max-content' }}>
          {[...Array(4)].map((_, rep) => (
            <div key={rep} className="flex items-center gap-0 flex-shrink-0">
              {[
                { icon: '✓', text: 'PASSES AI DETECTION', color: 'text-green-400' },
                { icon: '✓', text: 'UNDETECTABLE ON GOOGLE', color: 'text-green-400' },
                { icon: '✓', text: 'NO SYNTHID WATERMARK', color: 'text-green-400' },
                { icon: '✓', text: 'PASSES TINDER SCAN', color: 'text-green-400' },
                { icon: '✓', text: 'LOOKS 100% REAL', color: 'text-green-400' },
                { icon: '✓', text: 'REVERSE IMAGE SAFE', color: 'text-green-400' },
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

      {/* BEFORE/AFTER CAROUSEL */}
      <BeforeAfterCarousel />

      {/* UNDETECTABLE SECTION */}
      <AnimatedAIDetection />

      {/* TESTIMONIALS */}
      <section className="py-24">
        <div className="text-center mb-12 px-6">
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
        style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.95) 60%, transparent)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
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
          <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400 text-sm transition-colors">
            Privacy Policy &amp; Terms
          </Link>
        </div>
      </footer>
    </main>
  )
}
