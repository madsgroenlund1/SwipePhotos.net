import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const orderId = formData.get('orderId') as string
    const files = formData.getAll('files') as File[]

    if (!orderId || !files.length) {
      return NextResponse.json({ error: 'Missing orderId or files' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const uploadedUrls: string[] = []

    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const fileName = `${orderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

      const { error } = await supabase.storage
        .from('uploads')
        .upload(fileName, buffer, { contentType: file.type })

      if (error) {
        console.error('Upload error:', error)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName)

      await supabase.from('uploads').insert({ order_id: orderId, file_url: publicUrl })
      uploadedUrls.push(publicUrl)
    }

    return NextResponse.json({ urls: uploadedUrls })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
