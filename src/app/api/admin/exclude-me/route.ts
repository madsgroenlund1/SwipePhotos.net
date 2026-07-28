/**
 * POST /api/admin/exclude-me
 * Sets a long-lived cookie in the caller's browser so their own browsing
 * (on any device where they hit this once from /admin) is excluded from
 * the site_visits analytics table. Admin-only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin-auth')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('sw_visitor_exclude', '1', {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}
