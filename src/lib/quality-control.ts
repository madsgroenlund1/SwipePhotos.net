// ─── Critical quality gate for paid generation ───────────────────────────────
//
// Runs after a generation job completes, before the photo is ever saved or
// shown to the customer. Compares the customer's own reference photo against
// the generated result using a vision-capable model, and rejects anything
// that doesn't hold up — wrong identity, AI-artifact skin, malformed hands,
// mismatched pose. Rejected photos get discarded and the SAME template gets
// resubmitted for a fresh generation (see resubmitTemplateJob in faceswap.ts),
// up to QC_MAX_RETRIES times, so the customer never has to wait on a
// low-quality result silently slipping through.
//
// Fails OPEN on infrastructure errors (timeouts, model unavailable) — a
// flaky QC call must never block delivery of an otherwise-fine photo.

import { fal } from '@fal-ai/client'

export const QC_MAX_RETRIES = 2

export type QCResult = { pass: boolean; reason: string }

const QC_MODEL = 'google/gemini-flash-1.5'

const QC_PROMPT = `You are a strict quality inspector for a premium AI dating-photo service.
Image 1 is the CUSTOMER's real reference photo (ground truth identity).
Image 2 is the GENERATED result, which should show the same customer in a new scene.

Reject (FAIL) if ANY of these are true:
- The face in image 2 does not clearly look like the same person as image 1 — compare face shape, eyes, nose, and overall bone structure carefully
- The face in image 2 looks AI-generated, plastic, waxy, or has visible artifacts
- Hands or fingers in image 2 are malformed, extra, or missing
- There are visible seams, blending errors, or mismatched lighting on the face in image 2
- Gray or CGI undertone, or leftover mannequin-like skin, remains anywhere in image 2

Otherwise PASS. Be strict but fair — minor, barely-visible imperfections that a real customer would not notice on a phone screen are still a PASS.

Respond in EXACTLY this format, nothing else:
VERDICT: PASS or FAIL
REASON: <one short sentence>`

export async function assessPhotoQuality(customerRefUrl: string, generatedUrl: string): Promise<QCResult> {
  try {
    const result = await fal.subscribe('fal-ai/any-llm/vision', {
      input: {
        model: QC_MODEL,
        prompt: QC_PROMPT,
        image_urls: [customerRefUrl, generatedUrl],
      },
      logs: false,
    })
    const output = String((result as { data?: { output?: string } })?.data?.output ?? '')
    const pass = /VERDICT:\s*PASS/i.test(output)
    const reasonMatch = output.match(/REASON:\s*(.+)/i)
    return { pass, reason: reasonMatch?.[1]?.trim() || output.slice(0, 200) || 'No reason given' }
  } catch (err) {
    console.error('[quality-control] Check failed, defaulting to PASS (fail-open):', err)
    return { pass: true, reason: 'QC check unavailable — passed by default' }
  }
}
