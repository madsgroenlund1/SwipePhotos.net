import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CookieBanner } from '@/components/CookieBanner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'SwipePhotos.net — Get 10x More Matches with Professional AI Dating Photos',
  description:
    'The best AI photo generator for men on dating apps. Upload a few photos of yourself. Generate 40+ professional dating photos in 1-click that look exactly like you.',
  keywords: ['AI dating photos', 'Tinder photos', 'Hinge photos', 'dating app photos', 'AI photo generator'],
  openGraph: {
    title: 'SwipePhotos.net — Get 10x More Matches with Professional AI Dating Photos',
    description:
      'Upload 10-20 selfies. Our AI learns your face and generates 40+ professional dating photos. No photographer needed.',
    url: 'https://swipephotos.net',
    siteName: 'SwipePhotos.net',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SwipePhotos.net — Get 10x More Matches',
    description: 'Professional AI photos for dating apps. Upload selfies → get pro-quality photos.',
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
