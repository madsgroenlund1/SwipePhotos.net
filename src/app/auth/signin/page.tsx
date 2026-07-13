'use client'

import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { clerkAppearance } from '@/lib/clerk-appearance'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-3xl" />

      <div className="relative flex flex-col items-center">
        <Link href="/" className="flex items-center mb-8">
          <span className="text-white font-bold text-2xl tracking-tight">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-2xl tracking-tight">.net</span>
        </Link>

        <SignIn
          routing="hash"
          appearance={clerkAppearance}
          signUpUrl="/auth/signup"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
