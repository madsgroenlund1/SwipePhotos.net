// Seeds the App Review demo account with a finished photo set, so Apple's
// reviewer sees a populated gallery without waiting 30–60 min for generation.
// The photos are the public before/after marketing images from swipephotos.net.
//
// Prerequisites:
//   1. Migration 015 applied, and the app/API deployed with these Vercel env vars:
//        APPLE_REVIEW_EMAIL=appreview@swipephotos.net   (any address you control)
//        APPLE_REVIEW_CODE=<6 digits you choose>
//   2. .env.local has NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
//
// Usage:  APPLE_REVIEW_EMAIL=... APPLE_REVIEW_CODE=123456 npx tsx scripts/seed-review-account.mts
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const email = process.env.APPLE_REVIEW_EMAIL?.trim().toLowerCase()
const code = process.env.APPLE_REVIEW_CODE?.trim()
if (!email || !code) throw new Error('Set APPLE_REVIEW_EMAIL and APPLE_REVIEW_CODE')

const site = 'https://www.swipephotos.net'

// 1. Sign in through the real API so the Clerk + database user exist.
const res = await fetch(`${site}/api/mobile/auth/code/verify`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }),
})
if (!res.ok) throw new Error(`Sign-in failed (${res.status}): ${await res.text()} — are the env vars set on Vercel and deployed?`)
const { token } = await res.json() as { token: string }
const me = await fetch(`${site}/api/mobile/me`, { headers: { 'X-SwipePhotos-Token': token } })
if (!me.ok) throw new Error(`/me failed (${me.status}) — has migration 015 been applied?`)

// 2. Seed a finished order.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const { data: user } = await admin.from('users').select('id').eq('email', email).single()
if (!user) throw new Error('User row not found')

const { data: existing } = await admin.from('orders').select('id').eq('user_id', user.id).eq('status', 'ready').limit(1)
if (existing?.length) { console.log('Demo account already has a finished set — nothing to do.'); process.exit(0) }

const { data: order, error } = await admin.from('orders')
  .insert({ user_id: user.id, email, package_type: 'popular', status: 'ready', selected_presets: ['restaurant'] })
  .select('id').single()
if (error || !order) throw new Error(`Could not create order: ${error?.message}`)

const urls = ['benni', 'jason', 'black', 'julius'].map(id => `${site}/photos/before-after/${id}/after/1.jpg`)
const { error: photoError } = await admin.from('generated_photos')
  .insert(urls.map(file_url => ({ order_id: order.id, file_url })))
if (photoError) throw new Error(`Could not add photos: ${photoError.message}`)
console.log(`✓ Seeded demo set ${order.id} for ${email} with ${urls.length} photos`)
