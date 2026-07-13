import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6 pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-0.5 mb-3">
              <span className="text-white font-bold">SwipePhotos</span>
              <span className="text-blue-500 font-bold">.net</span>
            </div>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Professional AI dating photos for men. No photographer needed.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">Product</p>
            <ul className="space-y-2">
              <li><Link href="/#how-it-works" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">How it works</Link></li>
              <li><Link href="/#results" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Results</Link></li>
              <li><Link href="/onboarding" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Get started</Link></li>
              <li><Link href="/blog" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">Account</p>
            <ul className="space-y-2">
              <li><Link href="/auth/signin" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Sign in</Link></li>
              <li><Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Dashboard</Link></li>
              <li><Link href="/affiliate" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Affiliate programme</Link></li>
            </ul>
          </div>

          {/* Legal + Support */}
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">Legal &amp; Support</p>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Contact us</Link></li>
              <li>
                <a href="mailto:support@swipephotos.net" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  support@swipephotos.net
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-zinc-700 text-xs">© 2026 SwipePhotos.net · Grønlund Investments EMV · CVR: DK42292028</p>
          <p className="text-zinc-700 text-xs italic">Results vary by individual. Not a guarantee of matches or dates.</p>
        </div>
      </div>
    </footer>
  )
}
