import { currentUser } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { refCodeFromEmail } from '@/lib/utils'
import { uniqueRefCode } from '@/lib/referral'

export type DbUser = {
  id: string            // Supabase users.id (uuid) — the key everything else references
  email: string
  clerkId: string
  referral_code: string | null
  stripe_customer_id: string | null
  retention_offer_accepted_at: string | null
}

/**
 * Bridge between Clerk (authentication) and the Supabase database (data).
 *
 * Looks up the users row by the Clerk user's email, creating it on first
 * sign-in (with a username-based referral code and sw_ref affiliate
 * attribution). Existing customers keep their uuid — and with it their
 * orders, photos and affiliate history.
 *
 * Returns null when not signed in.
 */
export async function getDbUser(): Promise<DbUser | null> {
  const cu = await currentUser()
  if (!cu) return null

  const email = cu.primaryEmailAddress?.emailAddress
    ?? cu.emailAddresses[0]?.emailAddress
  if (!email) return null

  const admin = createAdminClientDirect()

  const { data: existing } = await admin
    .from('users')
    .select('id, email, referral_code, stripe_customer_id, retention_offer_accepted_at')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return { ...existing, clerkId: cu.id }
  }

  // First sign-in: public.users.id has an FK to auth.users(id), so create a
  // shadow Supabase auth user to obtain a valid uuid (Clerk owns the actual
  // login; the shadow user is never used to sign in).
  let uid: string | undefined
  const { data: authUser } = await admin.auth.admin.createUser({ email, email_confirm: true })
  uid = authUser?.user?.id
  if (!uid) {
    // Auth user already exists (legacy account) — recover its id via a link
    const { data: linkData } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
    uid = linkData?.user?.id
  }
  if (!uid) {
    console.error('[auth] Could not obtain a user id for', email)
    return null
  }

  // A DB trigger may have auto-created the users row on auth user insert
  const { data: existingRow } = await admin
    .from('users')
    .select('id, email, referral_code, stripe_customer_id, retention_offer_accepted_at')
    .eq('id', uid)
    .maybeSingle()

  let created = existingRow
  if (!created) {
    const refCode = await uniqueRefCode(admin, email, uid).catch(() => refCodeFromEmail(email))
    const { data: inserted, error } = await admin
      .from('users')
      .insert({ id: uid, email, referral_code: refCode })
      .select('id, email, referral_code, stripe_customer_id, retention_offer_accepted_at')
      .single()
    if (error || !inserted) {
      console.error('[auth] Could not create users row:', error?.message)
      return null
    }
    created = inserted
  } else if (!created.referral_code) {
    const refCode = await uniqueRefCode(admin, email, uid).catch(() => refCodeFromEmail(email))
    await admin.from('users').update({ referral_code: refCode }).eq('id', uid)
    created = { ...created, referral_code: refCode }
  }

  // Claim any orders placed with this email before signing up
  await admin.from('orders').update({ user_id: created.id }).eq('email', email).is('user_id', null)

  // Affiliate signup attribution via the sw_ref cookie (first-click wins)
  try {
    const jar = await cookies()
    const swRef = jar.get('sw_ref')?.value
    if (swRef) {
      const { data: refUser } = await admin
        .from('users').select('id').ilike('referral_code', swRef).maybeSingle()
      if (refUser?.id && refUser.id !== created.id) {
        const { data: aff } = await admin
          .from('affiliates').select('id').eq('user_id', refUser.id).eq('status', 'approved').maybeSingle()
        if (aff?.id) void admin.rpc('increment_affiliate_signups', { p_affiliate_id: aff.id })
      }
    }
  } catch { /* attribution is best-effort */ }

  console.log(`[auth] Created users row for ${email} (clerk ${cu.id})`)
  return { ...created, clerkId: cu.id }
}
