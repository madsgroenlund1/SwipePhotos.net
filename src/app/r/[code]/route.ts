import { NextRequest } from 'next/server'
import { handleReferralRedirect } from '@/lib/referral'

// Legacy referral links: /r/CODE (new links are swipephotos.net/CODE)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  return handleReferralRedirect(req, code)
}
