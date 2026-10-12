import { createAdminClientDirect } from '@/lib/supabase/server'
import type { PlaySubscription } from '@/lib/google-play'

/** Stores a verified Google Play subscription on the user (one account per purchase token). */
export async function recordGoogleSubscription(userId: string, sub: PlaySubscription) {
  const admin = createAdminClientDirect()
  await admin
    .from('users')
    .update({ google_purchase_token: null, google_product_id: null, google_expires_at: null, google_auto_renew: null })
    .eq('google_purchase_token', sub.purchaseToken)
    .neq('id', userId)
  await admin
    .from('users')
    .update({
      google_purchase_token: sub.purchaseToken,
      google_product_id: sub.productId,
      google_expires_at: sub.active ? new Date(sub.expiresAt).toISOString() : new Date().toISOString(),
      google_auto_renew: sub.active ? sub.autoRenew : false,
    })
    .eq('id', userId)
}
