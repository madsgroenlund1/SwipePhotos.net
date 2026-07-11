import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { processOrderJobs } from '@/lib/job-processor'

export const runtime    = 'nodejs'
export const maxDuration = 60

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params
  const supabase        = createAdminClientDirect()
  const result          = await processOrderJobs(orderId, supabase)
  return NextResponse.json(result)
}
