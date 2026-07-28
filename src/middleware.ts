import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    const { userId } = await auth()
    if (!userId) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/signin'
      url.searchParams.set('redirect_url', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  const response = NextResponse.next()

  // Capture ?ref=CODE for affiliate attribution (first-click wins, 30-day cookie).
  const refCode = request.nextUrl.searchParams.get('ref')
  if (refCode && !request.cookies.get('sw_ref')) {
    response.cookies.set('sw_ref', refCode.toLowerCase(), {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  // Log real page visits for the /admin analytics tab, excluding the site
  // owner's own browsing (marked via the sw_visitor_exclude cookie, set once
  // from /admin) and non-page requests (api, admin itself, static assets).
  const path = request.nextUrl.pathname
  const isPageRequest = !path.startsWith('/api') && !path.startsWith('/admin') && !path.includes('.')
  if (isPageRequest && !request.cookies.get('sw_visitor_exclude')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null
    // Vercel's edge network sets this on every request — no external geo-IP lookup needed.
    const country = request.headers.get('x-vercel-ip-country') || null
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
      fetch(`${url}/rest/v1/site_visits`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ path, ip, user_agent: userAgent, referrer, country }),
      }).catch(() => {})
    }
  }

  return response
})

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3|pdf)$).*)',
  ],
}
