import { fal } from '@fal-ai/client'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { submitFaceSwapJobs } from '@/lib/faceswap'
import { sendWelcomeEmail } from '@/lib/resend'
import type { PackageId } from '@/lib/stripe'

fal.config({ credentials: process.env.FAL_KEY })

export type StartResult =
  | { ok: true; jobs: number; alreadyStarted?: boolean }
  | { ok: false; error: string }

/**
 * Starts photo generation for an order whose payment/entitlement has ALREADY
 * been verified (Apple IAP or an active subscription). Mirrors the Stripe
 * webhook's pipeline, but is used only by the mobile routes so the web
 * checkout code stays untouched.
 *
 * Idempotent: the pending → processing claim is atomic, so double taps or
 * retries can never queue a second batch of fal.ai jobs.
 */
export async function startOrderGeneration(orderId: string): Promise<StartResult> {
  const supabase = createAdminClientDirect()

  const { data: claimed } = await supabase
    .from('orders')
    .update({ status: 'processing' })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('email, selected_presets, package_type')
  const order = claimed?.[0]
  if (!order) return { ok: true, jobs: 0, alreadyStarted: true }

  try {
    if (order.email) await sendWelcomeEmail(order.email, orderId).catch(console.error)

    const { data: uploads } = await supabase.from('uploads').select('file_url').eq('order_id', orderId)
    if (!uploads?.length) throw new Error('No photos uploaded for this order')

    const allUrls = uploads.map((u: { file_url: string }) => u.file_url)
    const tattooSourceUrl = allUrls.find(u => u.includes('tattoo-reference'))
    const imageUrls = allUrls.filter(u => u !== tattooSourceUrl)
    const presets = (order.selected_presets as string[] | null) ?? []
    const hasTattoos = presets.includes('has_tattoos')
    const packageId = (order.package_type as PackageId) ?? 'popular'

    const toFalUrl = async (url: string) =>
      fal.storage.upload(
        await fetch(url).then(r => r.blob()).then(b => new File([b], 'face.jpg', { type: 'image/jpeg' }))
      )

    const falPhotoUrls: string[] = []
    for (const url of imageUrls) {
      try { falPhotoUrls.push(await toFalUrl(url)) } catch (e) { console.warn('[start-generation] photo copy failed:', e) }
    }
    if (!falPhotoUrls.length) throw new Error('Could not upload any customer photos to fal.ai')

    const falTattooUrl = tattooSourceUrl ? await toFalUrl(tattooSourceUrl).catch(() => undefined) : undefined

    const entries = await submitFaceSwapJobs(falPhotoUrls, packageId, hasTattoos, falTattooUrl)
    if (!entries.length) throw new Error('No jobs submitted')

    await supabase.from('orders').update({
      status: 'generating',
      replicate_training_id: JSON.stringify(entries),
      max_generation_attempts: entries.length,
      generation_attempts_used: entries.length,
    }).eq('id', orderId)

    console.log(`[start-generation] ${entries.length} jobs queued for order ${orderId}`)
    return { ok: true, jobs: entries.length }
  } catch (err) {
    console.error('[start-generation] failed:', err)
    await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
    return { ok: false, error: String(err instanceof Error ? err.message : err) }
  }
}
