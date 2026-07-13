import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — SwipePhotos.net',
  description: 'Terms and conditions for using SwipePhotos.net.',
  robots: { index: true, follow: true },
}

export default async function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20 text-zinc-400 text-sm leading-relaxed">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-zinc-600 mb-10">Last updated: July 11, 2026</p>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">1. Service Description</h2>
          <p>
            SwipePhotos.net (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;the service&rdquo;) is operated by
            Grønlund Investments EMV (CVR: DK42292028), registered in Denmark. We provide AI-generated dating
            profile photos using face-swap technology. By creating an account or placing an order you agree to
            these terms in full.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">2. Eligibility</h2>
          <p>
            You must be at least 18 years old to use this service. By using SwipePhotos.net you confirm that
            you meet this requirement and that you are legally permitted to enter into this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">3. Your Photos</h2>
          <p className="mb-3">
            You must only upload photos of yourself that you have the right to use. By uploading photos you grant
            us a limited, non-exclusive licence to process them solely for the purpose of generating your AI output
            photos. This licence ends when your photos are deleted (see section 9).
          </p>
          <p>
            We do not share your source photos with third parties for any purpose other than processing your
            order. See our{' '}
            <Link href="/privacy" className="text-blue-400 underline">Privacy Policy</Link>{' '}
            for details on how fal.ai processes your photos as a data processor.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">4. Acceptable Use</h2>
          <p className="mb-3">You may not use our service to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Upload photos of people without their explicit written consent</li>
            <li>Impersonate another person, celebrity, or public figure</li>
            <li>Generate images for deceptive, fraudulent, or harmful purposes</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Attempt to reverse-engineer, scrape, or abuse our AI pipeline</li>
          </ul>
          <p className="mt-3">
            Violation of these terms may result in immediate termination of your account without refund.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">5. Plans and Deliverables</h2>
          <p className="mb-3">SwipePhotos offers the following subscription plans:</p>
          <div className="space-y-3 mb-4">
            <div className="bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3">
              <div className="text-white font-medium">Starter — €29/month</div>
              <div className="text-zinc-500 mt-1">5 AI photos / month · 2 style presets</div>
            </div>
            <div className="bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3">
              <div className="text-white font-medium">Premium — €49/month</div>
              <div className="text-zinc-500 mt-1">15 AI photos / month · All 40 templates</div>
            </div>
            <div className="bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3">
              <div className="text-white font-medium">Pro — €74/month</div>
              <div className="text-zinc-500 mt-1">45 AI photos / month · All 40 templates · Priority generation</div>
            </div>
          </div>
          <p className="mb-3">
            Delivery times are estimates and depend on the quality of your uploaded photos and current processing
            load. We cannot guarantee specific delivery times. If delivery takes significantly longer than estimated,
            contact us at{' '}
            <a href="mailto:support@swipephotos.net" className="text-blue-400 underline">
              support@swipephotos.net
            </a>.
          </p>
          <p>
            Results depend on the quality of your source photos. We cannot guarantee a specific resemblance or
            a specific number of usable outputs — although we do our best to deliver the full set stated in your plan.
            The service is provided &ldquo;as is&rdquo;.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">6. Subscriptions and Billing</h2>
          <p className="mb-3">
            All payments are processed securely by Stripe. SwipePhotos operates on a subscription basis — you
            are billed monthly (or yearly, if you select an annual plan) on the date of your initial purchase.
            Your subscription renews automatically at the end of each billing period unless cancelled.
          </p>
          <p className="mb-3">
            <strong className="text-white">You can cancel at any time</strong> from your Dashboard → Subscription
            settings. Cancellation takes effect at the end of your current paid billing period; you retain
            access to your photos and plan benefits until then.
          </p>
          <p>
            We may offer retention discounts if you initiate cancellation. Accepting a retention offer does not
            extend your commitment beyond the discounted period — you can still cancel at any time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">7. Refund Policy</h2>
          <p className="mb-3">
            If your photos fail to generate due to a technical error on our side (e.g. a processing failure
            unrelated to your photo quality), you are entitled to a full refund. Contact{' '}
            <a href="mailto:support@swipephotos.net" className="text-blue-400 underline">
              support@swipephotos.net
            </a>{' '}
            within 14 days of your purchase and we will resolve it.
          </p>
          <p>
            For all other cases, payments are non-refundable due to the AI processing costs involved in generating
            your photos. If you are unsatisfied with your results, please contact us — we will work with you on
            a case-by-case basis to find a fair resolution.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">8. Output Photos and Intellectual Property</h2>
          <p className="mb-3">
            You retain full ownership of your generated photos. You may use them freely on dating apps, social
            media, and for personal purposes. Commercial resale of the generated images is not permitted.
          </p>
          <p>
            We retain no rights to your output photos beyond what is necessary to store and deliver the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">9. Data Retention</h2>
          <p>
            Your uploaded photos and generated results are stored for as long as you have an active account so
            you can access them from your Dashboard. If your subscription lapses or you request deletion, we
            will permanently delete your files within 30 days. You can request deletion at any time by emailing{' '}
            <a href="mailto:support@swipephotos.net" className="text-blue-400 underline">
              support@swipephotos.net
            </a>. See our{' '}
            <Link href="/privacy" className="text-blue-400 underline">Privacy Policy</Link>{' '}
            for full retention details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">10. Affiliate Programme</h2>
          <p className="mb-3">
            Our affiliate programme allows approved partners to earn commission on purchases they refer. By
            participating as an affiliate you agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Promote SwipePhotos.net honestly and accurately</li>
            <li>Not use misleading, deceptive, or spam-based promotion methods</li>
            <li>Not bid on our branded keywords in paid search</li>
            <li>Comply with applicable advertising disclosure laws (e.g. FTC guidelines)</li>
          </ul>
          <p className="mt-3">
            Commission is paid monthly on verified purchases. We reserve the right to withhold commission for
            orders that are refunded, charged back, or generated through fraudulent means. Affiliate participation
            may be revoked at any time for policy violations.
          </p>
          <p className="mt-3">
            Referrals are tracked via a first-party cookie (<code className="text-xs bg-white/5 px-1 rounded">sw_ref</code>)
            using first-click attribution with a 30-day window.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">11. Disclaimer and Limitation of Liability</h2>
          <p className="mb-3">
            Results from using SwipePhotos may vary based on photo quality, platform algorithms, and individual
            circumstances. We make no guarantees about the number of matches, likes, or dates you will receive.
            Any case studies or testimonials represent individual results and are not typical.
          </p>
          <p>
            To the maximum extent permitted by Danish law, SwipePhotos.net shall not be liable for any indirect,
            incidental, or consequential damages arising from your use of the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">12. Governing Law</h2>
          <p>
            These terms are governed by Danish law. Any disputes shall be subject to the jurisdiction of the
            courts of Denmark. EU consumers retain the right to bring proceedings in their country of residence
            as required by EU consumer protection law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-white font-semibold text-base mb-3">13. Contact</h2>
          <p>Questions? Email us at{' '}
            <a href="mailto:support@swipephotos.net" className="text-blue-400 underline">
              support@swipephotos.net
            </a>
          </p>
          <p className="mt-2 text-zinc-600">Grønlund Investments EMV · CVR: DK42292028</p>
        </section>

        <div className="mt-12 pt-8 border-t border-white/8 flex gap-6">
          <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  )
}
