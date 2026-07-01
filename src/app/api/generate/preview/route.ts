import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

const SCENES = [
  'photo of a man sitting at an outdoor Italian restaurant, Mediterranean cobblestone street, white linen shirt, relaxed natural smile, pizza on table, warm sunlight, bokeh background, candid lifestyle photo',
  'photo of a man on a European city street at golden hour, light casual shirt, confident neutral expression, not smiling, looking at camera, shallow depth of field, street photography',
  'photo of a man at a rooftop bar at night, city lights bokeh behind him, striped casual shirt, relaxed arm on chair, calm cool expression, ambient warm lighting',
  'photo of a man at a beach club, macrame umbrellas background, white open linen shirt, sunglasses, holding cocktail, summer vibes, relaxed confident look',
  'photo of a man at an outdoor cafe terrace, summer, people blurred in background, light shirt, laughing natural expression, warm daylight, candid lifestyle',
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    const ids: string[] = []
    for (const prompt of SCENES) {
      const p = await replicate.predictions.create({
        model: 'fofr/flux-pulid',
        input: {
          main_face_image: dataUrl,
          prompt,
          num_outputs: 1,
          num_inference_steps: 20,
          guidance_scale: 4,
          true_cfg: 1,
          id_weight: 1.0,
          negative_prompt: 'bad quality, blurry, deformed, cartoon, illustration, painting, 3d render, nsfw, plastic skin, fake',
          output_format: 'webp',
          output_quality: 90,
          start_step: 4,
        },
      })
      ids.push(p.id)
      await new Promise(r => setTimeout(r, 1000))
    }

    return NextResponse.json({ ids })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Preview generation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
