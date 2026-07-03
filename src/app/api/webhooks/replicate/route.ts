import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Legacy Replicate webhook — pipeline has been replaced with FAL.AI face-swap.
// Return 200 to prevent Replicate retries if this URL is still registered.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: true })
}
