import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CookieBanner } from '@/components/CookieBanner'
import { AuthProvider } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/server'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'SwipePhotos.net — Professional AI Dating Photos for Men',
  description:
    'Generate professional dating photos with AI. Upload a few clear selfies — we place your real face in premium settings. No photographer, no photoshoot. Plans from €29.',
  keywords: ['AI dating photos', 'Tinder photos', 'Hinge photos', 'dating app photos', 'AI photo generator', 'dating profile photos'],
  alternates: {
    canonical: 'https://swipephotos.net',
  },
  openGraph: {
    title: 'SwipePhotos.net — Professional AI Dating Photos for Men',
    description:
      'Upload 3 selfies. Our AI places your real face in professional settings and delivers 5–45 photos to your email. No photographer needed.',
    url: 'https://swipephotos.net',
    siteName: 'SwipePhotos.net',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SwipePhotos.net — Professional AI Dating Photos',
    description: 'Upload a few selfies. Get professional dating photos delivered to your email. No photographer needed.',
  },
  robots: { index: true, follow: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch user once at the root — the AuthProvider seeds all client components.
  // The middleware already refreshed the access token (if needed) before this runs,
  // so getUser() here always reflects the current, valid session state.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-white">
        <AuthProvider initialUser={user ?? null}>
          {children}
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  )
}
