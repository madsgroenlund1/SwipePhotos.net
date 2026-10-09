import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { fail, loadOwnedOrder, requireUser } from '@/lib/mobile-api'

export const maxDuration = 60

const MAX_FILES_PER_ORDER = 8
const MAX_BYTES = 12 * 1024 * 1024

// Authenticated photo upload for an order the caller owns. The tattoo reference
// must be sent with the file name "tattoo-reference.jpg" (the generator finds it by name).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if ('response' in auth) return auth.response
  const { id } = await params

  const order = await loadOwnedOrder(id, auth.user.id)
  if (!order) return fail('Order not found.', 404)
  if (order.status !== 'pending') return fail('This order has already started.', 409)

  let form: FormData
  try { form = await req.formData() } catch { return fail('Invalid upload.') }
  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (!files.length) return fail('No photos received.')

  const admin = createAdminClientDirect()
  const { count } = await admin.from('uploads').select('id', { count: 'exact', head: true }).eq('order_id', id)
  if ((count ?? 0) + files.length > MAX_FILES_PER_ORDER) return fail('Too many photos for one order.')

  const urls: string[] = []
  for (const file of files) {
    if (file.size > MAX_BYTES) return fail('One of the photos is too large.')
    const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80) || 'photo.jpg'
    const path = `${id}/${Date.now()}-${safe}`
    const { error } = await admin.storage
      .from('uploads')
      .upload(path, await file.arrayBuffer(), { contentType: 'image/jpeg', upsert: true })
    if (error) {
      console.error('[mobile/photos] storage error:', error.message)
      return fail('Upload failed. Please try again.', 500)
    }
    const { data: { publicUrl } } = admin.storage.from('uploads').getPublicUrl(path)
    await admin.from('uploads').insert({ order_id: id, file_url: publicUrl })
    urls.push(publicUrl)
  }
  return NextResponse.json({ ok: true, count: urls.length })
}
