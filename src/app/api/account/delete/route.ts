import { NextResponse } from 'next/server'
import { createClient, createAdminClientDirect } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// Permanently delete the signed-in user's account and ALL associated data:
// generated photos (storage + rows), uploads, orders, affiliate records,
// active Stripe subscriptions, the users row, and the auth user itself.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClientDirect()

  try {
    // 1. Cancel any active Stripe subscriptions so the user isn't billed again
    const { data: userRow } = await admin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    if (userRow?.stripe_customer_id) {
      try {
        const subs = await stripe.subscriptions.list({ customer: userRow.stripe_customer_id, status: 'active' })
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id)
        }
      } catch (e) {
        console.warn('[account/delete] Stripe cancel failed (continuing):', e)
      }
    }

    // 2. Collect the user's orders (by user_id and by email)
    const { data: orders } = await admin
      .from('orders')
      .select('id')
      .or(`user_id.eq.${user.id}${user.email ? `,email.eq.${user.email}` : ''}`)
    const orderIds = (orders ?? []).map(o => o.id)

    // 3. Delete generated photos from storage (best effort) + DB rows
    for (const orderId of orderIds) {
      try {
        const { data: files } = await admin.storage.from('generated-photos').list(orderId)
        if (files?.length) {
          await admin.storage.from('generated-photos').remove(files.map(f => `${orderId}/${f.name}`))
        }
      } catch { /* storage cleanup is best-effort */ }
    }
    if (orderIds.length) {
      await admin.from('generated_photos').delete().in('order_id', orderIds)
      await admin.from('uploads').delete().in('order_id', orderIds)
      await admin.from('preview_refinements').delete().in('order_id', orderIds)
      await admin.from('orders').delete().in('id', orderIds)
    }

    // 4. Affiliate records
    const { data: affRow } = await admin
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (affRow?.id) {
      await admin.from('commissions').delete().eq('affiliate_id', affRow.id)
      await admin.from('payouts').delete().eq('affiliate_id', affRow.id)
      await admin.from('affiliates').delete().eq('id', affRow.id)
    }

    // 5. Users row + the auth user itself
    await admin.from('users').delete().eq('id', user.id)
    const { error: authErr } = await admin.auth.admin.deleteUser(user.id)
    if (authErr) throw authErr

    console.log(`[account/delete] Deleted account ${user.id} (${user.email}) — ${orderIds.length} orders`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account/delete] Failed:', err)
    return NextResponse.json({ error: 'Deletion failed — please contact support@swipephotos.net' }, { status: 500 })
  }
}
