import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { getEntitlement } from '@/lib/entitlement'
import { STYLES, fail, isPlanId, requireUser } from '@/lib/mobile-api'

// Creates a PENDING order. The app then uploads photos to
// /api/mobile/orders/[id]/photos and either
//   • buys an In-App Purchase (mode "purchase")  → POST .../iap, or
//   • uses an active subscription (mode "subscription") → POST .../start.
export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if ('response' in auth) return auth.response
  const { user } = auth

  const body = await req.json().catch(() => ({}))
  const mode = body.mode === 'subscription' ? 'subscription' : 'purchase'
  const style = STYLES.includes(body.style) ? (body.style as string) : 'restaurant'
  const hasTattoos = body.hasTattoos === true

  let packageId = body.packageId
  if (mode === 'subscription') {
    const ent = await getEntitlement(user.id)
    if (!ent.active || !ent.planId) return fail('You need an active subscription to start a new set.', 402)
    if (!ent.canStartSet) return fail('You have already used this month’s photo set.', 409)
    packageId = ent.planId
  } else if (!isPlanId(packageId)) {
    return fail('Unknown plan.')
  }

  // Only accept preview images that live in our own storage.
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const preview = typeof body.selectedPreviewUrl === 'string' && base && body.selectedPreviewUrl.startsWith(base)
    ? body.selectedPreviewUrl
    : null

  const admin = createAdminClientDirect()
  const { data, error } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      package_type: packageId,
      status: 'pending',
      selected_presets: hasTattoos ? [style, 'has_tattoos'] : [style],
      email: user.email,
      selected_preview_url: preview,
    })
    .select('id')
    .single()
  if (error || !data) {
    console.error('[mobile/orders] insert failed:', error?.message)
    return fail('Could not create your order. Please try again.', 500)
  }
  return NextResponse.json({ orderId: data.id })
}
