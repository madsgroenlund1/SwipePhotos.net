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

  return response
})

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3|pdf)$).*)',
  ],
}
