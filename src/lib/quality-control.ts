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

const QC_PROMPT = `You are a strict quality inspector for a premium AI dating-photo service. Customers have complained about bad identity matches slipping through, so be genuinely strict — err on the side of FAIL when in doubt.

Image 1 is the CUSTOMER's real reference photo (ground truth identity).
Image 2 is the GENERATED result, which should show the same customer in a new scene.

Reject (FAIL) if ANY of these are true:
- EYE COLOR does not match image 1. Look closely at the exact shade (brown/blue/green/hazel) — this is the single most common failure, check it carefully every time.
- The face in image 2 does not clearly look like the same person as image 1 — compare face shape, eyebrows, nose, lips, jawline, and overall bone structure carefully. If you would not confidently recognize this as the same person from image 1 alone, FAIL.
- The head in image 2 looks disproportionate — too large, too small, or oddly shaped relative to a normal human head and body.
- The face in image 2 looks AI-generated, plastic, waxy, overly smooth/airbrushed, or has visible artifacts.
- Hands or fingers in image 2 are malformed, extra, or missing.
- There are visible seams, blending errors, or mismatched lighting on the face in image 2.
- Gray or CGI undertone, or leftover mannequin-like skin, remains anywhere in image 2.
- Any OTHER person visible in image 2 (background people, bystanders, other customers) appears to have been altered, regenerated, or looks different in kind from a normal untouched photo — only the primary subject should ever be changed.

Otherwise PASS. Be strict but fair — minor, barely-visible imperfections that a real customer would not notice on a phone screen are still a PASS, but any identity mismatch (especially eye color) is always a FAIL regardless of how good the rest of the photo looks.

Respond in EXACTLY this format, nothing else:
VERDICT: PASS or FAIL
REASON: <one short sentence>`

// ─── Eye-color pre-detection ─────────────────────────────────────────────────
//
// The generation model is unreliable at INFERRING eye color from reference
// photos on its own — QC logs showed it consistently defaulting to blue
// regardless of the customer's real (often brown) eyes, even when the
// generation prompt said "match the reference photos." Instead of hoping the
// image model reads the reference correctly, we ask a vision model to name
// the color ONCE up front, then inject that literal word into the generation
// prompt as a stated fact (see eyeColorNote in paid-prompt.ts /
// template-prompts.ts). Much higher hit rate than "figure it out yourself."
const EYE_COLOR_PROMPT = `Look at the person's eyes in this photo. Respond with ONLY a short, precise eye color description (2-4 words max), e.g. "dark brown", "light blue", "hazel green", "warm brown". No other text.`

export async function detectEyeColor(customerRefUrl: string): Promise<string | null> {
  try {
    const result = await fal.subscribe('fal-ai/any-llm/vision', {
      input: { model: QC_MODEL, prompt: EYE_COLOR_PROMPT, image_urls: [customerRefUrl] },
      logs: false,
    })
    const output = String((result as { data?: { output?: string } })?.data?.output ?? '').trim()
    if (!output || output.length > 40) return null
    return output.replace(/["'.]/g, '')
  } catch (err) {
    console.error('[quality-control] Eye color detection failed:', err)
    return null
  }
}

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
