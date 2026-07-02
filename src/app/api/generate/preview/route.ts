import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

// Negative prompt: everything that makes AI photos look fake
const NEGATIVE = [
  'cartoon, anime, illustration, painting, drawing, sketch, render, cgi, digital art',
  'plastic skin, waxy skin, airbrushed, oversaturated, HDR, oversharpened',
  'deformed, disfigured, ugly, bad anatomy, extra fingers, missing fingers, fused fingers',
  'blurry, motion blur, out of focus, noisy, grainy low quality',
  'watermark, text, logo, signature, frame, border',
  'crossed legs, weird sitting pose, floating, stiff mannequin pose, unnatural body',
  'duplicate head, two faces, extra person, clone',
  'bad lighting, harsh shadows, overexposed face, underexposed',
  'nsfw, nudity',
].join(', ')

// Each setting has a rich, cinematic base description
const STYLE_BASE: Record<string, string> = {
  restaurant: [
    'candid lifestyle portrait of a man at an upscale Italian osteria in Rome',
    'warm late-afternoon golden hour sunlight streaming through ivy-covered walls',
    'rustic stone cobblestone street visible in background, soft bokeh',
    'man wearing a relaxed white linen shirt, sleeves slightly rolled',
    'half-finished glass of red wine and bread on the table in foreground',
    'ambient warm tungsten light mixing with natural sun, perfect skin tones preserved',
    'shot on Sony A7R V, Sigma 85mm Art f/1.4, ultra shallow depth of field',
    'natural skin texture, real pores, authentic candid feel, magazine editorial quality',
  ].join(', '),

  formal: [
    'confident editorial portrait of a man in a modern European city',
    'wearing a slim-fit charcoal blazer over a white open-collar Oxford shirt',
    'standing on polished marble steps outside a luxury hotel entrance at dusk',
    'city lights beginning to glow in the background, soft blue-hour atmosphere',
    'one hand casually in pocket, relaxed upright posture, naturally confident',
    'warm key light from hotel entrance illuminating face perfectly',
    'shot on Canon EOS R5, 85mm f/1.2L, creamy bokeh, skin tones preserved',
    'photorealistic, natural skin texture, high-fashion editorial, dating app hero photo',
  ].join(', '),

  rooftop: [
    'lifestyle portrait of a man at a luxury rooftop bar in Manhattan at golden hour',
    'wearing a fitted navy blue casual shirt, slightly open at collar',
    'holding a whiskey glass loosely, leaning on a rooftop railing',
    'spectacular NYC skyline with warm orange-pink sunset in background, deep bokeh',
    'city skyscrapers softly blurred, string lights on rooftop visible',
    'warm directional golden light sculpting natural face and skin tones',
    'shot on Nikon Z9, 85mm f/1.4, ultra-shallow depth of field, filmic colour grade',
    'authentic candid feel, natural skin, lifestyle magazine quality, very realistic',
  ].join(', '),

  beach: [
    'sun-kissed lifestyle photo of a man at a luxury beach club in Mykonos',
    'wearing a relaxed open white linen shirt, rolled sleeves, light linen shorts',
    'turquoise Aegean Sea and white umbrella canopies softly blurred in background',
    'warm Mediterranean afternoon sun hitting face at a flattering 45-degree angle',
    'natural summer skin tone, slight warmth, authentic sunlight colour cast',
    'barefoot standing on sun-bleached wooden deck, relaxed holiday energy',
    'shot on Sony A7C II, 85mm f/1.8 G Master, shallow depth of field',
    'photorealistic, natural skin texture, editorial travel lifestyle, very realistic',
  ].join(', '),

  park: [
    'candid golden hour portrait of a man in a leafy urban park in Paris',
    'wearing a smart casual olive-green overshirt and white tee underneath',
    'dappled sunlight filtering through mature plane trees, warm bokeh leaves',
    'natural relaxed posture, leaning slightly against a wooden park bench',
    'warm late afternoon backlighting creating natural rim light on hair',
    'authentic skin tones, natural shadows, real environment feel',
    'shot on Leica SL3, 90mm Summicron f/2, film-like rendering, skin texture preserved',
    'photorealistic, candid lifestyle, dating profile quality, very natural and real',
  ].join(', '),
}

// 5 distinct expressions — varied so the set tells a story
const EXPRESSIONS = [
  // 1 — big genuine smile, looking at camera
  'expression: genuine wide smile showing teeth, eyes crinkled with real joy, looking directly into camera, energetic and warm',
  // 2 — relaxed soft smile, slight head tilt
  'expression: relaxed natural closed-mouth smile, warm friendly eyes, slight casual head tilt, approachable and calm',
  // 3 — serious confident, slight 3/4 look
  'expression: calm serious expression, strong confident jaw, looking slightly off-camera at a 20-degree angle, mysterious and composed',
  // 4 — caught mid-laugh candid
  'expression: caught mid-laugh, head slightly tilted back, genuine candid moment of amusement, very natural and spontaneous',
  // 5 — subtle smirk, direct eye contact
  'expression: subtle one-sided smirk, intense direct eye contact, confident and self-assured, slightly raised eyebrow, charming',
]

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    const style = (formData.get('style') as string) || 'restaurant'
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const basePrompt = STYLE_BASE[style] ?? STYLE_BASE.restaurant
    const imageUrl = await fal.storage.upload(file)

    const jobs = await Promise.all(
      EXPRESSIONS.map((expression) =>
        fal.queue.submit('fal-ai/instantid', {
          input: {
            face_image_url: imageUrl,
            prompt: `${basePrompt}, ${expression}`,
            negative_prompt: NEGATIVE,
            num_inference_steps: 35,
            guidance_scale: 6,
            ip_adapter_scale: 0.9,
            controlnet_conditioning_scale: 0.9,
            image_size: { width: 576, height: 768 },
            num_images: 1,
          },
        })
      )
    )

    const requestIds = jobs.map(j => j.request_id)
    const indices = EXPRESSIONS.map((_, i) => `v${i}`)
    console.log('[preview] Submitted queue jobs:', requestIds)

    return NextResponse.json({ requestIds, styles: indices })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[preview] Submit error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
