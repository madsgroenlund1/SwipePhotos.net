import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

const STYLES = [
  'photo of a man at a rooftop bar at sunset, city skyline behind him, stylish casual outfit, confident smile, bokeh, shot on iPhone, photorealistic',
  'photo of a man hiking in mountains, golden hour light, casual outdoor outfit, natural smile, candid lifestyle, photorealistic',
  'photo of a man at the beach, summer vibes, relaxed open shirt, ocean in background, golden hour, photorealistic',
  'photo of a man in a cozy coffee shop, natural window light, laptop nearby, genuine expression, shallow depth of field, photorealistic',
  'photo of a man walking on a city street, urban background, stylish outfit, candid moment, street photography, photorealistic',
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
      STYLES.map(prompt =>
        replicate.predictions.create({
          model: 'fofr/face-to-many',
          input: {
            image: dataUrl,
            prompt,
            style: 'Photographic',
            negative_prompt: 'cartoon, illustration, painting, drawing, art, sketch, blurry, bad quality, deformed',
            number_of_images: 1,
          },
        })
      )
    )

    return NextResponse.json({ ids: predictions.map(p => p.id) })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
