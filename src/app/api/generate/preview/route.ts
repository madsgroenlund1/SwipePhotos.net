import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

const PULID_VERSION = '43d309c37ab4e62361e5e29b8e9e867fb2dcbcec77ae91206a8d95ac5dd451a0'

const SCENES = [
  'candid iPhone photo of a man sitting at an outdoor Italian restaurant, sunny Mediterranean street behind him, white linen shirt, big genuine laugh, pizza on table, natural daylight, people in background, shallow depth of field, real photo',
  'candid photo of a man at an outdoor cafe terrace, European city street, summer, sunlight, natural smile, casual outfit, shot on iPhone, real photo, bokeh background',
  'photo of a man sitting at a restaurant table outdoors, warm golden hour sunlight, relaxed and happy expression, white shirt, food and drinks on table, candid moment, real photo shot on iPhone',
  'candid iPhone photo of a man at a bar or restaurant, laughing with friends, warm evening light, casual setting, natural expression, shallow focus, real photo',
  'photo of a man outdoors in a European city, sunny day, casual white or light shirt, relaxed confident smile, street or square in background, candid lifestyle photo shot on iPhone',
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
