import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { processOrderJobs } from '@/lib/job-processor'
import { PLANS } from '@/lib/pricing'
import { fail, loadOwnedOrder, requireUser } from '@/lib/mobile-api'

export const runtime = 'nodejs'
export const maxDuration = 60

// Order status + photos. While an order is generating, each call also advances
// the job pipeline (same as the website's polling), so the app only has to poll.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if ('response' in auth) return auth.response
  const { id } = await params

  const owned = await loadOwnedOrder(id, auth.user.id)
  if (!owned) return fail('Order not found.', 404)

  const admin = createAdminClientDirect()
  let status = owned.status
  if (status === 'generating') {
    const result = await processOrderJobs(id, admin).catch(e => {
      console.error('[mobile/orders/get] processOrderJobs failed:', e)
      return null
    })
    if (result) status = result.status
  }

  const { data: photos } = await admin
    .from('generated_photos')
    .select('file_url, created_at')
    .eq('order_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    id,
    status,
    planName: PLANS.find(p => p.id === owned.package_type)?.name ?? 'Photos',
    photos: (photos ?? []).map(p => p.file_url),
  })
}
