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
    .select('metadata, referral_code')
    .single()

  const email = aff?.metadata?.email
  const refCode = aff?.referral_code || aff?.metadata?.slug

  if (email && refCode) {
    await sendAffiliateApprovedEmail(email, refCode).catch(console.error)
  }

  return NextResponse.json({ ok: true })
}
