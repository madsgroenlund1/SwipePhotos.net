import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

export const metadata = { title: 'Terms of Service — SwipePhotos.net' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20 text-zinc-400 text-sm leading-relaxed">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-zinc-600 mb-10">Last updated: July 2026</p>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">1. Service</h2>
          <p>SwipePhotos.net (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides AI-generated dating profile photos using face-swap technology. By placing an order you agree to these terms.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">2. Your Photos</h2>
          <p className="mb-3">You must own the rights to any photos you upload. By uploading photos you grant us a limited licence to process them solely for the purpose of generating your output photos.</p>
          <p>We do not store your source photos longer than necessary to complete your order. We do not share or sell your photos to third parties.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">3. Acceptable Use</h2>
          <p className="mb-3">You may not use our service to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Upload photos of people without their consent</li>
            <li>Generate images for deceptive, fraudulent, or harmful purposes</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">4. Payments & Refunds</h2>
          <p className="mb-3">All payments are processed securely by Stripe. Prices are shown in your local currency at checkout.</p>
          <p>If your photos fail to generate, you are entitled to a full refund. Contact <a href="mailto:support@swipephotos.net" className="text-blue-400 underline">support@swipephotos.net</a> within 14 days of purchase.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">5. Output Photos</h2>
          <p>The AI-generated photos are for personal use. You may use them on dating apps and social media. Commercial resale of the generated images is not permitted.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">6. Disclaimer</h2>
          <p>Results may vary. We cannot guarantee a specific likeness quality. The service is provided &ldquo;as is&rdquo; without warranties of any kind.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">7. Contact</h2>
          <p>Questions? Email us at <a href="mailto:support@swipephotos.net" className="text-blue-400 underline">support@swipephotos.net</a></p>
        </section>

        <div className="mt-12 pt-8 border-t border-white/8">
          <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy →</Link>
        </div>
      </main>
    </div>
  )
}
