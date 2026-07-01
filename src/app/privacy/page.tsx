import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy &amp; Terms</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: June 28, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-zinc-300">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">Privacy Policy</h2>
            <p>SwipePhotos.net is operated by Grønlund Investments EMV (CVR: DK42292028). This page describes how we collect, use, and protect your personal data when you use our service.</p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">Data We Collect</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Email address (for account creation and order updates)</li>
              <li>Photos you upload (used solely to train your personal AI model)</li>
              <li>Payment information (processed by Stripe — we never store card details)</li>
              <li>Usage data (pages visited, time on site)</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">How We Use Your Data</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>To generate your AI photos</li>
              <li>To send you order updates via email</li>
              <li>To process payments</li>
              <li>To improve our service</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">Your Photos</h3>
            <p>The photos you upload are used exclusively to train a personal AI model for your order. They are stored securely and never shared with third parties. You can request deletion at any time by emailing support@swipephotos.net.</p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">GDPR Rights</h3>
            <p>If you are located in the European Economic Area, you have the right to access, update, or delete your personal information. Contact us at support@swipephotos.net.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Terms of Service</h2>
            <p>By using SwipePhotos.net, you agree to the following terms:</p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">Acceptable Use</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>You must be 18 or older to use this service</li>
              <li>You may only upload photos of yourself</li>
              <li>You may not use generated photos to impersonate others</li>
              <li>You may use generated photos on dating profiles and social media</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">Refund Policy</h3>
            <p>All purchases are final. Due to the nature of AI-generated content and the computational costs involved in training personal models, we do not offer automatic refunds. However, if you are dissatisfied with your results, we encourage you to reach out to us at <a href="mailto:support@swipephotos.net" className="text-blue-400">support@swipephotos.net</a> and we will do our best to find a satisfactory resolution on a case-by-case basis.</p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">Intellectual Property</h3>
            <p>You retain full ownership of your generated photos. You grant SwipePhotos.net a limited license to process and store them for the purpose of delivering the service.</p>
          </section>

          <p className="text-zinc-500 text-sm">
            Questions? Email us at <a href="mailto:support@swipephotos.net" className="text-blue-400">support@swipephotos.net</a>
          </p>
        </div>
      </main>
    </div>
  )
}
