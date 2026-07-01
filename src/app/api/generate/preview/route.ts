import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

const PULID_VERSION = '43d309c37ab4e62361e5e29b8e9e867fb2dcbcec77ae91206a8d95ac5dd451a0'

const SCENES = [
  'photo of a man sitting at an outdoor Italian restaurant, Mediterranean cobblestone street, white linen shirt, relaxed natural smile, pizza on table, warm sunlight, bokeh background, real candid lifestyle photo, photorealistic',
  'photo of a man standing on a European city street at golden hour, light casual shirt, confident neutral expression, not smiling, looking straight at camera, shallow depth of field, photorealistic',
  'photo of a man at a rooftop bar at night, city lights bokeh background, casual shirt, relaxed pose, calm expression, ambient warm light, photorealistic portrait',
  'photo of a man at a beach club, macrame umbrellas, white open linen shirt, sunglasses, holding cocktail, summer vibes, relaxed look, photorealistic',
  'photo of a man at an outdoor cafe terrace, summer, people blurred in background, light shirt, laughing natural expression, warm daylight, candid lifestyle, photorealistic',
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
        version: PULID_VERSION,
        input: {
          main_face_image: dataUrl,
          prompt,
          negative_prompt: 'cartoon, anime, illustration, painting, 3d render, cgi, fake, plastic skin, nsfw, blurry, bad quality, deformed, doll',
          num_steps: 25,
          start_step: 4,
          guidance_scale: 1.5,
          id_weight: 1.0,
          num_outputs: 1,
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
