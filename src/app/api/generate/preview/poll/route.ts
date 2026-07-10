import { NextResponse } from 'next/server'

// This polling endpoint was used by a legacy InstantID/PuLID async flow.
// The current preview route (POST /api/generate/preview) returns face-swap
// results synchronously — polling is no longer needed.
export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is no longer active. Preview results are returned synchronously.' },
    { status: 410 }
  )
}
