import { NextRequest, NextResponse } from 'next/server'
import { normalizeEmail, startEmailCode } from '@/lib/mobile-auth'
import { fail } from '@/lib/mobile-api'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = normalizeEmail(body.email)
  if (!email) return fail('Enter a valid e-mail address.')
  const result = await startEmailCode(email)
  if (!result.ok) return fail(result.error, result.status)
  return NextResponse.json({ ok: true })
}
