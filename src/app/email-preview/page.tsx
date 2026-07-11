// DEV ONLY — email preview page (not linked from any nav)
export const dynamic = 'force-dynamic'

import {
  sendWelcomeEmail, sendReadyEmail, sendFailedEmail,
  sendCancellationEmail, sendOfferAcceptedEmail,
  sendAffiliateApplicationEmail, sendAffiliateApprovedEmail,
} from '@/lib/resend'

// Re-implement the HTML generation locally for preview (no Resend call)
import { NextResponse } from 'next/server'

// We render a static preview by calling the template functions via an
// inline approach — easiest is to just render an iframe list.
export default function EmailPreviewPage() {
  const emails = [
    { name: 'magic-link', path: '/email-preview/magic-link' },
    { name: 'order-confirmed', path: '/email-preview/order-confirmed' },
    { name: 'photos-ready', path: '/email-preview/photos-ready' },
    { name: 'failed', path: '/email-preview/failed' },
    { name: 'cancelled', path: '/email-preview/cancelled' },
    { name: 'offer-accepted', path: '/email-preview/offer-accepted' },
    { name: 'affiliate-application', path: '/email-preview/affiliate-application' },
    { name: 'affiliate-approved', path: '/email-preview/affiliate-approved' },
  ]

  return (
    <div style={{ background: '#080808', minHeight: '100vh', padding: '40px 24px', fontFamily: 'system-ui,sans-serif' }}>
      <h1 style={{ color: '#fff', fontSize: 22, marginBottom: 8 }}>Email Previews</h1>
      <p style={{ color: '#71717a', marginBottom: 32, fontSize: 14 }}>All SwipePhotos.net transactional email templates</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {emails.map(e => (
          <div key={e.name}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{e.name}</span>
              <a href={e.path} target="_blank" style={{ color: '#3b82f6', fontSize: 12, textDecoration: 'none' }}>open →</a>
            </div>
            <iframe
              src={e.path}
              style={{ width: '100%', height: 560, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
              title={e.name}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
