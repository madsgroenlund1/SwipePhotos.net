import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'

// Allow large photo uploads (iPhone photos can be 8MB+)
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const orderId = formData.get('orderId') as string
    const files = formData.getAll('files') as File[]

    if (!orderId || !files.length) {
      return NextResponse.json({ error: 'Missing orderId or files' }, { status: 400 })
    }

    const supabase = createAdminClientDirect()
    const uploadedUrls: string[] = []

    for (const file of files) {
      console.log('[upload] file:', file.name, 'size:', file.size, 'type:', file.type)

      if (file.size === 0) {
        console.warn('[upload] Skipping 0-byte file:', file.name)
        continue
      }

      const buffer = await file.arrayBuffer()
      const fileName = `${orderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

      const { error } = await supabase.storage
        .from('uploads')
        .upload(fileName, buffer, { contentType: file.type || 'image/jpeg', upsert: true })

      if (error) {
        console.error('[upload] Storage error:', error)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName)
      await supabase.from('uploads').insert({ order_id: orderId, file_url: publicUrl })
      uploadedUrls.push(publicUrl)
      console.log('[upload] Uploaded:', publicUrl)
    }

    console.log('[upload] Done, uploaded', uploadedUrls.length, 'files for order', orderId)
    return NextResponse.json({ urls: uploadedUrls })
  } catch (err) {
    console.error('[upload] Error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
