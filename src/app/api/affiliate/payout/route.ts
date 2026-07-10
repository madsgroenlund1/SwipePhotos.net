import { NextResponse } from 'next/server'
import { createClient, createAdminClientDirect } from '@/lib/supabase/server'

const MIN_PAYOUT_CENTS = 5000 // $50

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClientDirect()

  // Get affiliate
  const { data: aff } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aff || aff.status !== 'approved') {
    return NextResponse.json({ error: 'Not an approved affiliate' }, { status: 403 })
  }

  // Sum approved commissions not already paid
  const { data: commissions } = await admin
    .from('commissions')
    .select('id, commission_cents')
    .eq('affiliate_id', aff.id)
    .eq('status', 'approved')

  const availableCents = commissions?.reduce((s, c) => s + c.commission_cents, 0) ?? 0

  if (availableCents < MIN_PAYOUT_CENTS) {
    return NextResponse.json({
      error: `Minimum payout is $${MIN_PAYOUT_CENTS / 100}. Available: $${(availableCents / 100).toFixed(2)}`,
    }, { status: 400 })
  }

  // Check for already-pending payout
  const { data: pendingPayout } = await admin
    .from('payouts')
    .select('id')
    .eq('affiliate_id', aff.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (pendingPayout) {
    return NextResponse.json({ error: 'You already have a pending payout request' }, { status: 400 })
  }

  // Create payout request
  const { error } = await admin.from('payouts').insert({
    affiliate_id: aff.id,
    amount_cents: availableCents,
    status: 'pending',
    affiliate_email: user.email,
  })

  if (error) {
    console.error('[affiliate/payout] DB error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mark commissions as "paid" so they're deducted from available balance
  const commissionIds = commissions?.map(c => c.id) ?? []
  if (commissionIds.length) {
    await admin
      .from('commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .in('id', commissionIds)
  }

  return NextResponse.json({ ok: true, amount_cents: availableCents })
}
