import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
import { createAdminClientDirect } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'
import { trainModel } from '@/lib/replicate'

// Admin endpoint to manually trigger training for a pending order
export async function POST(req: NextRequest) {
  const adminPassword = req.headers.get('x-admin-password')
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const supabase = createAdminClientDirect()

  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const { data: uploads } = await supabase.from('uploads').select('file_url').eq('order_id', orderId)
  if (!uploads?.length) return NextResponse.json({ error: 'No uploads' }, { status: 400 })

  const imageUrls = uploads.map((u: { file_url: string }) => u.file_url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'
  const email = order.email || ''
  const webhookUrl = `${appUrl}/api/webhooks/replicate?orderId=${orderId}&email=${encodeURIComponent(email)}`

  await supabase.from('orders').update({ status: 'training' }).eq('id', orderId)
  if (email) await sendWelcomeEmail(email, orderId).catch(console.error)

  const training = await trainModel(imageUrls, orderId, webhookUrl)
  await supabase.from('orders').update({ replicate_training_id: training.id }).eq('id', orderId)

  return NextResponse.json({ ok: true, trainingId: training.id, email, imageCount: imageUrls.length })
}
