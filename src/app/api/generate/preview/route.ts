import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

const PULID_VERSION = '43d309c37ab4e62361e5e29b8e9e867fb2dcbcec77ae91206a8d95ac5dd451a0'

const SCENES = [
  'candid photo of a man sitting at a nice restaurant, warm ambient lighting, white tablecloth, wine glass, natural smile, shot on iPhone, real person, not AI',
  'casual photo of a man outdoors at golden hour, park or street background, soft bokeh, natural daylight, candid moment, shot on iPhone, real photo',
  'photo of a man at a rooftop bar, evening city lights behind him, relaxed confident pose, natural expression, shallow depth of field, shot on Canon, real photo',
  'candid photo of a man at a coffee shop, sitting by window, warm natural light, casual outfit, genuine laugh, shallow focus, shot on iPhone, real photo',
  'photo of a man at the beach or outdoor setting, summer, relaxed natural pose, ocean or nature in background, golden hour light, shot on iPhone, real photo',
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Sequential with delay to avoid rate limits on low-credit accounts
    const ids: string[] = []
    for (const prompt of SCENES) {
      const p = await replicate.predictions.create({
        version: PULID_VERSION,
        input: {
          main_face_image: dataUrl,
          prompt,
          negative_prompt: 'cgi, render, 3d, digital art, illustration, painting, drawing, anime, cartoon, unrealistic skin, plastic, doll, AI generated look, fake, overly smooth skin, studio lighting, nsfw, bad quality, blurry, deformed',
          num_steps: 30,
          start_step: 0,
          guidance_scale: 1.5,
          id_weight: 0.85,
          num_outputs: 1,
        },
      })
      ids.push(p.id)
      await new Promise(r => setTimeout(r, 1500))
    }

    return NextResponse.json({ ids })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Preview generation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
