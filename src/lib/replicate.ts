import Replicate from 'replicate'
import JSZip from 'jszip'
import { createAdminClient } from '@/lib/supabase/server'

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

// Dating-style scene prompts — TOK is the trigger word for the trained face
// 4 core settings × 2 shots each = 8 photos
export const SCENE_PROMPTS = [
  // Setting 1: Outdoor Italian restaurant (cobblestone street, pizza, white linen shirt)
  'candid photo of TOK man sitting at outdoor Italian restaurant on cobblestone street, white linen shirt open collar, pizza on table in foreground, warm golden sunlight, relaxed confident smile, shallow depth of field, bokeh background of old stone buildings, photorealistic, 35mm film look',
  'photo of TOK man at outdoor cafe on European cobblestone street, white linen shirt, leaning back in chair, warm afternoon light, candid lifestyle, people blurred in background, photorealistic portrait',

  // Setting 2: Luxury rooftop pool bar at night (infinity pool, city lights, striped shirt)
  'photo of TOK man relaxing at luxury rooftop infinity pool bar at dusk, striped casual button-up shirt, wine glass on table, city lights and sea in background, blue hour sky, relaxed elegant pose, photorealistic',
  'photo of TOK man at upscale outdoor restaurant by infinity pool at night, pastel striped shirt, champagne flutes on table, ambient warm lighting, Mediterranean hillside lights bokeh background, photorealistic',

  // Setting 3: Beach club (white linen shirt, sunglasses, cocktail, macrame umbrellas)
  'candid photo of TOK man at exclusive beach club, white open linen shirt, stylish sunglasses, holding cocktail, macrame beach umbrellas in background, sun loungers, relaxed summer vibe, photorealistic',
  'photo of TOK man at beach club lounge, white linen shirt, one arm resting back, fresh fruit platter on table, luxury beach setting, bright sunny day, confident relaxed expression, photorealistic',

  // Setting 4: Formal interior bar / luxury apartment (black suit, whiskey, moody lighting)
  'photo of TOK man sitting on luxury sofa in upscale apartment, black blazer white shirt, holding whiskey glass, warm ambient pendant lighting, modern art on wall behind, confident relaxed pose, photorealistic portrait',
  'photo of TOK man in black suit jacket and white shirt, sitting in elegant lounge interior, holding glass of whiskey, luxury hotel bar aesthetic, moody warm light, photorealistic',
]

async function buildZipUrl(imageUrls: string[], orderId: string): Promise<string> {
  const zip = new JSZip()

  // Download each image and add to zip
  await Promise.all(
    imageUrls.map(async (url, i) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch image: ${url}`)
      const buf = await res.arrayBuffer()
      const ext = url.split('.').pop()?.split('?')[0] || 'jpg'
      zip.file(`photo_${i + 1}.${ext}`, buf)
    })
  )

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

  // Upload zip to Supabase storage
  const supabase = await createAdminClient()
  const zipPath = `${orderId}/training.zip`
  const { error } = await supabase.storage
    .from('uploads')
    .upload(zipPath, zipBuffer, { contentType: 'application/zip', upsert: true })
  if (error) throw new Error(`ZIP upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(zipPath)
  return publicUrl
}

export async function trainModel(imageUrls: string[], orderId: string, webhookUrl?: string) {
  const username = process.env.REPLICATE_USERNAME!
  const modelName = `user-${orderId.slice(0, 12)}`

  // Build ZIP of training images (Replicate requires a single zip URL)
  const zipUrl = await buildZipUrl(imageUrls, orderId)
  console.log('[trainModel] ZIP uploaded:', zipUrl)

  // Create destination model on Replicate
  try {
    await replicate.models.create(username, modelName, {
      visibility: 'private',
      hardware: 'gpu-a100-large',
    })
  } catch {
    // Model may already exist — continue
  }

  // Get latest version of flux-dev-lora-trainer
  const trainerModel = await replicate.models.get('ostris', 'flux-dev-lora-trainer')
  const versionId = trainerModel.latest_version?.id
  if (!versionId) throw new Error('Could not find flux-dev-lora-trainer version')

  const training = await replicate.trainings.create(
    'ostris',
    'flux-dev-lora-trainer',
    versionId,
    {
      destination: `${username}/${modelName}` as `${string}/${string}`,
      webhook: webhookUrl,
      webhook_events_filter: webhookUrl ? ['completed'] : undefined,
      input: {
        input_images: zipUrl,
        steps: 1500,
        trigger_word: 'TOK',
        learning_rate: 0.0003,
        batch_size: 1,
        resolution: '512,768,1024',
        autocaption: true,
        autocaption_prefix: 'a photo of TOK man,',
      },
    } as Parameters<typeof replicate.trainings.create>[3]
  )

  return training
}

export async function generatePhotos(loraUrl: string): Promise<string[]> {
  const settled = await Promise.allSettled(
    SCENE_PROMPTS.map(prompt =>
      replicate.run(
        'black-forest-labs/flux-dev-lora' as `${string}/${string}`,
        {
          input: {
            prompt,
            lora_weights: loraUrl,
            num_outputs: 1,
            aspect_ratio: '3:4',
            output_format: 'webp',
            output_quality: 90,
            guidance_scale: 3.5,
            num_inference_steps: 28,
            lora_scale: 0.85,
          },
        }
      )
    )
  )

  return settled.flatMap((r, i) => {
    if (r.status === 'rejected') {
      console.error('Generation failed for prompt index', i, r.reason)
      return []
    }
    const output = r.value
    const urls = Array.isArray(output) ? output : [output]
    return (urls as string[]).filter(Boolean)
  })
}
