import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = process.env.RESEND_FROM_EMAIL || 'photos@swipephotos.net'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

export async function sendWelcomeEmail(email: string, orderId: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your SwipePhotos photos are being generated 📸',
    html: `
      <div style="background:#0A0A0A;color:#fff;font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;">
        <h1 style="color:#3B82F6;font-size:28px;margin-bottom:8px;">SwipePhotos.net</h1>
        <h2 style="font-size:22px;margin-bottom:16px;">Your photos are being generated! 🎯</h2>
        <p style="color:#a1a1aa;line-height:1.6;">
          Our AI is hard at work training on your photos and generating your personalized dating profile shots.
          This usually takes 30–60 minutes.
        </p>
        <p style="color:#a1a1aa;line-height:1.6;">
          We'll send you another email as soon as your photos are ready.
        </p>
        <div style="margin:32px 0;">
          <a href="${APP_URL}/dashboard" style="background:#3B82F6;color:#fff;padding:14px 28px;border-radius:9999px;text-decoration:none;font-weight:600;">
            View Dashboard →
          </a>
        </div>
        <p style="color:#52525b;font-size:13px;">Order ID: ${orderId}</p>
      </div>
    `,
  })
}

export async function sendReadyEmail(email: string, orderId: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your SwipePhotos photos are ready 🎯',
    html: `
      <div style="background:#0A0A0A;color:#fff;font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;">
        <h1 style="color:#3B82F6;font-size:28px;margin-bottom:8px;">SwipePhotos.net</h1>
        <h2 style="font-size:22px;margin-bottom:16px;">Your photos are ready! 🎉</h2>
        <p style="color:#a1a1aa;line-height:1.6;">
          Your AI-generated dating profile photos are ready to download.
          Get ready to 10x your matches!
        </p>
        <div style="margin:32px 0;">
          <a href="${APP_URL}/dashboard" style="background:#3B82F6;color:#fff;padding:14px 28px;border-radius:9999px;text-decoration:none;font-weight:600;">
            Download Your Photos →
          </a>
        </div>
        <p style="color:#52525b;font-size:13px;">Order ID: ${orderId}</p>
      </div>
    `,
  })
}

export async function sendAffiliateApprovedEmail(email: string, refCode: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "You're approved as a SwipePhotos affiliate! 🚀",
    html: `
      <div style="background:#0A0A0A;color:#fff;font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;">
        <h1 style="color:#3B82F6;font-size:28px;margin-bottom:8px;">SwipePhotos.net</h1>
        <h2 style="font-size:22px;margin-bottom:16px;">You're approved! 🎉</h2>
        <p style="color:#a1a1aa;line-height:1.6;">
          Your affiliate application has been approved. Start sharing your link and earn 30% on every sale.
        </p>
        <p style="color:#a1a1aa;line-height:1.6;">
          Your referral link: <strong style="color:#3B82F6;">${APP_URL}/?ref=${refCode}</strong>
        </p>
        <div style="margin:32px 0;">
          <a href="${APP_URL}/affiliate" style="background:#3B82F6;color:#fff;padding:14px 28px;border-radius:9999px;text-decoration:none;font-weight:600;">
            View Affiliate Dashboard →
          </a>
        </div>
      </div>
    `,
  })
}
