// One-off: resubmit generation jobs for orders stuck in 'generating' whose
// jobs were submitted against the old (dead) template URLs, then poll to done.
// Run: npx tsx scripts/resubmit-stuck.mts
import { readFileSync } from 'fs'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const { createAdminClientDirect } = await import('../src/lib/supabase/server')
const { submitFaceSwapJobs } = await import('../src/lib/faceswap')
const { processOrderJobs } = await import('../src/lib/job-processor')
const { fal } = await import('@fal-ai/client')
fal.config({ credentials: process.env.FAL_KEY })

const ORDER_IDS = ['b4318b15-3c03-4c30-bf73-1b6cd17abc8c', '071167a0-838a-42f7-8a8d-68704c2e97b2']
const supabase = createAdminClientDirect()

for (const orderId of ORDER_IDS) {
  console.log('=== order', orderId)
  const [{ data: uploads }, { data: order }] = await Promise.all([
    supabase.from('uploads').select('file_url').eq('order_id', orderId),
    supabase.from('orders').select('selected_presets, status, package_type').eq('id', orderId).single(),
  ])
  if (!uploads?.length) { console.log('no uploads — skipping'); continue }

  const falUrls: string[] = []
  for (const u of uploads) {
    const blob = await fetch(u.file_url).then(r => r.blob())
    falUrls.push(await fal.storage.upload(new File([blob], 'face.jpg', { type: 'image/jpeg' })))
  }
  console.log('uploaded', falUrls.length, 'photos to fal')

  const presets = (order?.selected_presets as string[] | null) ?? []
  const packageId = (order?.package_type as 'starter' | 'popular' | 'elite') ?? 'popular'
  const entries = await submitFaceSwapJobs(falUrls, packageId, presets.includes('has_tattoos'))
  console.log('submitted', entries.length, 'jobs')

  await supabase.from('orders')
    .update({ status: 'generating', replicate_training_id: JSON.stringify(entries) })
    .eq('id', orderId)
}

// Poll until both orders resolve (max ~12 min)
for (let i = 0; i < 24; i++) {
  await new Promise(r => setTimeout(r, 30_000))
  let allDone = true
  for (const orderId of ORDER_IDS) {
    const res = await processOrderJobs(orderId, supabase)
    console.log(`[poll ${i}]`, orderId, JSON.stringify(res))
    if (res.status === 'generating') allDone = false
  }
  if (allDone) break
}
console.log('done')
