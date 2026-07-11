import { NextRequest, NextResponse } from 'next/server'

const APP_URL = 'https://swipephotos.net'
const BLUE = '#2563eb'
const BLUE_SOFT = '#3b82f6'
const BG = '#080808'
const CARD = '#111111'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT_PRI = '#ffffff'
const TEXT_SEC = '#a1a1aa'
const TEXT_MUT = '#52525b'
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

function logo(size = 68) {
  const fs = Math.round(size * 0.5)
  return `<table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;border-collapse:collapse;"><tr><td width="${size}" height="${size}" style="background:linear-gradient(140deg,#2563eb 0%,#1d4ed8 100%);border-radius:50%;text-align:center;vertical-align:middle;font-family:${FONT};font-size:${fs}px;font-weight:800;color:#fff;line-height:${size}px;">S</td></tr></table>`
}

function btn(href: string, label: string) {
  return `<table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin:0 auto;"><tr><td style="background-color:${BLUE};border-radius:100px;"><a href="${href}" style="display:block;font-family:${FONT};font-size:15px;font-weight:700;color:#fff;text-decoration:none;padding:16px 44px;white-space:nowrap;line-height:1;">  ${label}</a></td></tr></table>`
}

const hr = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-collapse:collapse;"><tr><td style="border-top:1px solid rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td></tr></table>`

function base(content: string, footer = "You're receiving this because you have a SwipePhotos.net account.") {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><meta name="color-scheme" content="dark"/><title>SwipePhotos.net</title><style>:root{color-scheme:dark;}body,table,td,a{-webkit-text-size-adjust:100%;}@media only screen and (max-width:600px){.card{padding:32px 24px!important;}.headline{font-size:22px!important;}}</style></head><body id="body" bgcolor="${BG}" style="margin:0;padding:0;background-color:${BG};"><table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BG}" style="background-color:${BG};min-width:100%;"><tr><td align="center" bgcolor="${BG}" style="padding:44px 16px 52px;background-color:${BG};"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;"><tr><td align="center" bgcolor="${BG}" style="padding-bottom:32px;background-color:${BG};"><a href="${APP_URL}" style="text-decoration:none;"><span style="font-family:${FONT};font-size:20px;font-weight:700;color:${TEXT_PRI};letter-spacing:-0.5px;">SwipePhotos<span style="color:${BLUE_SOFT};">.net</span></span></a></td></tr><tr><td class="card" bgcolor="${CARD}" style="background-color:${CARD};border:1px solid ${BORDER};border-radius:24px;padding:48px 44px 44px;">${content}</td></tr><tr><td align="center" bgcolor="${BG}" style="padding-top:28px;background-color:${BG};"><p style="margin:0 0 6px;font-family:${FONT};font-size:12px;color:${TEXT_MUT};line-height:1.7;"><a href="${APP_URL}" style="color:${TEXT_MUT};text-decoration:none;font-weight:600;">SwipePhotos.net</a>&nbsp;&middot;&nbsp;<a href="mailto:support@swipephotos.net" style="color:${TEXT_MUT};text-decoration:none;">support@swipephotos.net</a></p><p style="margin:0;font-family:${FONT};font-size:11px;color:#3f3f46;line-height:1.6;">${footer}</p></td></tr></table></td></tr></table></body></html>`
}

function h1(text: string) {
  return `<h1 class="headline" style="margin:0 0 12px;font-family:${FONT};font-size:26px;font-weight:700;color:${TEXT_PRI};text-align:center;letter-spacing:-0.5px;line-height:1.2;">${text}</h1>`
}
function p(text: string, mb = 36) {
  return `<p style="margin:0 0 ${mb}px;font-family:${FONT};font-size:15px;color:${TEXT_SEC};text-align:center;line-height:1.65;">${text}</p>`
}

const TEMPLATES: Record<string, string> = {
  'magic-link': base(
    `${logo()}${h1('Sign in to SwipePhotos')}${p('Click the button below to sign in.<br/>This link expires in 1 hour.')}<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:28px;"><tr><td align="center">${btn('#', 'Sign in →')}</td></tr></table>${hr}<p style="margin:0;font-family:${FONT};font-size:12px;color:${TEXT_MUT};text-align:center;line-height:1.7;">Button not working? Copy this link into your browser:<br/><a href="#" style="color:${BLUE_SOFT};word-break:break-all;text-decoration:none;">https://swipephotos.net/auth/callback?token=example123</a></p>`,
    "If you didn't request this email, you can safely ignore it."
  ),

  'order-confirmed': base(
    `${logo()}${h1('Order confirmed!')}${p('AI is now generating your dating photos.<br/>This usually takes 1–3 minutes.')}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:36px;">
      <tr><td style="padding:14px 16px;background-color:#0d0d0d;border:1px solid rgba(255,255,255,0.07);border-bottom:none;border-radius:14px 14px 0 0;">
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;"><tr>
          <td width="28" style="vertical-align:middle;"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td width="28" height="28" style="background-color:${BLUE};border-radius:50%;text-align:center;vertical-align:middle;font-family:${FONT};font-size:12px;font-weight:700;color:#fff;line-height:28px;">1</td></tr></table></td>
          <td style="padding-left:12px;vertical-align:middle;"><div style="font-family:${FONT};font-size:13px;font-weight:600;color:${TEXT_PRI};margin-bottom:2px;">Generating your photos</div><div style="font-family:${FONT};font-size:12px;color:#6b7280;">AI face-swap across professional templates</div></td>
          <td align="right" style="vertical-align:middle;white-space:nowrap;padding-left:12px;"><span style="background-color:rgba(37,99,235,0.15);color:#93c5fd;font-family:${FONT};font-size:10px;font-weight:600;padding:4px 10px;border-radius:99px;border:1px solid rgba(59,130,246,0.25);">In progress</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:14px 16px;background-color:#0d0d0d;border-left:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07);border-bottom:none;">
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;"><tr>
          <td width="28" style="vertical-align:middle;"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td width="28" height="28" style="background-color:#1c1c1e;border:1px solid rgba(255,255,255,0.08);border-radius:50%;text-align:center;vertical-align:middle;font-family:${FONT};font-size:12px;font-weight:700;color:#52525b;line-height:26px;">2</td></tr></table></td>
          <td style="padding-left:12px;vertical-align:middle;"><div style="font-family:${FONT};font-size:13px;font-weight:600;color:#52525b;margin-bottom:2px;">Quality review</div><div style="font-family:${FONT};font-size:12px;color:#3f3f46;">Every photo checked before delivery</div></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:14px 16px;background-color:#0d0d0d;border:1px solid rgba(255,255,255,0.07);border-top:none;border-radius:0 0 14px 14px;">
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;"><tr>
          <td width="28" style="vertical-align:middle;"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td width="28" height="28" style="background-color:#1c1c1e;border:1px solid rgba(255,255,255,0.08);border-radius:50%;text-align:center;vertical-align:middle;font-family:${FONT};font-size:12px;font-weight:700;color:#52525b;line-height:26px;">3</td></tr></table></td>
          <td style="padding-left:12px;vertical-align:middle;"><div style="font-family:${FONT};font-size:13px;font-weight:600;color:#52525b;margin-bottom:2px;">Ready to download</div><div style="font-family:${FONT};font-size:12px;color:#3f3f46;">You&rsquo;ll get an email with a direct link</div></td>
        </tr></table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:24px;"><tr><td align="center">${btn('#', 'Track Progress →')}</td></tr></table>
    ${hr}<p style="margin:0;font-family:${FONT};font-size:12px;color:${TEXT_MUT};text-align:center;line-height:1.8;">Order #A1B2C3D4 &nbsp;·&nbsp; You can close this tab — we'll email you when ready</p>`
  ),

  'photos-ready': base(
    `${logo()}${h1('Your photos are ready')}${p('20 AI photos are waiting in your dashboard.<br/>Upload straight to Hinge, Tinder, or Bumble.')}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:32px;"><tr><td style="background-color:#0d0d0d;border:1px solid rgba(59,130,246,0.18);border-radius:16px;padding:28px 24px;text-align:center;">
      <div style="font-family:${FONT};font-size:48px;font-weight:800;color:${TEXT_PRI};letter-spacing:-3px;line-height:1;margin-bottom:8px;">20</div>
      <div style="font-family:${FONT};font-size:12px;color:${BLUE_SOFT};font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">photos generated</div>
      <div style="font-family:${FONT};font-size:12px;color:${TEXT_MUT};">Restaurant &middot; Formal &middot; City &middot; Outdoor &amp; more</div>
    </td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:28px;"><tr><td align="center">${btn('#', 'Download Your Photos →')}</td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="background-color:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 18px;"><p style="margin:0;font-family:${FONT};font-size:13px;color:#71717a;line-height:1.7;"><strong style="color:${TEXT_PRI};">Pro tip:</strong> Update your first Hinge photo first — it drives the most swipes. Users typically see results within 24&nbsp;hours.</p></td></tr></table>
    ${hr}<p style="margin:0;font-family:${FONT};font-size:12px;color:${TEXT_MUT};text-align:center;">Order #A1B2C3D4</p>`
  ),

  'failed': base(
    `${logo()}${h1('Something went wrong')}${p('We ran into an issue generating your photos.<br/>Your payment is completely safe.')}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:32px;"><tr><td style="background-color:#0d0d0d;border:1px solid rgba(239,68,68,0.18);border-radius:16px;padding:24px;text-align:center;"><p style="margin:0;font-family:${FONT};font-size:14px;color:${TEXT_SEC};line-height:1.8;">Our team has been notified and will either<br/>regenerate your photos or issue a full refund.</p></td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin:0 auto;"><tr><td style="background-color:transparent;border-radius:100px;border:1px solid rgba(255,255,255,0.08);"><a href="#" style="display:block;font-family:${FONT};font-size:15px;font-weight:700;color:${TEXT_SEC};text-decoration:none;padding:16px 36px;white-space:nowrap;line-height:1;">Contact Support →</a></td></tr></table></td></tr></table>
    ${hr}<p style="margin:0;font-family:${FONT};font-size:12px;color:${TEXT_MUT};text-align:center;">Order #A1B2C3D4</p>`
  ),

  'cancelled': base(
    `${logo()}${h1('Subscription cancelled')}${p('You\'ll keep full access until<br/><strong style="color:#fff;">August 10, 2026</strong>.<br/>No more charges after that date.', 32)}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:32px;"><tr><td style="background-color:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px 22px;text-align:center;"><p style="margin:0;font-family:${FONT};font-size:13px;color:${TEXT_SEC};line-height:1.8;">Your photos and dashboard remain accessible.<br/>You can reactivate your plan anytime.</p></td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin:0 auto;"><tr><td style="background-color:transparent;border-radius:100px;border:1px solid rgba(255,255,255,0.08);"><a href="#" style="display:block;font-family:${FONT};font-size:15px;font-weight:700;color:${TEXT_SEC};text-decoration:none;padding:16px 36px;white-space:nowrap;line-height:1;">Reactivate Plan →</a></td></tr></table></td></tr></table>`,
    "You're receiving this because you cancelled your SwipePhotos.net subscription."
  ),

  'offer-accepted': base(
    `${logo()}${h1('Your next month is free')}${p("We've applied 100% off to your next billing cycle.<br/>You won't be charged anything next month.", 32)}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:32px;"><tr><td style="background-color:#0d0d0d;border:1px solid rgba(37,99,235,0.18);border-radius:16px;padding:20px 24px;text-align:center;"><p style="margin:0;font-family:${FONT};font-size:13px;color:${TEXT_SEC};line-height:1.8;">Your subscription continues without interruption.<br/>Keep getting fresh AI photos every month.</p></td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td align="center">${btn('#', 'Go to Dashboard →')}</td></tr></table>`,
    "You're receiving this because you accepted a SwipePhotos.net retention offer."
  ),

  'affiliate-application': base(
    `${logo()}${h1('Application received')}${p('Hi John — we\'ll review your application within 1–2 business days.', 32)}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:32px;"><tr><td style="background-color:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:24px 22px;">
      <div style="font-family:${FONT};font-size:10px;font-weight:600;color:${TEXT_MUT};text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">What happens next</div>
      ${['We review your platform and audience fit','You receive an approval email with your referral link',`Earn <strong style="color:${TEXT_PRI};">30% commission</strong> on every sale, paid monthly`].map(t => `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:12px;"><tr><td width="20" style="vertical-align:top;padding-top:4px;"><div style="width:6px;height:6px;background-color:${BLUE};border-radius:50%;"></div></td><td style="padding-left:10px;font-family:${FONT};font-size:13px;color:${TEXT_SEC};line-height:1.6;">${t}</td></tr></table>`).join('')}
    </td></tr></table>
    <p style="margin:0;font-family:${FONT};font-size:13px;color:${TEXT_MUT};text-align:center;line-height:1.6;">Questions? Reply to this email anytime.</p>`,
    "You're receiving this because you applied to the SwipePhotos.net affiliate program."
  ),

  'affiliate-approved': base(
    `${logo()}${h1("You're approved!")}${p('Share your link. Earn <strong style="color:#fff;">30% commission</strong> on every sale. Paid monthly.', 32)}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:28px;"><tr><td style="background-color:#0d0d0d;border:1px solid rgba(37,99,235,0.25);border-radius:16px;padding:20px 22px;">
      <div style="font-family:${FONT};font-size:10px;font-weight:600;color:${TEXT_MUT};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Your referral link</div>
      <div style="font-family:monospace;font-size:13px;color:${BLUE_SOFT};word-break:break-all;line-height:1.5;">https://swipephotos.net/r/YOURCODE</div>
    </td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:32px;"><tr>
      ${[['30%','Commission'],['$39','Avg. sale'],['$50','Min. payout']].map(([v,l],i) => `<td width="33%" style="padding:${i===0?'0 4px 0 0':i===2?'0 0 0 4px':'0 2px'};"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td style="background-color:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 12px;text-align:center;"><div style="font-family:${FONT};font-size:22px;font-weight:700;color:${TEXT_PRI};letter-spacing:-0.5px;">${v}</div><div style="font-family:${FONT};font-size:11px;color:${TEXT_MUT};margin-top:4px;">${l}</div></td></tr></table></td>`).join('')}
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td align="center">${btn('#', 'View Dashboard →')}</td></tr></table>`,
    "You're receiving this because your SwipePhotos.net affiliate application was approved."
  ),
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params
  const html = TEMPLATES[type]
  if (!html) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
