import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  void req
  const cookieStore = await cookies()
  if (cookieStore.get('admin-auth')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClientDirect()

  const { data, error } = await supabase
    .from('commissions')
    .update({ status: 'approved' })
    .eq('status', 'pending')
    .select('id')

  if (error) {
    console.error('[admin] approve-all commissions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, approved: data?.length ?? 0 })
}
