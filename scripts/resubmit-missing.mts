// Resubmit only the templates that never completed for stuck orders,
// then poll until the orders resolve.
import { readFileSync } from 'fs'
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const { createAdminClientDirect } = await import('../src/lib/supabase/server')
const { processOrderJobs } = await import('../src/lib/job-processor')
const { TEMPLATES } = await import('../src/lib/templates')
const { fal } = await import('@fal-ai/client')
fal.config({ credentials: process.env.FAL_KEY })

const MODEL = 'bytedance/seedream/v5/pro/edit'
const ORDER_IDS = ['b4318b15-3c03-4c30-bf73-1b6cd17abc8c', '071167a0-838a-42f7-8a8d-68704c2e97b2']
const supabase = createAdminClientDirect()

function buildPrompt(setting: string, isMannequin: boolean, refCount: number): string {
  const refPhotos = refCount >= 2
    ? '#2 and #3 are reference photos of the same real person from different angles. Use both to reconstruct the exact identity.'
    : '#2 is a reference photo of the real person.'
  const headNote = isMannequin
    ? 'The figure in #1 has a blank mannequin head. Replace it with'
    : 'Replace the face and head in #1 with'
  return `#1 is the target scene. Preserve every detail of #1 exactly: the ${setting} setting, clothing, body, arms, hands, pose, lighting and camera angle. Do not change anything in #1 except the face and head.

${refPhotos} Extract the exact identity: face shape, eyes, eyebrows, nose, lips, jawline, skin tone, skin texture, hair colour, hairline and hairstyle.

${headNote} the exact identity from the reference photos. Adapt the head naturally to the angle, expression and lighting of #1. Blend seamlessly at the hairline, neck and ears.

Do not idealise, slim or smooth the face. Reproduce the exact real person from the reference photos.

The result must look like one authentic photograph of this specific real person in the scene from #1.`
}

for (const orderId of ORDER_IDS) {
  const [{ data: entriesRow }, { data: photos }, { data: uploads }] = await Promise.all([
    supabase.from('orders').select('replicate_training_id').eq('id', orderId).single(),
    supabase.from('generated_photos').select('template_id').eq('order_id', orderId),
    supabase.from('uploads').select('file_url').eq('order_id', orderId),
  ])
  const allEntries = JSON.parse(entriesRow!.replicate_training_id) as { requestId: string; templateId: string }[]
  const doneIds = new Set((photos ?? []).map(p => p.template_id))
  const missing = allEntries.filter(e => !doneIds.has(e.templateId)).map(e => e.templateId)
  console.log('===', orderId, 'missing:', missing)
  if (!missing.length) continue

  const falUrls: string[] = []
  for (const u of (uploads ?? []).slice(0, 3)) {
    const blob = await fetch(u.file_url).then(r => r.blob())
    falUrls.push(await fal.storage.upload(new File([blob], 'face.jpg', { type: 'image/jpeg' })))
  }

  const newEntries: { requestId: string; templateId: string }[] = []
  for (const tid of missing) {
    const t = TEMPLATES.find(x => x.id === tid)
    if (!t) continue
    const imageUrls = [t.url, ...falUrls.slice(0, 2)]
    const prompt = buildPrompt(t.setting, t.isMannequin ?? false, imageUrls.length - 1)
    const res = await fal.queue.submit(MODEL, { input: { image_urls: imageUrls, prompt } })
    newEntries.push({ requestId: res.request_id, templateId: tid })
    console.log('resubmitted', tid, res.request_id)
  }

  await supabase.from('orders')
    .update({ replicate_training_id: JSON.stringify(newEntries), status: 'generating' })
    .eq('id', orderId)
}

for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 45_000))
  let allDone = true
  for (const orderId of ORDER_IDS) {
    const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single()
    if (order?.status !== 'generating') { console.log(orderId, '→', order?.status); continue }
    const res = await processOrderJobs(orderId, supabase)
    console.log(`[${i}]`, orderId, JSON.stringify(res))
    if (res.status === 'generating') allDone = false
  }
  if (allDone) break
}
console.log('finished')
