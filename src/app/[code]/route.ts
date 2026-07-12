import { NextRequest, NextResponse } from 'next/server'
import { handleReferralRedirect, refCodeExists } from '@/lib/referral'

// Root-level referral short links: swipephotos.net/{code}
// Static routes always win over this dynamic segment, so only unmatched
// paths land here. Unknown codes fall through to a plain home redirect.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  // Only treat plausible referral codes as such; everything else → home
  if (!/^[a-zA-Z0-9]{3,40}$/.test(code) || !(await refCodeExists(code))) {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net')
  }

  return handleReferralRedirect(req, code)
}
