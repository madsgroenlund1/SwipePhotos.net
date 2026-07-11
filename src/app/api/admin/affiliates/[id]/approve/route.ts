import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { sendAffiliateApprovedEmail } from '@/lib/resend'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin-auth')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClientDirect()

  const { data: aff } = await supabase
    .from('affiliates')
    .update({ status: 'approved' })
    .eq('id', id)
    .select('user_id, metadata')
    .single()

  const email = aff?.metadata?.email
  const slug: string = aff?.metadata?.slug || ''

  // If affiliate has a linked user account, ensure they have a referral code
  let refCode = slug
  if (aff?.user_id) {
    const { data: userRow } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', aff.user_id)
      .single()

    if (userRow?.referral_code) {
      refCode = userRow.referral_code
    } else if (slug) {
      await supabase.from('users').update({ referral_code: slug }).eq('id', aff.user_id)
    }
  }

  if (email && refCode) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'
    const link = `${appUrl}/r/${refCode}`
    await sendAffiliateApprovedEmail(email, link).catch(console.error)
  }

  return NextResponse.json({ ok: true })
}
