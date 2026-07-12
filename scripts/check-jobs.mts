import { readFileSync } from 'fs'
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const { createAdminClientDirect } = await import('../src/lib/supabase/server')
const { fal } = await import('@fal-ai/client')
fal.config({ credentials: process.env.FAL_KEY })

const MODEL = 'bytedance/seedream/v5/pro/edit'
const supabase = createAdminClientDirect()

for (const orderId of ['b4318b15-3c03-4c30-bf73-1b6cd17abc8c', '071167a0-838a-42f7-8a8d-68704c2e97b2']) {
  const { data: order } = await supabase.from('orders').select('replicate_training_id, status').eq('id', orderId).single()
  const entries = JSON.parse(order!.replicate_training_id) as { requestId: string; templateId: string }[]
  const { data: photos } = await supabase.from('generated_photos').select('id').eq('order_id', orderId)
  console.log('===', orderId, 'status:', order!.status, 'photos saved:', photos?.length)
  for (const e of entries) {
    try {
      const s = await fal.queue.status(MODEL, { requestId: e.requestId, logs: false })
      if ((s.status as string) !== 'COMPLETED') console.log(' ', e.templateId, '→', s.status)
    } catch (err) {
      console.log(' ', e.templateId, '→ ERROR:', (err as Error & { status?: number }).status ?? (err as Error).message)
    }
  }
}
