import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CookieBanner } from '@/components/CookieBanner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'SwipePhotos.net — Get 10x More Matches with Undetectable AI Photos',
  description:
    'The best AI photo generator for men on dating apps. Upload a few photos of yourself. Generate photos in 1-click that fully look like you. Proven to work. Undetectable.',
  keywords: ['AI dating photos', 'Tinder photos', 'Hinge photos', 'dating app photos', 'AI photo generator'],
  openGraph: {
    title: 'SwipePhotos.net — Get 10x More Matches with Undetectable AI Photos',
    description:
      'Upload 10-20 selfies. Our AI learns your face and generates 40+ professional dating photos. Undetectable. Proven to work.',
    url: 'https://swipephotos.net',
    siteName: 'SwipePhotos.net',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SwipePhotos.net — Get 10x More Matches',
    description: 'Undetectable AI photos for dating apps. Upload selfies → get professional photos.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-white">
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
