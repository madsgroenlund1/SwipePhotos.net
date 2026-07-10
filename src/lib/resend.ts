import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}

// Gmail addresses aren't valid Resend senders — fall back to the Resend sandbox address
const _configuredFrom = process.env.RESEND_FROM_EMAIL || ''
const FROM = _configuredFrom && !_configuredFrom.includes('@gmail.com')
  ? _configuredFrom
  : 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SwipePhotos.net</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0A0A0A;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- Logo -->
        <tr>
          <td style="padding-bottom:32px;" align="center">
            <span style="font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Swipe<span style="color:#3B82F6;">Photos</span>.net</span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px 40px 36px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:28px;text-align:center;color:#3f3f46;font-size:12px;line-height:1.8;">
            SwipePhotos.net — AI Dating Photos<br />
            Questions? Reply to this email or contact <a href="mailto:support@swipephotos.net" style="color:#52525b;text-decoration:none;">support@swipephotos.net</a><br />
            <span style="font-size:11px;color:#27272a;">You're receiving this because you placed an order.</span>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export async function sendWelcomeEmail(email: string, orderId: string) {
  const html = baseLayout(`
    <!-- Icon -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">📸</div>
    </td></tr></table>

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#fff;text-align:center;letter-spacing:-0.5px;">Your order is confirmed!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#71717a;text-align:center;line-height:1.6;">AI is now generating your professional dating photos. This takes about 1 minute.</p>

    <!-- Timeline -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="padding:14px 16px;background:#0A0A0A;border:1px solid rgba(255,255,255,0.06);border-radius:12px 12px 0 0;border-bottom:none;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:#1d4ed8;border-radius:50%;text-align:center;vertical-align:middle;font-size:14px;color:#fff;font-weight:700;">1</td>
            <td style="padding-left:12px;">
              <div style="color:#fff;font-size:14px;font-weight:600;">Swapping your face into model photos</div>
              <div style="color:#71717a;font-size:13px;margin-top:2px;">~1 minute — AI places your face into 21 professional scenes</div>
            </td>
            <td align="right"><span style="background:#1d4ed8;color:#93c5fd;font-size:11px;font-weight:600;padding:4px 10px;border-radius:99px;">In Progress</span></td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;background:#0A0A0A;border:1px solid rgba(255,255,255,0.06);border-radius:0;border-top:none;border-bottom:none;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:#27272a;border-radius:50%;text-align:center;vertical-align:middle;font-size:14px;color:#71717a;font-weight:700;">2</td>
            <td style="padding-left:12px;">
              <div style="color:#71717a;font-size:14px;font-weight:600;">Finishing touches</div>
              <div style="color:#3f3f46;font-size:13px;margin-top:2px;">Quality check on all 21 photos</div>
            </td>
            <td align="right"><span style="background:#27272a;color:#52525b;font-size:11px;font-weight:600;padding:4px 10px;border-radius:99px;">Up next</span></td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;background:#0A0A0A;border:1px solid rgba(255,255,255,0.06);border-radius:0 0 12px 12px;border-top:none;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:#27272a;border-radius:50%;text-align:center;vertical-align:middle;font-size:14px;color:#71717a;font-weight:700;">3</td>
            <td style="padding-left:12px;">
              <div style="color:#71717a;font-size:14px;font-weight:600;">Download your photos</div>
              <div style="color:#3f3f46;font-size:13px;margin-top:2px;">You'll get an email with a direct link</div>
            </td>
            <td align="right"><span style="background:#27272a;color:#52525b;font-size:11px;font-weight:600;padding:4px 10px;border-radius:99px;">Waiting</span></td>
          </tr></table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 28px;font-size:14px;color:#52525b;text-align:center;line-height:1.6;">You can close this tab — we'll email you as soon as your photos are ready.</p>

    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3B82F6;color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:9999px;text-decoration:none;letter-spacing:-0.2px;">
        Track Progress →
      </a>
    </td></tr></table>

    <p style="margin:24px 0 0;font-size:12px;color:#3f3f46;text-align:center;">Order ID: ${orderId}</p>
  `)

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: '📸 Your AI photos are being generated — ready in ~1 min',
    html,
  })
}

export async function sendReadyEmail(email: string, orderId: string, photoCount?: number) {
  const html = baseLayout(`
    <!-- Icon -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#059669,#3B82F6);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🎉</div>
    </td></tr></table>

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#fff;text-align:center;letter-spacing:-0.5px;">Your photos are ready!</h1>
    <p style="margin:0 0 32px;font-size:15px;color:#71717a;text-align:center;line-height:1.6;">Your AI-generated dating photos are waiting in your dashboard.</p>

    <!-- Preview placeholder -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr>
      <td style="background:linear-gradient(135deg,rgba(59,130,246,0.15),rgba(124,58,237,0.1));border:1px solid rgba(59,130,246,0.2);border-radius:16px;padding:28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">📷 📷 📷 📷</div>
        <div style="color:#93c5fd;font-size:15px;font-weight:600;">${photoCount ?? 37} photos generated</div>
        <div style="color:#52525b;font-size:13px;margin-top:4px;">Outdoor cafe · City street · Rooftop bar · Beach club · and more</div>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td align="center">
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3B82F6;color:#fff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:9999px;text-decoration:none;letter-spacing:-0.3px;">
        Download Your Photos →
      </a>
    </td></tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
      <td style="background:#0A0A0A;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
        <div style="color:#a1a1aa;font-size:13px;line-height:1.7;">
          💡 <strong style="color:#fff;">Pro tip:</strong> Upload directly to Hinge, Tinder or Bumble. Users who update with professional-style photos see an average <strong style="color:#3B82F6;">3x increase in matches</strong> within the first week.
        </div>
      </td>
    </tr></table>

    <p style="margin:24px 0 0;font-size:12px;color:#3f3f46;text-align:center;">Order ID: ${orderId}</p>
  `)

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: '🎉 Your dating photos are ready — download now!',
    html,
  })
}

export async function sendAffiliateApplicationEmail(email: string, name: string) {
  const html = baseLayout(`
    <!-- Icon -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#059669,#3B82F6);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">✅</div>
    </td></tr></table>

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#fff;text-align:center;letter-spacing:-0.5px;">Application received!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#71717a;text-align:center;line-height:1.6;">Hi ${name} — thanks for your interest in becoming a SwipePhotos affiliate.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr>
      <td style="background:#0A0A0A;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px 24px;">
        <p style="margin:0 0 12px;color:#a1a1aa;font-size:14px;line-height:1.7;">We'll review your application within <strong style="color:#fff;">1–2 business days</strong> and get back to you.</p>
        <p style="margin:0;color:#a1a1aa;font-size:14px;line-height:1.7;">Once approved, you'll earn <strong style="color:#f59e0b;">30% commission</strong> on every sale — paid out monthly.</p>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
      <td style="background:#0A0A0A;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
        <div style="color:#a1a1aa;font-size:13px;line-height:1.7;">
          💡 <strong style="color:#fff;">What happens next?</strong> We'll review your platform and audience. If you have any questions, feel free to reply to this email.
        </div>
      </td>
    </tr></table>
  `)

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: '✅ We received your affiliate application!',
    html,
  })
}

export async function sendAffiliateApprovedEmail(email: string, refCode: string) {
  const refLink = `${APP_URL}/?ref=${refCode}`

  const html = baseLayout(`
    <!-- Icon -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#d97706,#dc2626);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🚀</div>
    </td></tr></table>

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#fff;text-align:center;letter-spacing:-0.5px;">You're approved!</h1>
    <p style="margin:0 0 32px;font-size:15px;color:#71717a;text-align:center;line-height:1.6;">Start sharing and earn <strong style="color:#f59e0b;">30% commission</strong> on every sale. Paid out monthly.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr>
      <td style="background:#0A0A0A;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
        <div style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Your referral link</div>
        <div style="color:#3B82F6;font-size:14px;font-weight:600;word-break:break-all;">${refLink}</div>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${APP_URL}/affiliate" style="display:inline-block;background:#3B82F6;color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:9999px;text-decoration:none;">
        View Affiliate Dashboard →
      </a>
    </td></tr></table>
  `)

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: "🚀 You're approved as a SwipePhotos affiliate!",
    html,
  })
}
