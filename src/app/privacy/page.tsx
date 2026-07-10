import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

export const metadata = { title: 'Privacy Policy — SwipePhotos.net' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: July 8, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-zinc-300">
          <section>
            <p>SwipePhotos.net is operated by Grønlund Investments EMV (CVR: DK42292028). This page describes how we collect, use, and protect your personal data when you use our service.</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-3">Data We Collect</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>Email address (for account creation and order updates)</li>
              <li>Photos you upload (used solely to generate your AI photos — see below)</li>
              <li>Payment information (processed by Stripe — we never store card details)</li>
              <li>Usage data (pages visited, time on site)</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 mb-3">How We Use Your Data</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>To generate your AI photos using face-swap technology</li>
              <li>To send you order updates and results via email</li>
              <li>To process payments securely through Stripe</li>
              <li>To improve our service</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 mb-3">Your Photos</h2>
            <p>The photos you upload are used exclusively to generate your personal AI photos via face-swap technology. They are stored securely and are never shared with third parties or used for any other purpose. You can request deletion at any time by emailing <a href="mailto:support@swipephotos.net" className="text-blue-400">support@swipephotos.net</a>.</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-3">Data Retention</h2>
            <p>Your uploaded photos and generated results are retained for 30 days after your order is completed, after which they are permanently deleted from our servers. Your email address is retained for as long as you have an active account.</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-3">Third-Party Services</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong className="text-white">Stripe</strong> — payment processing (governed by Stripe&apos;s own privacy policy)</li>
              <li><strong className="text-white">Supabase</strong> — secure data and file storage</li>
              <li><strong className="text-white">fal.ai</strong> — AI photo generation processing</li>
              <li><strong className="text-white">Resend</strong> — transactional email delivery</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8 mb-3">GDPR Rights</h2>
            <p>If you are located in the European Economic Area, you have the right to:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:support@swipephotos.net" className="text-blue-400">support@swipephotos.net</a>.</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-3">Cookies</h2>
            <p>We use only essential cookies required for the service to function (authentication, session management). We do not use tracking or advertising cookies.</p>
          </section>

          <div className="pt-6 border-t border-white/8 flex flex-col gap-3 text-sm text-zinc-500">
            <p>Questions? Email us at <a href="mailto:support@swipephotos.net" className="text-blue-400">support@swipephotos.net</a></p>
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 transition-colors">Terms of Service →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
