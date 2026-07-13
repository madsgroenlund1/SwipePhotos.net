import { NextRequest, NextResponse } from 'next/server'

// Legacy Supabase OAuth/magic-link callback — auth is handled by Clerk now.
// Old links in emails land here; send them to the sign-in page.
export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get('next')
  const url = req.nextUrl.clone()
  url.pathname = '/auth/signin'
  url.search = next ? `?redirect_url=${encodeURIComponent(next)}` : ''
  return NextResponse.redirect(url)
}
