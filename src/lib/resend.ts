import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}

const _configuredFrom = process.env.RESEND_FROM_EMAIL || ''
const FROM = _configuredFrom && !_configuredFrom.includes('@gmail.com')
  ? _configuredFrom
  : 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG        = '#080808'
const CARD      = '#111111'
const BORDER    = 'rgba(255,255,255,0.08)'
const BLUE      = '#2563eb'
const BLUE_SOFT = '#3b82f6'
const TEXT_PRI  = '#ffffff'
const TEXT_SEC  = '#a1a1aa'
const TEXT_MUT  = '#52525b'
const FONT      = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

// ─── S logo icon — blue circle matching the brand icon ────────────────────────
//
// Rendered as a table cell so it displays correctly in all email clients.
// A circle via border-radius:50% works in Gmail, Apple Mail, and most
// modern mobile clients (not Outlook, but the product targets mobile).
//
function brandLogo(size = 72): string {
  const fontSize = Math.round(size * 0.5)
  return `
<table cellpadding="0" cellspacing="0" border="0" align="center"
  style="margin:0 auto 28px;border-collapse:collapse;">
  <tr>
    <td width="${size}" height="${size}"
      style="
        background:linear-gradient(140deg,#2563eb 0%,#1d4ed8 100%);
        border-radius:50%;
        text-align:center;
        vertical-align:middle;
        font-family:${FONT};
        font-size:${fontSize}px;
        font-weight:800;
        color:#ffffff;
        letter-spacing:-1px;
        line-height:${size}px;
      "
    >S</td>
  </tr>
</table>`
}

// ─── CTA button ───────────────────────────────────────────────────────────────
function btn(href: string, label: string, style: 'primary' | 'ghost' = 'primary'): string {
  const bg      = style === 'primary' ? BLUE : 'transparent'
  const border  = style === 'primary' ? 'none' : `1px solid ${BORDER}`
  const color   = style === 'primary' ? '#ffffff' : TEXT_SEC
  const padding = '16px 36px'
  return `
<table cellpadding="0" cellspacing="0" border="0" align="center"
  style="border-collapse:collapse;margin:0 auto;">
  <tr>
    <td style="
      background:${bg};
      border-radius:100px;
      border:${border};
    ">
      <a href="${href}"
        style="
          display:block;
          font-family:${FONT};
          font-size:15px;
          font-weight:700;
          color:${color};
          text-decoration:none;
          padding:${padding};
          white-space:nowrap;
          letter-spacing:-0.1px;
          line-height:1;
        "
      >${label}</a>
    </td>
  </tr>
</table>`
}

// ─── Divider ──────────────────────────────────────────────────────────────────
const hr = `
<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="margin:24px 0;border-collapse:collapse;">
  <tr>
    <td style="
      border-top:1px solid rgba(255,255,255,0.06);
      font-size:0;line-height:0;
    ">&nbsp;</td>
  </tr>
</table>`

// ─── Info pill row ─────────────────────────────────────────────────────────────
function pills(items: string[]): string {
  return `
<p style="
  margin:0;
  font-family:${FONT};
  font-size:12px;
  color:${TEXT_MUT};
  text-align:center;
  line-height:1.8;
">${items.join(' &nbsp;·&nbsp; ')}</p>`
}

// ─── Fallback link block ───────────────────────────────────────────────────────
function fallback(href: string, label: string): string {
  return `
<p style="
  margin:20px 0 0;
  font-family:${FONT};
  font-size:12px;
  color:${TEXT_MUT};
  text-align:center;
  line-height:1.7;
">
  Or copy this link into your browser:<br />
  <a href="${href}" style="color:#3b82f6;word-break:break-all;text-decoration:none;">${href}</a>
</p>`
}

// ─── Base layout ──────────────────────────────────────────────────────────────
//
// bgcolor attributes are set on EVERY element so the dark background is
// preserved in Gmail (which strips CSS), Apple Mail on iPhone, and all
// other mobile clients that override stylesheets.
//
function base(content: string, footer = "You're receiving this because you have a SwipePhotos.net account."): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>SwipePhotos.net</title>
  <style>
    /* Force dark in Apple Mail dark mode */
    :root { color-scheme: dark; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { border: 0; outline: none; }
    /* Prevent Gmail from resizing tiny text */
    u + #body a { color: inherit; text-decoration: none; font-size: inherit; }
    @media only screen and (max-width: 600px) {
      .card { padding: 32px 24px !important; }
      .logo-cell { font-size: 19px !important; }
      .headline { font-size: 22px !important; }
    }
  </style>
</head>
<body id="body" bgcolor="${BG}" style="
  margin:0;padding:0;
  background-color:${BG};
  -webkit-text-size-adjust:100%;
  -ms-text-size-adjust:100%;
">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0"
  role="presentation" bgcolor="${BG}"
  style="background-color:${BG};min-width:100%;">
  <tr>
    <td align="center" bgcolor="${BG}"
      style="padding:44px 16px 52px;background-color:${BG};">

      <!-- Content column -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        role="presentation"
        style="max-width:520px;width:100%;">

        <!-- ── Wordmark ─────────────────────────────────────── -->
        <tr>
          <td align="center" bgcolor="${BG}"
            style="padding-bottom:32px;background-color:${BG};">
            <a href="${APP_URL}" style="text-decoration:none;">
              <span class="logo-cell" style="
                font-family:${FONT};
                font-size:20px;
                font-weight:700;
                color:${TEXT_PRI};
                letter-spacing:-0.5px;
              ">SwipePhotos<span style="color:${BLUE_SOFT};">.net</span></span>
            </a>
          </td>
        </tr>

        <!-- ── Card ────────────────────────────────────────── -->
        <tr>
          <td class="card" bgcolor="${CARD}"
            style="
              background-color:${CARD};
              border:1px solid ${BORDER};
              border-radius:24px;
              padding:48px 44px 44px;
            ">
            ${content}
          </td>
        </tr>

        <!-- ── Footer ──────────────────────────────────────── -->
        <tr>
          <td align="center" bgcolor="${BG}"
            style="padding-top:28px;background-color:${BG};">
            <p style="
              margin:0 0 6px;
              font-family:${FONT};
              font-size:12px;
              color:${TEXT_MUT};
              line-height:1.7;
            ">
              <a href="${APP_URL}" style="color:${TEXT_MUT};text-decoration:none;font-weight:600;">SwipePhotos.net</a>
              &nbsp;&middot;&nbsp;
              <a href="mailto:support@swipephotos.net" style="color:${TEXT_MUT};text-decoration:none;">support@swipephotos.net</a>
            </p>
            <p style="
              margin:0;
              font-family:${FONT};
              font-size:11px;
              color:#3f3f46;
              line-height:1.6;
            ">${footer}</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`
}

// ─── 1. Order confirmed ───────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, orderId: string) {
  const html = base(`

    ${brandLogo(68)}

    <h1 class="headline" style="
      margin:0 0 12px;
      font-family:${FONT};
      font-size:26px;
      font-weight:700;
      color:${TEXT_PRI};
      text-align:center;
      letter-spacing:-0.5px;
      line-height:1.2;
    ">Order confirmed!</h1>

    <p style="
      margin:0 0 36px;
      font-family:${FONT};
      font-size:15px;
      color:${TEXT_SEC};
      text-align:center;
      line-height:1.65;
    ">AI is now generating your dating photos.<br />This usually takes 1–3 minutes.</p>

    <!-- Status steps -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;margin-bottom:36px;">

      <!-- Step 1 — active -->
      <tr>
        <td style="
          padding:14px 16px;
          background-color:#0d0d0d;
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
                      background-color:${BLUE};
                      border-radius:50%;
                      text-align:center;
                      vertical-align:middle;
                      font-family:${FONT};
                      font-size:12px;
                      font-weight:700;
                      color:#ffffff;
                      line-height:28px;
                    ">1</td>
                  </tr>
                </table>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <div style="font-family:${FONT};font-size:13px;font-weight:600;color:${TEXT_PRI};margin-bottom:2px;">Generating your photos</div>
                <div style="font-family:${FONT};font-size:12px;color:#6b7280;">AI face-swap across professional templates</div>
              </td>
              <td align="right" style="vertical-align:middle;white-space:nowrap;padding-left:12px;">
                <span style="
                  background-color:rgba(37,99,235,0.15);
                  color:#93c5fd;
                  font-family:${FONT};
                  font-size:10px;
                  font-weight:600;
                  padding:4px 10px;
                  border-radius:99px;
                  border:1px solid rgba(59,130,246,0.25);
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
          background-color:#0d0d0d;
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
                      background-color:#1c1c1e;
                      border:1px solid rgba(255,255,255,0.08);
                      border-radius:50%;
                      text-align:center;
                      vertical-align:middle;
                      font-family:${FONT};
                      font-size:12px;
                      font-weight:700;
                      color:#52525b;
                      line-height:26px;
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
          background-color:#0d0d0d;
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
                      background-color:#1c1c1e;
                      border:1px solid rgba(255,255,255,0.08);
                      border-radius:50%;
                      text-align:center;
                      vertical-align:middle;
                      font-family:${FONT};
                      font-size:12px;
                      font-weight:700;
                      color:#52525b;
                      line-height:26px;
                    ">3</td>
                  </tr>
                </table>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <div style="font-family:${FONT};font-size:13px;font-weight:600;color:#52525b;margin-bottom:2px;">Ready to download</div>
                <div style="font-family:${FONT};font-size:12px;color:#3f3f46;">You&rsquo;ll get an email with a direct link</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:24px;">
      <tr><td align="center">${btn(`${APP_URL}/dashboard`, 'Track Progress →')}</td></tr>
    </table>

    ${hr}

    ${pills([`Order #${orderId.slice(-8).toUpperCase()}`, 'You can close this tab — we&rsquo;ll email you when ready'])}

  `, "You're receiving this because you placed an order on SwipePhotos.net.")

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: 'Your AI photos are being generated',
    html,
  })
}

// ─── 2. Photos ready ──────────────────────────────────────────────────────────

export async function sendReadyEmail(email: string, orderId: string, photoCount?: number) {
  const count = photoCount ?? 20

  const html = base(`

    ${brandLogo(68)}

    <h1 class="headline" style="
      margin:0 0 12px;
      font-family:${FONT};
      font-size:26px;
      font-weight:700;
      color:${TEXT_PRI};
      text-align:center;
      letter-spacing:-0.5px;
      line-height:1.2;
    ">Your photos are ready</h1>

    <p style="
      margin:0 0 32px;
      font-family:${FONT};
      font-size:15px;
      color:${TEXT_SEC};
      text-align:center;
      line-height:1.65;
    ">${count} AI photos are waiting in your dashboard.<br />Upload straight to Hinge, Tinder, or Bumble.</p>

    <!-- Photo count highlight -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;margin-bottom:32px;">
      <tr>
        <td style="
          background-color:#0d0d0d;
          border:1px solid rgba(59,130,246,0.18);
          border-radius:16px;
          padding:28px 24px;
          text-align:center;
        ">
          <div style="
            font-family:${FONT};
            font-size:48px;
            font-weight:800;
            color:${TEXT_PRI};
            letter-spacing:-3px;
            line-height:1;
            margin-bottom:8px;
          ">${count}</div>
          <div style="
            font-family:${FONT};
            font-size:12px;
            color:${BLUE_SOFT};
            font-weight:600;
            letter-spacing:1px;
            text-transform:uppercase;
            margin-bottom:8px;
          ">photos generated</div>
          <div style="
            font-family:${FONT};
            font-size:12px;
            color:${TEXT_MUT};
          ">Restaurant &middot; Formal &middot; City &middot; Outdoor &amp; more</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;margin-bottom:28px;">
      <tr><td align="center">${btn(`${APP_URL}/dashboard`, 'Download Your Photos →')}</td></tr>
    </table>

    <!-- Pro tip -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;">
      <tr>
        <td style="
          background-color:#0d0d0d;
          border:1px solid rgba(255,255,255,0.06);
          border-radius:12px;
          padding:16px 18px;
        ">
          <p style="
            margin:0;
            font-family:${FONT};
            font-size:13px;
            color:#71717a;
            line-height:1.7;
          ">
            <strong style="color:${TEXT_PRI};">Pro tip:</strong> Update your first Hinge photo first — it drives the most swipes. Users typically see results within 24&nbsp;hours.
          </p>
        </td>
      </tr>
    </table>

    ${hr}

    ${pills([`Order #${orderId.slice(-8).toUpperCase()}`])}

  `, "You're receiving this because you placed an order on SwipePhotos.net.")

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: `Your ${count} AI dating photos are ready`,
    html,
  })
}

// ─── 3. Generation failed ─────────────────────────────────────────────────────

export async function sendFailedEmail(email: string, orderId: string) {
  const html = base(`

    ${brandLogo(68)}

    <h1 class="headline" style="
      margin:0 0 12px;
      font-family:${FONT};
      font-size:26px;
      font-weight:700;
      color:${TEXT_PRI};
      text-align:center;
      letter-spacing:-0.5px;
      line-height:1.2;
    ">Something went wrong</h1>

    <p style="
      margin:0 0 32px;
      font-family:${FONT};
      font-size:15px;
      color:${TEXT_SEC};
      text-align:center;
      line-height:1.65;
    ">We ran into an issue generating your photos.<br />Your payment is completely safe.</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;margin-bottom:32px;">
      <tr>
        <td style="
          background-color:#0d0d0d;
          border:1px solid rgba(239,68,68,0.18);
          border-radius:16px;
          padding:24px;
          text-align:center;
        ">
          <p style="
            margin:0;
            font-family:${FONT};
            font-size:14px;
            color:${TEXT_SEC};
            line-height:1.8;
          ">
            Our team has been notified and will either<br />
            regenerate your photos or issue a full refund.
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;margin-bottom:12px;">
      <tr>
        <td align="center">
          ${btn(`mailto:support@swipephotos.net?subject=Order%20${orderId.slice(-8).toUpperCase()}%20failed`, 'Contact Support →', 'ghost')}
        </td>
      </tr>
    </table>

    ${hr}

    ${pills([`Order #${orderId.slice(-8).toUpperCase()}`])}

  `, "You're receiving this because you placed an order on SwipePhotos.net.")

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: "Issue with your SwipePhotos order — we're on it",
    html,
  })
}

// ─── 4. Subscription cancelled ───────────────────────────────────────────────

export async function sendCancellationEmail(
  email: string,
  { periodEnd, reason }: { periodEnd: Date; reason: string | null }
) {
  const endStr = periodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const html = base(`

    ${brandLogo(68)}

    <h1 class="headline" style="
      margin:0 0 12px;
      font-family:${FONT};
      font-size:26px;
      font-weight:700;
      color:${TEXT_PRI};
      text-align:center;
      letter-spacing:-0.5px;
      line-height:1.2;
    ">Subscription cancelled</h1>

    <p style="
      margin:0 0 32px;
      font-family:${FONT};
      font-size:15px;
      color:${TEXT_SEC};
      text-align:center;
      line-height:1.65;
    ">
      You&rsquo;ll keep full access until<br />
      <strong style="color:${TEXT_PRI};">${endStr}</strong>.<br />
      No more charges after that date.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;margin-bottom:32px;">
      <tr>
        <td style="
          background-color:#0d0d0d;
          border:1px solid rgba(255,255,255,0.06);
          border-radius:16px;
          padding:20px 22px;
          text-align:center;
        ">
          <p style="
            margin:0;
            font-family:${FONT};
            font-size:13px;
            color:${TEXT_SEC};
            line-height:1.8;
          ">
            Your photos and dashboard remain accessible.<br />
            You can reactivate your plan anytime.
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;">
      <tr>
        <td align="center">
          ${btn(`${APP_URL}/dashboard?tab=account`, 'Reactivate Plan →', 'ghost')}
        </td>
      </tr>
    </table>

    ${reason ? `${hr}${pills([`Reason: ${reason}`])}` : ''}

  `, "You're receiving this because you cancelled your SwipePhotos.net subscription.")

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: `Subscription cancelled — access until ${endStr}`,
    html,
  })
}

// ─── 5. Retention offer accepted ─────────────────────────────────────────────

export async function sendOfferAcceptedEmail(
  email: string,
  { offerType, interval }: { offerType: string; interval: 'month' | 'year' }
) {
  const headline = offerType === 'free_month' ? 'Your next month is free' : '50% off your next renewal'
  const body = offerType === 'free_month'
    ? 'We&rsquo;ve applied 100% off to your next billing cycle. You won&rsquo;t be charged anything next month.'
    : 'We&rsquo;ve applied 50% off to your next renewal. The discount will be applied automatically.'
  const subject = offerType === 'free_month'
    ? 'Your next month is on us'
    : '50% off your next renewal — confirmed'

  const html = base(`

    ${brandLogo(68)}

    <h1 class="headline" style="
      margin:0 0 12px;
      font-family:${FONT};
      font-size:26px;
      font-weight:700;
      color:${TEXT_PRI};
      text-align:center;
      letter-spacing:-0.5px;
      line-height:1.2;
    ">${headline}</h1>

    <p style="
      margin:0 0 32px;
      font-family:${FONT};
      font-size:15px;
      color:${TEXT_SEC};
      text-align:center;
      line-height:1.65;
    ">${body}</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;margin-bottom:32px;">
      <tr>
        <td style="
          background-color:#0d0d0d;
          border:1px solid rgba(37,99,235,0.18);
          border-radius:16px;
          padding:20px 24px;
          text-align:center;
        ">
          <p style="
            margin:0;
            font-family:${FONT};
            font-size:13px;
            color:${TEXT_SEC};
            line-height:1.8;
          ">
            Your subscription continues without interruption.<br />
            Keep getting fresh AI photos every ${interval === 'month' ? 'month' : 'year'}.
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;">
      <tr><td align="center">${btn(`${APP_URL}/dashboard`, 'Go to Dashboard →')}</td></tr>
    </table>

  `, "You're receiving this because you accepted a SwipePhotos.net retention offer.")

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject,
    html,
  })
}

// ─── 6. Affiliate application received ───────────────────────────────────────

export async function sendAffiliateApplicationEmail(email: string, name: string) {
  const html = base(`

    ${brandLogo(68)}

    <h1 class="headline" style="
      margin:0 0 12px;
      font-family:${FONT};
      font-size:26px;
      font-weight:700;
      color:${TEXT_PRI};
      text-align:center;
      letter-spacing:-0.5px;
      line-height:1.2;
    ">Application received</h1>

    <p style="
      margin:0 0 32px;
      font-family:${FONT};
      font-size:15px;
      color:${TEXT_SEC};
      text-align:center;
      line-height:1.65;
    ">Hi ${name} — we&rsquo;ll review your application within 1–2 business&nbsp;days.</p>

    <!-- What happens next -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;margin-bottom:32px;">
      <tr>
        <td style="
          background-color:#0d0d0d;
          border:1px solid rgba(255,255,255,0.06);
          border-radius:16px;
          padding:24px 22px;
        ">
          <div style="
            font-family:${FONT};
            font-size:10px;
            font-weight:600;
            color:${TEXT_MUT};
            text-transform:uppercase;
            letter-spacing:1px;
            margin-bottom:16px;
          ">What happens next</div>

          ${[
            'We review your platform and audience fit',
            'You receive an approval email with your referral link',
            `Earn <strong style="color:${TEXT_PRI};">30% commission</strong> on every sale, paid monthly`,
          ].map(text => `
          <table cellpadding="0" cellspacing="0" border="0" width="100%"
            style="border-collapse:collapse;margin-bottom:12px;">
            <tr>
              <td width="20" style="vertical-align:top;padding-top:4px;">
                <div style="
                  width:6px;height:6px;
                  background-color:${BLUE};
                  border-radius:50%;
                "></div>
              </td>
              <td style="
                padding-left:10px;
                font-family:${FONT};
                font-size:13px;
                color:${TEXT_SEC};
                line-height:1.6;
              ">${text}</td>
            </tr>
          </table>`).join('')}
        </td>
      </tr>
    </table>

    <p style="
      margin:0;
      font-family:${FONT};
      font-size:13px;
      color:${TEXT_MUT};
      text-align:center;
      line-height:1.6;
    ">Questions? Reply to this email anytime.</p>

  `, "You're receiving this because you applied to the SwipePhotos.net affiliate program.")

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: 'We received your affiliate application',
    html,
  })
}

// ─── 7. Affiliate approved ────────────────────────────────────────────────────

export async function sendAffiliateApprovedEmail(email: string, refLink: string) {
  const html = base(`

    ${brandLogo(68)}

    <h1 class="headline" style="
      margin:0 0 12px;
      font-family:${FONT};
      font-size:26px;
      font-weight:700;
      color:${TEXT_PRI};
      text-align:center;
      letter-spacing:-0.5px;
      line-height:1.2;
    ">You&rsquo;re approved!</h1>

    <p style="
      margin:0 0 32px;
      font-family:${FONT};
      font-size:15px;
      color:${TEXT_SEC};
      text-align:center;
      line-height:1.65;
    ">Share your link. Earn <strong style="color:${TEXT_PRI};">30% commission</strong> on every sale. Paid monthly.</p>

    <!-- Referral link -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;margin-bottom:28px;">
      <tr>
        <td style="
          background-color:#0d0d0d;
          border:1px solid rgba(37,99,235,0.25);
          border-radius:16px;
          padding:20px 22px;
        ">
          <div style="
            font-family:${FONT};
            font-size:10px;
            font-weight:600;
            color:${TEXT_MUT};
            text-transform:uppercase;
            letter-spacing:1px;
            margin-bottom:8px;
          ">Your referral link</div>
          <div style="
            font-family:monospace;
            font-size:13px;
            color:${BLUE_SOFT};
            word-break:break-all;
            line-height:1.5;
          ">${refLink}</div>
        </td>
      </tr>
    </table>

    <!-- Stats 3-column -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;margin-bottom:32px;">
      <tr>
        ${[['30%','Commission'],['$39','Avg. sale'],['$50','Min. payout']].map(([val, label], i) => `
        <td width="33%" style="padding:${i === 0 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 2px'};">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td style="
                background-color:#0d0d0d;
                border:1px solid rgba(255,255,255,0.06);
                border-radius:12px;
                padding:16px 12px;
                text-align:center;
              ">
                <div style="font-family:${FONT};font-size:22px;font-weight:700;color:${TEXT_PRI};letter-spacing:-0.5px;">${val}</div>
                <div style="font-family:${FONT};font-size:11px;color:${TEXT_MUT};margin-top:4px;">${label}</div>
              </td>
            </tr>
          </table>
        </td>`).join('')}
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse;">
      <tr><td align="center">${btn(`${APP_URL}/dashboard`, 'View Dashboard →')}</td></tr>
    </table>

  `, "You're receiving this because your SwipePhotos.net affiliate application was approved.")

  await getResend().emails.send({
    from: `SwipePhotos.net <${FROM}>`,
    to: email,
    subject: "You're approved — start earning 30% commission",
    html,
  })
}
