import { readFileSync } from 'fs'
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const { createAdminClientDirect } = await import('../src/lib/supabase/server')
const { processOrderJobs } = await import('../src/lib/job-processor')

const ORDER_IDS = ['b4318b15-3c03-4c30-bf73-1b6cd17abc8c', '071167a0-838a-42f7-8a8d-68704c2e97b2']
const supabase = createAdminClientDirect()

// Poll every 60s for up to 45 min
for (let i = 0; i < 45; i++) {
  await new Promise(r => setTimeout(r, 60_000))
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
console.log('poller finished')
