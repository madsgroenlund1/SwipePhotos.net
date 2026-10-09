import { createAdminClientDirect } from '@/lib/supabase/server'
import type { AppleTransaction } from '@/lib/apple-iap'

/**
 * Stores a verified Apple subscription transaction on the user. A subscription
 * belongs to the Apple ID, so if another account already held it, that account
 * loses it (prevents two accounts sharing one subscription forever).
 */
export async function recordAppleSubscription(userId: string, tx: AppleTransaction, autoRenew = true) {
  const admin = createAdminClientDirect()
  await admin
    .from('users')
    .update({
      apple_original_transaction_id: null,
      apple_product_id: null,
      apple_expires_at: null,
      apple_auto_renew: null,
    })
    .eq('apple_original_transaction_id', tx.originalTransactionId)
    .neq('id', userId)

  const revoked = !!tx.revocationDate
  await admin
    .from('users')
    .update({
      apple_original_transaction_id: tx.originalTransactionId,
      apple_product_id: tx.productId,
      apple_expires_at: revoked
        ? new Date().toISOString()
        : tx.expiresDate ? new Date(tx.expiresDate).toISOString() : null,
      apple_auto_renew: revoked ? false : autoRenew,
      apple_environment: tx.environment ?? null,
    })
    .eq('id', userId)
}
