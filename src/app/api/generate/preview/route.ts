import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

const SCENES = [
  {
    prompt: 'photo of a man sitting at an outdoor Italian restaurant, Mediterranean cobblestone street, white linen shirt, relaxed genuine smile, wine glass on table, warm sunlight, candid lifestyle photo, 35mm f2.0, photorealistic',
    negative: 'cartoon, anime, illustration, painting, 3d render, cgi, unrealistic, plastic skin, nsfw, blurry, bad quality',
  },
  {
    prompt: 'candid photo of a man on a European city street at golden hour, light casual shirt, confident neutral expression, not smiling, looking straight at camera, shallow depth of field, street photography, photorealistic',
    negative: 'cartoon, anime, illustration, 3d render, fake, plastic, nsfw, blurry',
  },
  {
    prompt: 'photo of a man at a rooftop bar at night, city lights bokeh background, striped casual shirt, relaxed confident pose, calm cool expression, ambient warm light, photorealistic portrait',
    negative: 'cartoon, anime, illustration, 3d render, fake, plastic, nsfw, blurry',
  },
  {
    prompt: 'candid photo of a man at a beach club, macrame umbrellas, white open linen shirt, sunglasses, holding cocktail, summer vibes, relaxed look, photorealistic, shot on iPhone',
    negative: 'cartoon, anime, illustration, 3d render, fake, plastic, nsfw, blurry',
  },
  {
    prompt: 'photo of a man at an outdoor cafe terrace, summer, people in blurry background, light shirt, laughing natural expression, warm daylight, candid lifestyle photography, photorealistic',
    negative: 'cartoon, anime, illustration, 3d render, fake, plastic, nsfw, blurry',
  },
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
    for (const scene of SCENES) {
      const p = await replicate.predictions.create({
        model: 'zsxkib/instant-id',
        input: {
          image: dataUrl,
          prompt: scene.prompt,
          negative_prompt: scene.negative,
          num_inference_steps: 30,
          guidance_scale: 5,
          ip_adapter_scale: 0.8,
          controlnet_conditioning_scale: 0.8,
          width: 832,
          height: 1216,
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
