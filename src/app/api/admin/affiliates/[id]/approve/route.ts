import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendAffiliateApprovedEmail } from '@/lib/resend'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin-auth')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createAdminClient()

  const { data: aff } = await supabase
    .from('affiliates')
    .update({ status: 'approved' })
    .eq('id', id)
    .select('*, users(email, referral_code)')
    .single()

  if (aff?.users?.email && aff?.users?.referral_code) {
    await sendAffiliateApprovedEmail(aff.users.email, aff.users.referral_code).catch(console.error)
  }

  return NextResponse.json({ ok: true })
}
