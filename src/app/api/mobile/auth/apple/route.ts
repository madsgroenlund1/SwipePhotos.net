import { NextRequest, NextResponse } from 'next/server'
import { findOrCreateClerkUser, signMobileToken, verifyAppleIdentityToken } from '@/lib/mobile-auth'
import { fail } from '@/lib/mobile-api'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (typeof body.identityToken !== 'string') return fail('Missing identity token.')

  let identity
  try {
    identity = await verifyAppleIdentityToken(body.identityToken)
  } catch (e) {
    console.warn('[mobile/auth/apple] rejected identity token:', e instanceof Error ? e.message : e)
    return fail('Apple sign-in could not be verified.', 401)
  }

  try {
    const { clerkId } = await findOrCreateClerkUser(identity.email)
    return NextResponse.json({ token: signMobileToken({ sub: clerkId, email: identity.email }), email: identity.email })
  } catch (e) {
    console.error('[mobile/auth/apple] account lookup failed:', e)
    return fail('Could not sign you in. Please try again.', 500)
  }
}
