import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

export const metadata = { title: 'Terms of Service — SwipePhotos.net' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20 text-zinc-400 text-sm leading-relaxed">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-zinc-600 mb-10">Last updated: July 8, 2026</p>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">1. Service</h2>
          <p>SwipePhotos.net (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by Grønlund Investments EMV (CVR: DK42292028). We provide AI-generated dating profile photos using face-swap technology. By placing an order you agree to these terms.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">2. Eligibility</h2>
          <p>You must be at least 18 years old to use this service. By using SwipePhotos.net you confirm that you meet this requirement.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">3. Your Photos</h2>
          <p className="mb-3">You must only upload photos of yourself that you have the right to use. By uploading photos you grant us a limited, non-exclusive licence to process them solely for the purpose of generating your AI output photos.</p>
          <p>We do not store your source photos longer than necessary to complete your order (maximum 30 days). We do not share, sell, or use your photos for any purpose beyond generating your results.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">4. Acceptable Use</h2>
          <p className="mb-3">You may not use our service to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Upload photos of people without their explicit consent</li>
            <li>Impersonate another person</li>
            <li>Generate images for deceptive, fraudulent, or harmful purposes</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
          <p className="mt-3">Violation of these terms may result in immediate termination of your account without refund.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">5. Payments &amp; Subscriptions</h2>
          <p className="mb-3">All payments are processed securely by Stripe. SwipePhotos operates on a subscription basis — you are billed monthly or yearly depending on the plan you select. You can cancel your subscription at any time from your dashboard; cancellation takes effect at the end of the current billing period.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">6. Refund Policy</h2>
          <p className="mb-3">If your photos fail to generate due to a technical error on our side, you are entitled to a full refund. Contact <a href="mailto:support@swipephotos.net" className="text-blue-400 underline">support@swipephotos.net</a> within 14 days of your purchase and we will resolve it.</p>
          <p>For all other cases, payments are non-refundable due to the computational costs involved. If you are unsatisfied with your results, reach out to us — we will do our best to find a resolution on a case-by-case basis.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">7. Output Photos &amp; Intellectual Property</h2>
          <p className="mb-3">You retain full ownership of your generated photos. You may use them freely on dating apps, social media, and personal use. Commercial resale of the generated images is not permitted.</p>
          <p>We retain no rights to your output photos beyond what is necessary to deliver the service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">8. Disclaimer &amp; Limitation of Liability</h2>
          <p className="mb-3">Results may vary depending on the quality of photos uploaded. We cannot guarantee a specific likeness quality or a specific number of generated photos. The service is provided &ldquo;as is&rdquo; without warranties of any kind.</p>
          <p>To the maximum extent permitted by law, SwipePhotos.net shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">9. Governing Law</h2>
          <p>These terms are governed by Danish law. Any disputes shall be subject to the jurisdiction of the courts of Denmark.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">10. Contact</h2>
          <p>Questions? Email us at <a href="mailto:support@swipephotos.net" className="text-blue-400 underline">support@swipephotos.net</a></p>
          <p className="mt-2 text-zinc-600">Grønlund Investments EMV · CVR: DK42292028</p>
        </section>

        <div className="mt-12 pt-8 border-t border-white/8 flex gap-6">
          <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy →</Link>
        </div>
      </main>
    </div>
  )
}
