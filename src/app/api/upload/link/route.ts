import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'

// Links ALREADY-uploaded photo URLs (from a previous order attempt on the
// same onboarding session — e.g. the customer clicked Stripe Checkout's back
// button and resumed at the package-picker step) to a NEW order, without
// re-uploading the raw files. Fixes a real bug where resuming created a
// brand-new order with zero uploads (the original File objects can't survive
// a page reload / localStorage), leaving the paid order permanently stuck in
// "processing" with no photos to generate from.
export async function POST(req: NextRequest) {
  try {
    const { orderId, urls } = await req.json()

    if (!orderId || !Array.isArray(urls) || !urls.length) {
      return NextResponse.json({ error: 'Missing orderId or urls' }, { status: 400 })
    }

    const supabase = createAdminClientDirect()
    const rows = urls
      .filter((u: unknown): u is string => typeof u === 'string' && u.length > 0)
      .map((file_url: string) => ({ order_id: orderId, file_url }))

    if (!rows.length) return NextResponse.json({ error: 'No valid urls' }, { status: 400 })

    const { error } = await supabase.from('uploads').insert(rows)
    if (error) {
      console.error('[upload/link] Insert error:', error)
      return NextResponse.json({ error: 'Failed to link uploads' }, { status: 500 })
    }

    console.log(`[upload/link] Linked ${rows.length} existing uploads to order ${orderId}`)
    return NextResponse.json({ ok: true, count: rows.length })
  } catch (err) {
    console.error('[upload/link] Error:', err)
    return NextResponse.json({ error: 'Failed to link uploads' }, { status: 500 })
  }
}
