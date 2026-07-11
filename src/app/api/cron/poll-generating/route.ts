/**
 * Vercel Cron: runs every minute (see vercel.json).
 * Finds all orders stuck in "generating" status and processes their fal.ai jobs.
 * This makes generation fully server-side — customers do NOT need to keep the
 * browser tab open after payment.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { processOrderJobs } from '@/lib/job-processor'

export const runtime     = 'nodejs'
export const maxDuration = 300  // 5-min cap per Vercel cron invocation

export async function GET(req: NextRequest) {
  // Protect against external callers. Vercel cron requests include this header.
  const cronSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    cronSecret !== `Bearer ${process.env.CRON_SECRET}` &&
    cronSecret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClientDirect()

  // Find orders stuck in "generating" for more than 60 seconds
  // (gives the webhook time to start generation before the cron touches it)
  const cutoff = new Date(Date.now() - 60_000).toISOString()
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'generating')
    .lt('updated_at', cutoff)
    .order('updated_at', { ascending: true })
    .limit(20)

  if (error) {
    console.error('[cron/poll-generating] DB error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!orders?.length) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  console.log(`[cron/poll-generating] Processing ${orders.length} generating orders`)

  const results = await Promise.allSettled(
    orders.map(o => processOrderJobs(o.id, supabase))
  )

  const summary = results.map((r, i) => ({
    orderId: orders[i].id,
    status: r.status === 'fulfilled' ? r.value.status : 'error',
    error: r.status === 'rejected' ? String(r.reason) : undefined,
  }))

  console.log('[cron/poll-generating] Results:', summary)
  return NextResponse.json({ ok: true, processed: orders.length, summary })
}
