import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Redirect www → canonical (non-www) so session cookies are always on one domain.
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
          // Step 1: write refreshed tokens into the forwarded request so server
          //         components see the new values when they call cookies().
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Step 2: create a fresh response that carries the same request (with
          //         updated cookies) to the next handler.
          supabaseResponse = NextResponse.next({ request })
          // Step 3: set Set-Cookie headers so the browser updates its cookies too.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do NOT insert any logic between createServerClient and getUser().
  // getUser() refreshes the access token (when expired) using the refresh token,
  // writing new tokens via setAll above.  Any code in between can break this.
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Only redirect to sign-in when we are CERTAIN the user is not authenticated:
  //   - user is null (no valid session)
  //   - AND there is no auth error (network/server issues return an error object —
  //     we do NOT log out users on transient infrastructure problems)
  if (!user && !authError && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Capture ?ref=CODE for affiliate attribution (first-click wins, 30-day cookie).
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
    // Run on all paths except Next.js internals and static files.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3|pdf)$).*)',
  ],
}
