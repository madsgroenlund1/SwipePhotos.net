import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const SUPPORT_EMAIL = 'support@swipephotos.net'
const MAX_FILES = 3
const MAX_FILE_BYTES = 8_000_000   // 8 MB per file
const MAX_TOTAL_BYTES = 15_000_000 // 15 MB total (Resend limit is 40 MB)

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const email   = String(form.get('email') ?? '').trim()
    const subject = String(form.get('subject') ?? '').trim()
    const message = String(form.get('message') ?? '').trim()
    const files   = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)

    if (!email.includes('@')) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    if (!subject)             return NextResponse.json({ error: 'Please enter a subject.' }, { status: 400 })
    if (!message)             return NextResponse.json({ error: 'Please enter a message.' }, { status: 400 })
    if (files.length > MAX_FILES) return NextResponse.json({ error: `Maximum ${MAX_FILES} attachments.` }, { status: 400 })

    let total = 0
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) return NextResponse.json({ error: `"${f.name}" is too large — max 8 MB per file.` }, { status: 400 })
      total += f.size
    }
    if (total > MAX_TOTAL_BYTES) return NextResponse.json({ error: 'Attachments too large — max 15 MB in total.' }, { status: 400 })

    const attachments = await Promise.all(
      files.map(async f => ({
        filename: f.name.replace(/[^\w.\- ()]/g, '_').slice(0, 100),
        content: Buffer.from(await f.arrayBuffer()),
      }))
    )

    const resend = new Resend(process.env.RESEND_API_KEY!)
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    const { error } = await resend.emails.send({
      from: `SwipePhotos Contact <${from}>`,
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Contact] ${subject.slice(0, 150)}`,
      text: `From: ${email}\n\n${message}`,
      attachments: attachments.length ? attachments : undefined,
    })

    if (error) {
      console.error('[contact] Resend error:', error)
      return NextResponse.json({ error: 'Could not send your message. Please email us directly at support@swipephotos.net.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] Error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
