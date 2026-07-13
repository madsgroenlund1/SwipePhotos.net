import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { submitFaceSwapJobs, pollFaceSwapJobs } from '@/lib/faceswap'
import type { PackageId } from '@/lib/stripe'
import { fal } from '@fal-ai/client'
import { sendReadyEmail } from '@/lib/resend'

fal.config({ credentials: process.env.FAL_KEY })

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { password, orderId } = await req.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClientDirect()

  const { data: order } = await supabase
    .from('orders')
    .select('id, email, status, package_type, selected_presets')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const { data: uploads } = await supabase
    .from('uploads')
    .select('file_url')
    .eq('order_id', orderId)

  if (!uploads?.length) return NextResponse.json({ error: 'No uploads for this order' }, { status: 400 })

  const allUrls = uploads.map((u: { file_url: string }) => u.file_url)
  const tattooSourceUrl = allUrls.find(u => u.includes('tattoo-reference'))
  const faceUrls = allUrls.filter(u => u !== tattooSourceUrl)
  const hasTattoos = ((order.selected_presets as string[] | null) ?? []).includes('has_tattoos')
  const packageId = (order.package_type as PackageId) ?? 'popular'

  await supabase.from('generated_photos').delete().eq('order_id', orderId)
  await supabase.from('orders').update({ status: 'generating' }).eq('id', orderId)

  try {
    async function toFalUrl(url: string) {
      return fal.storage.upload(
        await fetch(url).then(r => r.blob()).then(b => new File([b], 'face.jpg', { type: 'image/jpeg' }))
      )
    }
    const falPhotoUrls = await Promise.all(faceUrls.map(toFalUrl))
    const falTattooUrl = tattooSourceUrl ? await toFalUrl(tattooSourceUrl).catch(() => undefined) : undefined

    let entries = await submitFaceSwapJobs(falPhotoUrls, packageId, hasTattoos, falTattooUrl)
    await supabase.from('orders').update({ replicate_training_id: JSON.stringify(entries) }).eq('id', orderId)

    // Poll until done (max 50s)
    const start = Date.now()
    const allPassed: { url: string; templateId: string }[] = []

    while (entries.length > 0 && Date.now() - start < 50000) {
      await new Promise(r => setTimeout(r, 3000))
      const { passed, pending } = await pollFaceSwapJobs(entries)
      allPassed.push(...passed)
      entries = pending
    }

    for (const { url, templateId } of allPassed) {
      await supabase.from('generated_photos').insert({ order_id: orderId, file_url: url, template_id: templateId })
    }

    if (allPassed.length > 0) {
      await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId)
      if (order.email) await sendReadyEmail(order.email, orderId).catch(console.error)
    }

    return NextResponse.json({ ok: true, count: allPassed.length, pending: entries.length })
  } catch (err) {
    await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
