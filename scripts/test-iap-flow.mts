// End-to-end test of the Apple In-App Purchase backend against a LOCAL dev server.
// It starts `next dev` itself with a fake Apple certificate chain as the trusted root
// (only possible outside production), forges StoreKit transactions + App Store
// notifications, and checks every rule the server enforces.
//
// No AI credits are used: the test order has no photos, so generation never starts.
// Requires migration 015 (supabase/migrations/015_mobile_app.sql) to be applied.
//
//   npx tsx scripts/test-iap-flow.mts
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { makeChain, signJWS } from './lib/fake-apple'

const PORT = 3177
const BASE = `http://localhost:${PORT}`
const EMAIL = 'ios-iaptest@example.com'
const CODE = '737373'
const BUNDLE = 'net.swipephotos.app'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail = '') => {
  ok ? passed++ : failed++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const chain = makeChain()
const tx = (over: Record<string, unknown> = {}) => signJWS(chain, {
  transactionId: String(Math.floor(Math.random() * 1e15)),
  originalTransactionId: String(Math.floor(Math.random() * 1e15)),
  bundleId: BUNDLE,
  productId: 'net.swipephotos.app.premium.monthly',
  purchaseDate: Date.now(),
  expiresDate: Date.now() + 30 * 86_400_000,
  environment: 'Sandbox',
  ...over,
})

// ── start the server ──────────────────────────────────────────────────────────
const server = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
  cwd: process.cwd(), detached: true, stdio: 'ignore',
  env: { ...process.env, APPLE_IAP_TEST_ROOT_PEM: chain.rootPem, APPLE_REVIEW_EMAIL: EMAIL, APPLE_REVIEW_CODE: CODE },
})
const stop = () => { try { process.kill(-server.pid!) } catch { /* already gone */ } }
process.on('exit', stop)

console.log('Starting local server…')
for (let i = 0; i < 90; i++) {
  await new Promise(r => setTimeout(r, 2000))
  if (await fetch(`${BASE}/api/mobile/me`).then(r => r.status === 401).catch(() => false)) break
  if (i === 89) { console.log('server did not start'); stop(); process.exit(1) }
}

type Json = Record<string, any>
async function api(path: string, opts: { method?: string; body?: unknown; token?: string } = {}): Promise<{ status: number; json: Json }> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', ...(opts.token ? { 'X-SwipePhotos-Token': opts.token } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  return { status: res.status, json: await res.json().catch(() => ({})) }
}

let token = ''
try {
  const login = await api('/api/mobile/auth/code/verify', { body: { email: EMAIL, code: CODE } })
  token = login.json.token
  check('sign in with demo account', login.status === 200 && !!token)

  const newOrder = async (body: Json = {}) =>
    (await api('/api/mobile/orders', { token, body: { mode: 'purchase', packageId: 'popular', style: 'rooftop', ...body } })).json.orderId as string

  console.log('Before any purchase')
  const noEnt = await api('/api/mobile/orders', { token, body: { mode: 'subscription' } })
  check('subscription-mode order refused without a plan', noEnt.status === 402, noEnt.json.error)
  check('/me shows no entitlement', (await api('/api/mobile/me', { token })).json.entitlement.active === false)
  check('unknown plan refused', (await api('/api/mobile/orders', { token, body: { mode: 'purchase', packageId: 'free' } })).status === 400)

  console.log('Redeeming a purchase')
  const order1 = await newOrder()
  const orig = String(Math.floor(Math.random() * 1e15))
  const txId = String(Math.floor(Math.random() * 1e15))
  const good = (o: Json = {}) => tx({ transactionId: txId, originalTransactionId: orig, appAccountToken: order1.toUpperCase(), ...o })

  const wrongOrder = await api(`/api/mobile/orders/${order1}/iap`, { token, body: { signedTransaction: good({ appAccountToken: randomUUID() }) } })
  check('purchase tagged for another order rejected', wrongOrder.status === 400, wrongOrder.json.error)
  const wrongPlan = await api(`/api/mobile/orders/${order1}/iap`, { token, body: { signedTransaction: good({ productId: 'net.swipephotos.app.pro.monthly' }) } })
  check('plan mismatch rejected', wrongPlan.status === 400, wrongPlan.json.error)
  const expired = await api(`/api/mobile/orders/${order1}/iap`, { token, body: { signedTransaction: good({ expiresDate: Date.now() - 1000 }) } })
  check('expired subscription rejected', expired.status === 400, expired.json.error)
  const refunded = await api(`/api/mobile/orders/${order1}/iap`, { token, body: { signedTransaction: good({ revocationDate: Date.now() }) } })
  check('refunded purchase rejected', refunded.status === 400, refunded.json.error)
  const otherApp = await api(`/api/mobile/orders/${order1}/iap`, { token, body: { signedTransaction: good({ bundleId: 'com.evil.app' }) } })
  check('other app’s purchase rejected', otherApp.status === 400, otherApp.json.error)
  const forged = await api(`/api/mobile/orders/${order1}/iap`, { token, body: { signedTransaction: 'aaa.bbb.ccc' } })
  check('forged receipt rejected', forged.status === 400, forged.json.error)

  // The valid purchase. There are no photos, so generation fails AFTER the payment is recorded.
  const redeemed = await api(`/api/mobile/orders/${order1}/iap`, { token, body: { signedTransaction: good() } })
  check('valid purchase is recorded (generation then reports "no photos")', redeemed.status === 500 && /purchase went through/i.test(redeemed.json.error ?? ''), redeemed.json.error)
  const me1 = (await api('/api/mobile/me', { token })).json
  check('entitlement is now active (Apple / Premium)', me1.entitlement.active && me1.entitlement.source === 'apple' && me1.entitlement.planId === 'popular',
    JSON.stringify({ plan: me1.entitlement.planName, interval: me1.entitlement.interval, canStartSet: me1.entitlement.canStartSet }))

  const again = await api(`/api/mobile/orders/${order1}/iap`, { token, body: { signedTransaction: good() } })
  check('same transaction on the same order is idempotent', again.status === 200, JSON.stringify(again.json))

  const order2 = await newOrder()
  const replay = await api(`/api/mobile/orders/${order2}/iap`, { token, body: { signedTransaction: good({ appAccountToken: order2 }) } })
  check('same transaction reused on another order is blocked (replay)', replay.status === 409, replay.json.error)

  console.log('Subscriber flow')
  const subOrder = await api('/api/mobile/orders', { token, body: { mode: 'subscription' } })
  check('subscriber can create a covered order (no new payment)', subOrder.status === 200 && !!subOrder.json.orderId)
  const subStartWrongPlan = await api(`/api/mobile/orders/${order2}/start`, { token, method: 'POST', body: {} })
  check('/start refuses an order that doesn’t match the plan or has no photos set up', subStartWrongPlan.status >= 400, String(subStartWrongPlan.status))

  console.log('Restore / sync')
  const upgraded = tx({ originalTransactionId: orig, productId: 'net.swipephotos.app.pro.yearly', expiresDate: Date.now() + 365 * 86_400_000 })
  const sync = await api('/api/mobile/iap/sync', { token, body: { signedTransactions: [upgraded, 'garbage', good({ productId: 'net.swipephotos.app.premium.monthly' })] } })
  check('sync keeps the newest valid subscription and ignores junk', sync.status === 200 && sync.json.entitlement.planId === 'elite' && sync.json.entitlement.interval === 'year',
    `${sync.json.entitlement?.planName}/${sync.json.entitlement?.interval}`)
  const syncForged = await api('/api/mobile/iap/sync', { token, body: { signedTransactions: ['x.y.z'] } })
  check('sync with only forged data changes nothing', syncForged.status === 200 && syncForged.json.restored === false && syncForged.json.entitlement.planId === 'elite')

  console.log('App Store Server Notifications')
  const note = (type: string, txJws: string, extra: Json = {}) => signJWS(chain, {
    notificationType: type, data: { bundleId: BUNDLE, environment: 'Sandbox', signedTransactionInfo: txJws, ...extra },
  })
  const hook = (jws: string) => api('/api/webhooks/apple', { body: { signedPayload: jws } })

  const bad = await hook('aaa.bbb.ccc')
  check('forged notification rejected', bad.status === 400)
  const autoOff = await hook(note('DID_CHANGE_RENEWAL_STATUS', upgraded, { signedRenewalInfo: signJWS(chain, { autoRenewStatus: 0 }) }))
  check('auto-renew off is accepted', autoOff.status === 200)
  check('/me reflects auto-renew off (still active until period end)',
    (await api('/api/mobile/me', { token })).json.entitlement.willRenew === false)
  const renew = await hook(note('DID_RENEW', tx({ originalTransactionId: orig, productId: 'net.swipephotos.app.pro.yearly', expiresDate: Date.now() + 400 * 86_400_000 }), { signedRenewalInfo: signJWS(chain, { autoRenewStatus: 1 }) }))
  check('renewal extends the subscription', renew.status === 200 && (await api('/api/mobile/me', { token })).json.entitlement.willRenew === true)
  const refund = await hook(note('REFUND', upgraded))
  check('refund ends access immediately', refund.status === 200 && (await api('/api/mobile/me', { token })).json.entitlement.active === false)
  await api('/api/mobile/iap/sync', { token, body: { signedTransactions: [upgraded] } })
  const expire = await hook(note('EXPIRED', tx({ originalTransactionId: orig, productId: 'net.swipephotos.app.pro.yearly', expiresDate: Date.now() - 1000 })))
  check('expiry ends access', expire.status === 200 && (await api('/api/mobile/me', { token })).json.entitlement.active === false)
  const unknownUser = await hook(note('DID_RENEW', tx({ originalTransactionId: '999000999' })))
  check('notification for an unknown subscription is acknowledged (no retry storm)', unknownUser.status === 200)
} catch (e) {
  check('test run', false, String(e))
} finally {
  if (token) {
    const del = await api('/api/account/delete', { token, method: 'POST' })
    check('test account deleted', del.status === 200)
  }
  stop()
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
