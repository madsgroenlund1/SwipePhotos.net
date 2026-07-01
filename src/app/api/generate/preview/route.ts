import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

const PULID_VERSION = '43d309c37ab4e62361e5e29b8e9e867fb2dcbcec77ae91206a8d95ac5dd451a0'

const SCENES = [
  'photo of a man at a rooftop bar at sunset, city skyline behind him, stylish casual outfit, confident smile, bokeh lights, cinematic, photorealistic',
  'photo of a man hiking in mountains, golden hour light, casual outdoor outfit, natural relaxed smile, candid lifestyle photography, photorealistic',
  'photo of a man at the beach, summer vibes, relaxed open linen shirt, ocean in background, golden hour, photorealistic',
  'photo of a man in a cozy coffee shop, natural window light, laptop nearby, genuine expression, shallow depth of field, photorealistic',
  'photo of a man walking on a city street, urban background, stylish smart casual outfit, candid moment, street photography, photorealistic',
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    const predictions = await Promise.all(
      SCENES.map(prompt =>
        replicate.predictions.create({
          version: PULID_VERSION,
          input: {
            main_face_image: dataUrl,
            prompt,
            negative_prompt: 'bad quality, blurry, deformed, cartoon, illustration, painting, drawing, art, sketch, nsfw',
            num_steps: 20,
            start_step: 0,
            guidance_scale: 1.2,
            id_weight: 1.0,
            num_outputs: 1,
          },
        })
      )
    )

    return NextResponse.json({ ids: predictions.map(p => p.id) })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Preview generation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
