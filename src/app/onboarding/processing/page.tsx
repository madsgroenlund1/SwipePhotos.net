import { Suspense } from 'react'
import { ProcessingPageClient } from './ProcessingPageClient'

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
      </div>
    }>
      <ProcessingPageClient />
    </Suspense>
  )
}
