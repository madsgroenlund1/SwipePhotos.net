/**
 * POST /api/admin/recovery
 * Safely recovers orders stuck in any non-terminal state.
 * Idempotent: running it multiple times is always safe.
 *
 * Body (optional): { orderId: string }  — targets one order
 * Without body: scans ALL stuck orders (pending > 10m, generating > 30m)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { processOrderJobs } from '@/lib/job-processor'
import { cookies } from 'next/headers'

export const runtime     = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin-auth')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClientDirect()

  let body: { orderId?: string } = {}
  try { body = await req.json() } catch { /* no body */ }

  // ── Single-order recovery ───────────────────────────────────────────────────
  if (body.orderId) {
    const result = await processOrderJobs(body.orderId, supabase)
    return NextResponse.json({ ok: true, result })
  }

  // ── Bulk scan for stuck orders ──────────────────────────────────────────────
  const now = Date.now()

  // Orders stuck "pending" or "processing" for more than 10 minutes (webhook never fired)
  const pendingCutoff = new Date(now - 10 * 60_000).toISOString()
  // Orders stuck "generating" for more than 30 minutes (browser closed, cron missed)
  const generatingCutoff = new Date(now - 30 * 60_000).toISOString()

  const [{ data: stuckPending }, { data: stuckGenerating }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, email, stripe_session_id')
      .in('status', ['pending', 'processing'])
      .lt('created_at', pendingCutoff)
      .limit(20),
    supabase
      .from('orders')
      .select('id, status, email')
      .eq('status', 'generating')
      .lt('updated_at', generatingCutoff)
      .limit(20),
  ])

  const summary: Array<{ orderId: string; status: string; action: string; result?: string }> = []

  // For stuck pending/processing orders: they likely never got the webhook
  // We can't restart them without verifying payment — log them for manual review
  for (const order of stuckPending ?? []) {
    summary.push({
      orderId: order.id,
      status:  order.status,
      action:  'needs_manual_review',
      result:  `Order in ${order.status} since > 10min. Check Stripe session: ${order.stripe_session_id}`,
    })
  }

  // For stuck generating orders: run the poll logic (safe to retry)
  for (const order of stuckGenerating ?? []) {
    try {
      const result = await processOrderJobs(order.id, supabase)
      summary.push({ orderId: order.id, status: order.status, action: 'polled', result: result.status })
    } catch (e) {
      summary.push({ orderId: order.id, status: order.status, action: 'error', result: String(e) })
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: { stuckPending: stuckPending?.length ?? 0, stuckGenerating: stuckGenerating?.length ?? 0 },
    summary,
  })
}
