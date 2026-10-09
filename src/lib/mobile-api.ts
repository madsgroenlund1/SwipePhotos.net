import { NextResponse } from 'next/server'
import { getDbUser, type DbUser } from '@/lib/auth'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { PLANS } from '@/lib/pricing'

export const STYLES = ['restaurant', 'formal', 'rooftop', 'beach'] as const

export function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

/** Returns the signed-in user, or a ready-made 401 response. */
export async function requireUser(): Promise<{ user: DbUser } | { response: NextResponse }> {
  const user = await getDbUser().catch(() => null)
  if (!user) return { response: fail('Please sign in again.', 401) }
  return { user }
}

export type OwnedOrder = {
  id: string
  user_id: string
  status: string
  package_type: string
  email: string | null
  created_at: string
  apple_transaction_id: string | null
}

/** Loads an order only if it belongs to this user. */
export async function loadOwnedOrder(orderId: string, userId: string): Promise<OwnedOrder | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null
  const admin = createAdminClientDirect()
  const { data } = await admin
    .from('orders')
    .select('id, user_id, status, package_type, email, created_at, apple_transaction_id')
    .eq('id', orderId)
    .maybeSingle()
  if (!data || data.user_id !== userId) return null
  return data as OwnedOrder
}

export function isPlanId(v: unknown): v is 'starter' | 'popular' | 'elite' {
  return PLANS.some(p => p.id === v)
}
