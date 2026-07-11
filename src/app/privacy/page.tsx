import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — SwipePhotos.net',
  description: 'How SwipePhotos.net collects, uses, and protects your personal data.',
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: July 11, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-zinc-300 text-sm leading-relaxed">

          <section>
            <p>
              SwipePhotos.net is operated by <strong className="text-white">Grønlund Investments EMV</strong> (CVR: DK42292028),
              registered in Denmark. This policy describes how we collect, use, share, and protect your personal
              data when you use our service.
            </p>
            <p className="mt-3">
              Contact:{' '}
              <a href="mailto:support@swipephotos.net" className="text-blue-400 hover:underline">
                support@swipephotos.net
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Data We Collect</h2>
            <ul className="list-disc ml-5 space-y-2">
              <li>
                <strong className="text-white">Email address</strong> — required for account creation, order updates,
                and transactional emails (magic link sign-in, results delivery).
              </li>
              <li>
                <strong className="text-white">Photos you upload</strong> — used solely to generate your AI photos
                via our face-swap pipeline. See section 3 for details.
              </li>
              <li>
                <strong className="text-white">Payment data</strong> — handled entirely by Stripe. We never store
                your card number or payment credentials. We receive order confirmations and subscription status
                from Stripe webhooks.
              </li>
              <li>
                <strong className="text-white">Usage data</strong> — pages visited, session duration, browser type,
                IP address. Used to operate and improve the service.
              </li>
              <li>
                <strong className="text-white">Affiliate referral data</strong> — if you arrive via an affiliate link
                (e.g. <code className="text-xs bg-white/5 px-1 rounded">swipephotos.net/?ref=CODE</code>), we store
                the referral code in a first-party cookie named <code className="text-xs bg-white/5 px-1 rounded">sw_ref</code>{' '}
                (httpOnly, 30-day expiry, first-click attribution). This is used to credit the referring affiliate
                if you make a purchase.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc ml-5 space-y-2">
              <li>To generate your AI photos and deliver them to you</li>
              <li>To send you order confirmations, results, and account-related emails</li>
              <li>To process and manage your subscription via Stripe</li>
              <li>To attribute purchases to affiliate partners</li>
              <li>To detect and prevent abuse of the service</li>
              <li>To improve the quality and performance of our service</li>
            </ul>
            <p className="mt-3">
              We do not use your data for advertising, profiling, or sale to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Your Photos and AI Processing</h2>
            <p>
              The photos you upload are transmitted to <strong className="text-white">fal.ai</strong> (our AI
              infrastructure provider) for face-swap processing. This means your photos are shared with fal.ai
              as a data processor acting on our behalf and under our instructions. fal.ai does not use your photos
              for training their models or for any purpose beyond processing your specific request.
            </p>
            <p className="mt-3">
              Your source photos and generated results are stored in <strong className="text-white">Supabase</strong>{' '}
              (our database and file storage provider). Both fal.ai and Supabase are contractually bound to keep your
              data confidential and secure.
            </p>
            <p className="mt-3">
              You can request deletion of your photos at any time by emailing{' '}
              <a href="mailto:support@swipephotos.net" className="text-blue-400 hover:underline">
                support@swipephotos.net
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Data Retention</h2>
            <ul className="list-disc ml-5 space-y-2">
              <li>
                <strong className="text-white">Uploaded photos and generated results</strong> — retained for
                as long as you have an active account so you can access your photos from your dashboard.
                If your subscription lapses or you request deletion, we will permanently delete your files
                within 30 days.
              </li>
              <li>
                <strong className="text-white">Email address and account data</strong> — retained for the lifetime
                of your account. You can request deletion at any time.
              </li>
              <li>
                <strong className="text-white">Payment and billing records</strong> — retained as required by
                Danish accounting law (typically 5 years).
              </li>
              <li>
                <strong className="text-white">Affiliate referral cookie</strong> — stored in your browser for
                30 days or until you make a purchase, whichever comes first.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Third-Party Service Providers</h2>
            <p className="mb-3">
              We use the following sub-processors to operate the service. Each acts as a data processor under
              our instructions:
            </p>
            <div className="space-y-3">
              {[
                {
                  name: 'Supabase',
                  role: 'Database, file storage, and authentication',
                  location: 'AWS EU (Ireland)',
                },
                {
                  name: 'fal.ai',
                  role: 'AI image processing (face-swap pipeline)',
                  location: 'United States',
                },
                {
                  name: 'Stripe',
                  role: 'Payment processing and subscription management',
                  location: 'United States / Ireland',
                },
                {
                  name: 'Resend',
                  role: 'Transactional email delivery',
                  location: 'United States',
                },
                {
                  name: 'Vercel',
                  role: 'Web hosting and edge delivery',
                  location: 'United States / EU edge nodes',
                },
              ].map(({ name, role, location }) => (
                <div key={name} className="flex gap-3 bg-white/[0.02] border border-white/6 rounded-xl px-4 py-3">
                  <strong className="text-white w-24 flex-shrink-0">{name}</strong>
                  <div>
                    <div className="text-zinc-300">{role}</div>
                    <div className="text-zinc-600 text-xs mt-0.5">📍 {location}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4">
              Where data is transferred to providers outside the EU/EEA (fal.ai, Stripe, Resend, Vercel), we rely
              on Standard Contractual Clauses (SCCs) or equivalent transfer mechanisms under GDPR Chapter V.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Cookies and Tracking</h2>
            <p className="mb-3">We use the following cookies and browser storage:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>
                <strong className="text-white">Authentication cookies</strong> (Supabase session) — essential for
                keeping you signed in. Cannot be declined without breaking the service.
              </li>
              <li>
                <strong className="text-white">Affiliate referral cookie</strong>{' '}
                (<code className="text-xs bg-white/5 px-1 rounded">sw_ref</code>) — set when you visit via an
                affiliate link. Used to credit the referring partner. Expires after 30 days.
              </li>
              <li>
                <strong className="text-white">Cookie consent preference</strong>{' '}
                (<code className="text-xs bg-white/5 px-1 rounded">cookie-consent</code>) — stored in
                localStorage to remember your banner response.
              </li>
            </ul>
            <p className="mt-3">
              We do not use advertising cookies, third-party tracking pixels, or behavioural profiling cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Your Rights (GDPR)</h2>
            <p className="mb-3">
              If you are located in the EU or EEA, you have the following rights under the General Data Protection
              Regulation (GDPR):
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong className="text-white">Access</strong> — request a copy of the data we hold about you</li>
              <li><strong className="text-white">Rectification</strong> — request correction of inaccurate data</li>
              <li><strong className="text-white">Erasure</strong> — request deletion of your data ("right to be forgotten")</li>
              <li><strong className="text-white">Restriction</strong> — request that we limit how we process your data</li>
              <li><strong className="text-white">Portability</strong> — receive your data in a machine-readable format</li>
              <li><strong className="text-white">Objection</strong> — object to processing based on legitimate interests</li>
              <li><strong className="text-white">Withdraw consent</strong> — where processing is based on consent</li>
            </ul>
            <p className="mt-3">
              To exercise any right, email{' '}
              <a href="mailto:support@swipephotos.net" className="text-blue-400 hover:underline">
                support@swipephotos.net
              </a>. We will respond within 30 days. You also have the right to lodge a complaint with the Danish
              Data Protection Authority (<a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Datatilsynet</a>).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Security</h2>
            <p>
              We use industry-standard security measures including TLS encryption in transit, row-level security
              in our database, and access controls on all file storage. Payment data is handled entirely by Stripe
              and is never stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Children</h2>
            <p>
              This service is intended for users aged 18 and over. We do not knowingly collect data from children.
              If you believe a child has submitted data to us, contact us immediately at{' '}
              <a href="mailto:support@swipephotos.net" className="text-blue-400 hover:underline">
                support@swipephotos.net
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated by email to active
              account holders. The &ldquo;Last updated&rdquo; date at the top of this page always reflects the most
              recent version.
            </p>
          </section>

          <div className="pt-6 border-t border-white/8 flex flex-col gap-3 text-sm text-zinc-500">
            <p>
              Questions? Email us at{' '}
              <a href="mailto:support@swipephotos.net" className="text-blue-400 hover:underline">
                support@swipephotos.net
              </a>
            </p>
            <p>Grønlund Investments EMV · CVR: DK42292028</p>
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Terms of Service →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
