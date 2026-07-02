import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { email } = await req.json()
  if (!email || !id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createAdminClient()
  await supabase.from('orders').update({ email }).eq('id', id)
  return NextResponse.json({ ok: true })
}
