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

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"

// ─── Brand icon: S lettermark in blue gradient square ─────────────────────────
//
// Used as the hero visual in every email card.
// Built with pure inline HTML/CSS so it renders correctly in all email clients.
// `size` sets the square dimension; `radius` controls corner rounding.
//
function brandIcon(size = 72, radius = 20): string {
  const fontSize = Math.round(size * 0.42)
  return `
<table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 32px;border-collapse:collapse;">
  <tr>
    <td width="${size}" height="${size}" style="
      background:linear-gradient(145deg,#1e40af 0%,#2563eb 50%,#3b82f6 100%);
      border-radius:${radius}px;
      text-align:center;
      vertical-align:middle;
      font-family:${FONT};
      font-size:${fontSize}px;
      font-weight:800;
      color:#ffffff;
      letter-spacing:-1px;
    ">S</td>
  </tr>
</table>`
}

// ─── CTA button — table-based for maximum email-client compatibility ──────────
function ctaButton(href: string, label: string, style: 'primary' | 'secondary' = 'primary'): string {
  const bg = style === 'primary' ? '#2563eb' : '#1c1c1e'
  const border = style === 'secondary' ? 'border:1px solid rgba(255,255,255,0.12);' : ''
  return `
<table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;">
  <tr>
    <td style="background:${bg};border-radius:100px;${border}">
      <a href="${href}" style="
        display:block;
        font-family:${FONT};
        font-size:15px;
        font-weight:700;
        color:#ffffff;
        text-decoration:none;
        padding:15px 36px;
        white-space:nowrap;
        letter-spacing:-0.2px;
      ">${label}</a>
    </td>
  </tr>
</table>`
}

// ─── Divider ──────────────────────────────────────────────────────────────────
const divider = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;border-collapse:collapse;">
  <tr><td style="border-top:1px solid rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td></tr>
</table>`

// ─── Base layout ──────────────────────────────────────────────────────────────
//
// Dark branded shell consistent with swipephotos.net.
// max-width 560px — narrower than 600px feels more premium on mobile and desktop.
//
function baseLayout(content: string, footerNote = "You're receiving this because you placed an order.") {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>SwipePhotos.net</title>
</head>
<body style="margin:0;padding:0;background:#080808;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
  style="background:#080808;min-width:100%;">
  <tr>
    <td align="center" style="padding:44px 16px 48px;">

      <table width="560" cellpadding="0" cellspacing="0" border="0" role="presentation"
        style="max-width:560px;width:100%;">

        <!-- ── Logo ───────────────────────────────────────────── -->
        <tr>
          <td align="center" style="padding-bottom:36px;">
            <a href="${APP_URL}" style="text-decoration:none;">
              <span style="
                font-family:${FONT};
                font-size:21px;
                font-weight:700;
                color:#ffffff;
                letter-spacing:-0.5px;
              ">SwipePhotos<span style="color:#3b82f6;">.net</span></span>
            </a>
          </td>
        </tr>

        <!-- ── Card ───────────────────────────────────────────── -->
        <tr>
          <td style="
            background:#111111;
            border:1px solid rgba(255,255,255,0.08);
            border-radius:24px;
            padding:44px 40px 40px;
          ">
            ${content}
          </td>
        </tr>

        <!-- ── Footer ─────────────────────────────────────────── -->
        <tr>
          <td align="center" style="padding-top:32px;">
            <p style="margin:0 0 6px;font-family:${FONT};font-size:12px;color:#3f3f46;line-height:1.7;">
              <a href="${APP_URL}" style="color:#52525b;text-decoration:none;font-weight:600;">SwipePhotos.net</a>
              &nbsp;&middot;&nbsp;
              <a href="mailto:support@swipephotos.net" style="color:#52525b;text-decoration:none;">support@swipephotos.net</a>
            </p>
            <p style="margin:0;font-family:${FONT};font-size:11px;color:#27272a;line-height:1.6;">${footerNote}</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->

</body>
</html>`
}

// ─── 1. Order confirmed (sent immediately after Stripe payment) ───────────────

export async function sendWelcomeEmail(email: string, orderId: string) {
  const html = baseLayout(`

    ${brandIcon(68, 18)}

    <h1 style="margin:0 0 10px;font-family:${FONT};font-size:26px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:-0.5px;line-height:1.2;">
      Order confirmed!
    </h1>
    <p style="margin:0 0 36px;font-family:${FONT};font-size:15px;color:#a1a1aa;text-align:center;line-height:1.65;">
      AI is now generating your dating photos.<br />This usually takes 1–3 minutes.
    </p>

    <!-- Status steps -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;border-collapse:collapse;">

      <!-- Step 1 — active -->
      <tr>
        <td style="
          padding:14px 16px;
          background:#0d0d0d;
          border:1px solid rgba(255,255,255,0.07);
          border-bottom:none;
          border-radius:14px 14px 0 0;
        ">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;">
            <tr>
              <td width="28" style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td width="28" height="28" style="
                      background:#2563eb;
                      border-radius:50%;
                      text-align:center;
                      vertical-align:middle;
                      font-family:${FONT};
                      font-size:12px;
                      font-weight:700;
                      color:#ffffff;
                    ">1</td>
                  </tr>
                </table>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <div style="font-family:${FONT};font-size:13px;font-weight:600;color:#ffffff;margin-bottom:2px;">Placing your face into template photos</div>
                <div style="font-family:${FONT};font-size:12px;color:#6b7280;">AI face-swap across multiple professional scenes</div>
              </td>
              <td align="right" style="vertical-align:middle;white-space:nowrap;padding-left:12px;">
                <span style="
                  background:rgba(37,99,235,0.2);
                  color:#93c5fd;
                  font-family:${FONT};
                  font-size:10px;
                  font-weight:600;
                  padding:4px 10px;
                  border-radius:99px;
                  border:1px solid rgba(59,130,246,0.3);
                ">In progress</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Step 2 -->
      <tr>
        <td style="
          padding:14px 16px;
          background:#0d0d0d;
          border-left:1px solid rgba(255,255,255,0.07);
          border-right:1px solid rgba(255,255,255,0.07);
          border-bottom:none;
        ">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;">
            <tr>
              <td width="28" style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td width="28" height="28" style="
                      background:#1c1c1e;
                      border:1px solid rgba(255,255,255,0.1);
                      border-radius:50%;
                      text-align:center;
                      vertical-align:middle;
                      font-family:${FONT};
                      font-size:12px;
                      font-weight:700;
                      color:#52525b;
                    ">2</td>
                  </tr>
                </table>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <div style="font-family:${FONT};font-size:13px;font-weight:600;color:#52525b;margin-bottom:2px;">Quality review</div>
                <div style="font-family:${FONT};font-size:12px;color:#3f3f46;">Every photo checked before delivery</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Step 3 -->
      <tr>
        <td style="
          padding:14px 16px;
          background:#0d0d0d;
          border:1px solid rgba(255,255,255,0.07);
          border-top:none;
          border-radius:0 0 14px 14px;
        ">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;">
            <tr>
              <td width="28" style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td width="28" height="28" style="
                      background:#1c1c1e;
                      border:1px solid rgba(255,255,255,0.1);
                      border-radius:50%;
                      text-align:center;
                      vertical-align:middle;
                      font-family:${FONT};
                      font-size:12px;
                      font-weight:700;
                      color:#52525b;
                    ">3</td>
                  </tr>
                </table>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <div style="font-family:${FONT};font-size:13px;font-weight:600;color:#52525b;margin-bottom:2px;">Photos ready to download</div>
                <div style="font-family:${FONT};font-size:12px;color:#3f3f46;">You'll receive an email with a direct link</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>

    <p style="margin:0 0 28px;font-family:${FONT};font-size:14px;color:#52525b;text-align:center;line-height:1.6;">
      You can close this tab — we'll email you when they're done.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr><td align="center">${ctaButton(`${APP_URL}/dashboard`, 'Track Progress →')}</td></tr>
    </table>

    ${divider}

    <p style="margin:0;font-family:${FONT};font-size:11px;color:#3f3f46;text-align:center;">
      Order <span style="font-family:monospace;letter-spacing:0.5px;">${orderId.slice(-8).toUpperCase()}</span>
    </p>
  `)

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: 'Your AI photos are being generated',
    html,
  })
}

// ─── 2. Photos ready (sent when all jobs complete) ────────────────────────────

export async function sendReadyEmail(email: string, orderId: string, photoCount?: number) {
  const count = photoCount ?? 20

  const html = baseLayout(`

    ${brandIcon(68, 18)}

    <h1 style="margin:0 0 10px;font-family:${FONT};font-size:26px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:-0.5px;line-height:1.2;">
      Your photos are ready
    </h1>
    <p style="margin:0 0 36px;font-family:${FONT};font-size:15px;color:#a1a1aa;text-align:center;line-height:1.65;">
      ${count} AI photos are waiting in your dashboard.<br />Download and upload straight to your dating apps.
    </p>

    <!-- Photo count highlight -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;border-collapse:collapse;">
      <tr>
        <td style="
          background:#0d0d0d;
          border:1px solid rgba(59,130,246,0.2);
          border-radius:16px;
          padding:24px;
          text-align:center;
        ">
          <div style="font-family:${FONT};font-size:40px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1;">${count}</div>
          <div style="font-family:${FONT};font-size:13px;color:#3b82f6;font-weight:600;margin-top:6px;letter-spacing:0.5px;text-transform:uppercase;">photos generated</div>
          <div style="font-family:${FONT};font-size:12px;color:#52525b;margin-top:8px;">Restaurant &middot; Formal &middot; City &middot; Outdoor and more</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border-collapse:collapse;">
      <tr><td align="center">${ctaButton(`${APP_URL}/dashboard`, 'Download Your Photos →')}</td></tr>
    </table>

    <!-- Pro tip -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td style="
          background:#0d0d0d;
          border:1px solid rgba(255,255,255,0.06);
          border-radius:12px;
          padding:16px 18px;
        ">
          <p style="margin:0;font-family:${FONT};font-size:13px;color:#71717a;line-height:1.7;">
            <strong style="color:#ffffff;">Pro tip:</strong> Update your first Hinge photo first — it drives the most swipes. Users typically see results within 24 hours.
          </p>
        </td>
      </tr>
    </table>

    ${divider}

    <p style="margin:0;font-family:${FONT};font-size:11px;color:#3f3f46;text-align:center;">
      Order <span style="font-family:monospace;letter-spacing:0.5px;">${orderId.slice(-8).toUpperCase()}</span>
    </p>
  `)

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: `Your ${count} AI dating photos are ready`,
    html,
  })
}

// ─── 3. Generation failed (sent when all quality gates reject) ───────────────

export async function sendFailedEmail(email: string, orderId: string) {
  const html = baseLayout(`

    ${brandIcon(68, 18)}

    <h1 style="margin:0 0 10px;font-family:${FONT};font-size:26px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:-0.5px;line-height:1.2;">
      Something went wrong
    </h1>
    <p style="margin:0 0 36px;font-family:${FONT};font-size:15px;color:#a1a1aa;text-align:center;line-height:1.65;">
      We ran into an issue generating your photos.<br />Your payment is completely safe — we'll sort this out.
    </p>

    <!-- What we'll do -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;border-collapse:collapse;">
      <tr>
        <td style="
          background:#0d0d0d;
          border:1px solid rgba(239,68,68,0.2);
          border-radius:16px;
          padding:24px;
        ">
          <div style="font-family:${FONT};font-size:13px;color:#a1a1aa;line-height:1.8;text-align:center;">
            Our team has been notified and will either regenerate<br />your photos or issue a full refund — your choice.
          </div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border-collapse:collapse;">
      <tr><td align="center">${ctaButton('mailto:support@swipephotos.net?subject=Order%20${orderId.slice(-8).toUpperCase()}%20failed', 'Contact Support →', 'secondary')}</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr><td align="center">${ctaButton(`${APP_URL}/dashboard`, 'Go to Dashboard →', 'secondary')}</td></tr>
    </table>

    ${divider}

    <p style="margin:0;font-family:${FONT};font-size:11px;color:#3f3f46;text-align:center;">
      Order <span style="font-family:monospace;letter-spacing:0.5px;">${orderId.slice(-8).toUpperCase()}</span>
    </p>
  `)

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: 'Issue with your SwipePhotos order — we\'re on it',
    html,
  })
}

// ─── 4. Affiliate application received ───────────────────────────────────────

export async function sendAffiliateApplicationEmail(email: string, name: string) {
  const html = baseLayout(`

    ${brandIcon(68, 18)}

    <h1 style="margin:0 0 10px;font-family:${FONT};font-size:26px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:-0.5px;line-height:1.2;">
      Application received
    </h1>
    <p style="margin:0 0 36px;font-family:${FONT};font-size:15px;color:#a1a1aa;text-align:center;line-height:1.65;">
      Hi ${name} — we'll review your application within 1–2 business days and get back to you.
    </p>

    <!-- What happens next -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;border-collapse:collapse;">
      <tr>
        <td style="
          background:#0d0d0d;
          border:1px solid rgba(255,255,255,0.06);
          border-radius:16px;
          padding:24px;
        ">
          <div style="font-family:${FONT};font-size:11px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">What happens next</div>

          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:14px;">
            <tr>
              <td width="20" style="vertical-align:top;padding-top:2px;">
                <div style="width:6px;height:6px;background:#2563eb;border-radius:50%;margin-top:5px;"></div>
              </td>
              <td style="padding-left:10px;font-family:${FONT};font-size:13px;color:#a1a1aa;line-height:1.6;">
                We review your platform and audience fit
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:14px;">
            <tr>
              <td width="20" style="vertical-align:top;padding-top:2px;">
                <div style="width:6px;height:6px;background:#2563eb;border-radius:50%;margin-top:5px;"></div>
              </td>
              <td style="padding-left:10px;font-family:${FONT};font-size:13px;color:#a1a1aa;line-height:1.6;">
                You receive an approval email with your referral link
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td width="20" style="vertical-align:top;padding-top:2px;">
                <div style="width:6px;height:6px;background:#2563eb;border-radius:50%;margin-top:5px;"></div>
              </td>
              <td style="padding-left:10px;font-family:${FONT};font-size:13px;color:#a1a1aa;line-height:1.6;">
                Earn <strong style="color:#ffffff;">30% commission</strong> on every sale, paid monthly
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-family:${FONT};font-size:13px;color:#52525b;text-align:center;line-height:1.6;">
      Questions? Reply to this email anytime.
    </p>

  `, "You're receiving this because you applied to the SwipePhotos affiliate program.")

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: 'We received your affiliate application',
    html,
  })
}

// ─── 4. Affiliate approved ────────────────────────────────────────────────────

export async function sendAffiliateApprovedEmail(email: string, refCode: string) {
  const refLink = `${APP_URL}/?ref=${refCode}`

  const html = baseLayout(`

    ${brandIcon(68, 18)}

    <h1 style="margin:0 0 10px;font-family:${FONT};font-size:26px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:-0.5px;line-height:1.2;">
      You're approved!
    </h1>
    <p style="margin:0 0 36px;font-family:${FONT};font-size:15px;color:#a1a1aa;text-align:center;line-height:1.65;">
      Share your link. Earn <strong style="color:#ffffff;">30% commission</strong> on every sale.<br />Paid out monthly.
    </p>

    <!-- Referral link box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;border-collapse:collapse;">
      <tr>
        <td style="
          background:#0d0d0d;
          border:1px solid rgba(37,99,235,0.3);
          border-radius:16px;
          padding:20px 22px;
        ">
          <div style="font-family:${FONT};font-size:10px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Your referral link</div>
          <div style="font-family:monospace;font-size:13px;color:#3b82f6;word-break:break-all;line-height:1.5;">${refLink}</div>
        </td>
      </tr>
    </table>

    <!-- Stats highlights -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;border-collapse:collapse;">
      <tr>
        <td width="33%" style="padding:0 4px 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td style="background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 14px;text-align:center;">
                <div style="font-family:${FONT};font-size:22px;font-weight:700;color:#ffffff;">30%</div>
                <div style="font-family:${FONT};font-size:11px;color:#52525b;margin-top:4px;">Commission</div>
              </td>
            </tr>
          </table>
        </td>
        <td width="33%" style="padding:0 2px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td style="background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 14px;text-align:center;">
                <div style="font-family:${FONT};font-size:22px;font-weight:700;color:#ffffff;">$39</div>
                <div style="font-family:${FONT};font-size:11px;color:#52525b;margin-top:4px;">Avg. sale</div>
              </td>
            </tr>
          </table>
        </td>
        <td width="33%" style="padding:0 0 0 4px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td style="background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 14px;text-align:center;">
                <div style="font-family:${FONT};font-size:22px;font-weight:700;color:#ffffff;">$50</div>
                <div style="font-family:${FONT};font-size:11px;color:#52525b;margin-top:4px;">Min. payout</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr><td align="center">${ctaButton(`${APP_URL}/dashboard`, 'View Your Dashboard →')}</td></tr>
    </table>

  `, "You're receiving this because your SwipePhotos affiliate application was approved.")

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: "You're approved — start earning 30% commission",
    html,
  })
}
