import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: order } = await supabase
    .from('orders')
    .select('user_id, generated_photos(*)')
    .eq('id', id)
    .single()

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Return the list of photo URLs for client-side downloading
  return NextResponse.json({
    photos: order.generated_photos?.map((p: { file_url: string }) => p.file_url) || [],
  })
}
