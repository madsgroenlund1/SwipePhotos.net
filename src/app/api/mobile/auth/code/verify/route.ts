import { NextRequest, NextResponse } from 'next/server'
import { findOrCreateClerkUser, normalizeEmail, signMobileToken, verifyEmailCode } from '@/lib/mobile-auth'
import { fail } from '@/lib/mobile-api'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = normalizeEmail(body.email)
  if (!email) return fail('Enter a valid e-mail address.')

  const result = await verifyEmailCode(email, body.code)
  if (!result.ok) return fail(result.error, result.status)

  try {
    const { clerkId } = await findOrCreateClerkUser(email)
    return NextResponse.json({ token: signMobileToken({ sub: clerkId, email }), email })
  } catch (e) {
    console.error('[mobile/auth/code/verify] account lookup failed:', e)
    return fail('Could not sign you in. Please try again.', 500)
  }
}
