import { NextRequest, NextResponse } from 'next/server'
import { getEntitlement } from '@/lib/entitlement'
import { startOrderGeneration } from '@/lib/start-generation'
import { fail, loadOwnedOrder, requireUser } from '@/lib/mobile-api'

export const maxDuration = 120

// Starts a photo set for an ACTIVE subscriber (Apple or website) — no new payment.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if ('response' in auth) return auth.response
  const { id } = await params

  const order = await loadOwnedOrder(id, auth.user.id)
  if (!order) return fail('Order not found.', 404)
  if (order.status !== 'pending') return NextResponse.json({ ok: true, status: order.status })

  const ent = await getEntitlement(auth.user.id)
  if (!ent.active || !ent.canStartSet) return fail('Your subscription does not include a new set right now.', 402)
  if (ent.planId !== order.package_type) return fail('This order does not match your plan.', 409)

  const result = await startOrderGeneration(id)
  if (!result.ok) return fail('We could not start your photos. Please contact support.', 500)
  return NextResponse.json({ ok: true, status: 'generating' })
}
