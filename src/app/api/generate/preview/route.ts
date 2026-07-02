import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

const NEGATIVE = [
  'cartoon, anime, painting, illustration, 3d render, cgi, digital art, fake',
  'plastic skin, waxy, airbrushed, oversaturated, overexposed, HDR, unreal',
  'deformed, disfigured, bad anatomy, extra fingers, missing limbs, fused hands',
  'blurry, out of focus, motion blur, grainy, low quality, watermark, text',
  'red skin, green skin, wrong skin color, color cast, weird tint',
  'duplicate face, two people, clone, extra person',
  'sitting cross-legged on floor, mannequin pose, stiff, unnatural body',
  'nsfw, nudity',
].join(', ')

// Rich cinematic prompts — no pose reference, pure text drives the scene
const STYLE_PROMPTS: Record<string, string> = {
  restaurant: [
    'professional portrait photo of a young man at an elegant Italian restaurant terrace in Rome',
    'seated at a round table with white tablecloth, wine glass and candle on table',
    'wearing a relaxed white linen shirt, sleeves slightly rolled',
    'warm golden hour sunlight, cobblestone street and ivy walls softly blurred in background',
    'natural relaxed posture, realistic hands resting on table',
    'shot on Sony A7R V 85mm f/1.4, shallow depth of field, natural skin tones, photorealistic, 4k',
  ].join(', '),

  formal: [
    'professional portrait photo of a young man wearing a slim-fit dark navy blazer over white shirt',
    'standing confidently in a modern upscale hotel lobby or luxury apartment living room',
    'warm ambient lamp light, cream coloured sofa visible, subtle art on wall in background',
    'natural relaxed posture, one hand in pocket, looking directly at camera',
    'shot on Canon EOS R5 85mm f/1.2L, warm tones, natural skin texture, photorealistic, 4k',
  ].join(', '),

  rooftop: [
    'professional portrait photo of a young man at a rooftop bar in New York City at golden hour',
    'wearing a fitted navy casual shirt, holding a whiskey glass naturally',
    'leaning relaxed against a glass railing, city skyline and warm orange sky softly blurred behind him',
    'warm directional sunset light on face, natural shadow, realistic skin tones',
    'shot on Nikon Z9 85mm f/1.4, shallow depth of field, photorealistic, cinematic, 4k',
  ].join(', '),

  beach: [
    'professional portrait photo of a young man at a luxury beach club in Mykonos Greece',
    'wearing an open white linen shirt and light chinos, relaxed natural posture',
    'turquoise sea and white sun umbrellas softly blurred in background',
    'warm Mediterranean afternoon sun at 45 degrees, flattering natural light on face',
    'shot on Sony A7C II 85mm f/1.8, shallow depth of field, natural skin tones, photorealistic, 4k',
  ].join(', '),

  park: [
    'professional portrait photo of a young man in a leafy urban park on a sunny afternoon',
    'wearing a smart casual olive shirt, leaning gently against a wooden fence',
    'dappled golden sunlight through trees, green bokeh leaves in background',
    'warm natural backlighting creating rim light on hair, natural shadow on face',
    'shot on Canon EOS R5 85mm f/1.4, shallow depth of field, photorealistic, 4k',
  ].join(', '),
}

// 5 varied expressions — natural, dateable
const EXPRESSIONS = [
  'genuine warm smile showing teeth, eyes slightly crinkled, relaxed and confident',
  'relaxed natural closed-mouth smile, warm friendly eyes, slight casual head tilt',
  'calm serious expression, strong jaw, looking slightly to the side, cool and composed',
  'candid mid-laugh, genuine joyful moment, natural and spontaneous',
  'subtle confident smirk, direct eye contact, charming and self-assured',
]

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    const style = (formData.get('style') as string) || 'restaurant'
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const basePrompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.restaurant
    const faceImageUrl = await fal.storage.upload(file)

    const jobs = await Promise.all(
      EXPRESSIONS.map((expression) =>
        fal.queue.submit('fal-ai/instantid', {
          input: {
            face_image_url: faceImageUrl,
            prompt: `${basePrompt}, ${expression}`,
            negative_prompt: NEGATIVE,
            num_inference_steps: 40,
            guidance_scale: 5,
            ip_adapter_scale: 0.8,
            controlnet_conditioning_scale: 0.7,
            image_size: { width: 576, height: 768 },
            num_images: 1,
          },
        })
      )
    )

    const requestIds = jobs.map(j => j.request_id)
    const indices = EXPRESSIONS.map((_, i) => `v${i}`)
    console.log('[preview] Submitted jobs for style:', style, requestIds)

    return NextResponse.json({ requestIds, styles: indices })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[preview] Submit error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
