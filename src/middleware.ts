import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Redirect www → canonical (non-www) to keep session cookies on one domain
  const host = request.headers.get('host') ?? ''
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone()
    url.host = host.replace(/^www\./, '')
    return NextResponse.redirect(url, { status: 301 })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do NOT add any logic between createServerClient and getUser().
  // getUser() refreshes the access token using the refresh token, and writes
  // the refreshed tokens back to the cookie via setAll above.
  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard — redirect to sign-in if not authenticated
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Capture ?ref=CODE for affiliate attribution (first-click wins, 30-day cookie)
  const refCode = request.nextUrl.searchParams.get('ref')
  if (refCode && !request.cookies.get('sw_ref')) {
    supabaseResponse.cookies.set('sw_ref', refCode.toUpperCase(), {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3|pdf)$).*)',
  ],
}
