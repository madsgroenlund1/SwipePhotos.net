/**
 * GET /api/orders/[id]/download-zip
 * Streams a ZIP file of all generated photos for an order.
 * Only the order owner (matched by auth user_id OR order.email) may download.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { getDbUser } from '@/lib/auth'
import JSZip from 'jszip'

export const runtime     = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params

  // Auth check: must be signed in
  const user = await getDbUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClientDirect()

  // Fetch order — only allow owner
  const { data: order } = await admin
    .from('orders')
    .select('id, status, user_id, email')
    .eq('id', orderId)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Access control: order must belong to this user (by user_id or matching email)
  const ownsOrder =
    (order.user_id && order.user_id === user.id) ||
    (order.email && order.email === user.email)

  if (!ownsOrder) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (order.status !== 'ready') {
    return NextResponse.json({ error: 'Photos not ready yet' }, { status: 409 })
  }

  // Fetch all photos for this order
  const { data: photos } = await admin
    .from('generated_photos')
    .select('file_url, template_id')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (!photos?.length) {
    return NextResponse.json({ error: 'No photos found' }, { status: 404 })
  }

  // Build ZIP
  const zip = new JSZip()
  const folder = zip.folder('swipephotos')!

  await Promise.allSettled(
    photos.map(async (photo, idx) => {
      try {
        const res = await fetch(photo.file_url, { signal: AbortSignal.timeout(30_000) })
        if (!res.ok) return
        const buf  = await res.arrayBuffer()
        const name = `swipephoto-${String(idx + 1).padStart(2, '0')}.jpg`
        folder.file(name, buf)
      } catch (e) {
        console.warn(`[download-zip] Failed to fetch photo ${idx + 1}:`, e)
      }
    })
  )

  const zipBuf = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })

  return new NextResponse(zipBuf, {
    status: 200,
    headers: {
      'Content-Type':        'application/zip',
      'Content-Disposition': `attachment; filename="swipephotos-${orderId.slice(-8).toUpperCase()}.zip"`,
      'Content-Length':      String(zipBuf.byteLength),
      'Cache-Control':       'no-store',
    },
  })
}
