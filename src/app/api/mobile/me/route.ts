import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { getEntitlement } from '@/lib/entitlement'
import { signMobileToken, verifyMobileToken } from '@/lib/mobile-auth'
import { PLANS } from '@/lib/pricing'
import { requireUser } from '@/lib/mobile-api'

export const maxDuration = 30

const PENDING_GRACE_MS = 15 * 60 * 1000

export async function GET(req: NextRequest) {
  const auth = await requireUser()
  if ('response' in auth) return auth.response
  const { user } = auth

  const admin = createAdminClientDirect()

  // Orders placed with this e-mail before the account existed (e.g. on the website).
  await admin.from('orders').update({ user_id: user.id }).eq('email', user.email).is('user_id', null)

  const { data: rows } = await admin
    .from('orders')
    .select('id, package_type, status, created_at, generated_photos(file_url, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const orders = (rows ?? [])
    .filter(o => o.status !== 'pending' || Date.now() - new Date(o.created_at).getTime() < PENDING_GRACE_MS)
    .map(o => ({
      id: o.id,
      packageType: o.package_type,
      planName: PLANS.find(p => p.id === o.package_type)?.name ?? 'Photos',
      status: o.status,
      createdAt: o.created_at,
      photos: ((o.generated_photos ?? []) as { file_url: string; created_at: string }[])
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map(p => p.file_url),
    }))

  const entitlement = await getEntitlement(user.id)

  // Silently roll the session forward while the user is active.
  let token: string | undefined
  const claims = verifyMobileToken(req.headers.get('x-swipephotos-token') ?? '')
  if (claims && claims.exp - Math.floor(Date.now() / 1000) < 45 * 24 * 3600) {
    token = signMobileToken({ sub: claims.sub, email: claims.email })
  }

  return NextResponse.json({ email: user.email, entitlement, orders, token })
}
