import Replicate from 'replicate'
import JSZip from 'jszip'
import { createAdminClient } from '@/lib/supabase/server'

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

// Dating-profile scene prompts — TOK is the LoRA trigger word for the trained face.
// Rules: photorealistic, no AI artifacts, natural skin + lighting, sharp face, bokeh background.
// Varied expressions per setting: warm smile, confident/serious, relaxed candid, intense direct.
// 4 settings × 2 expressions = 8 photos.
export const SCENE_PROMPTS = [
  // Setting 1: Italian restaurant — warm, social, charming
  'realistic candid photo of TOK man at a sunlit outdoor Italian restaurant, white linen shirt open at collar, leaning forward with a genuine warm smile, wine glass on table, cobblestone street and blurred diners in bokeh background, golden hour light, shot on Sony A7IV 85mm f/1.8, natural skin texture, shallow depth of field, cinematic color grade, photorealistic, no AI artifacts',
  'realistic lifestyle photo of TOK man sitting at an Italian outdoor cafe terrace, white linen shirt, relaxed posture leaning back, confident subtle expression looking slightly off to the side, espresso on marble table, warm afternoon light, European street bokeh background, shot on 50mm f/1.4, natural film-like grain, photorealistic portrait',

  // Setting 2: Rooftop / city skyline — aspirational, stylish
  'realistic photo of TOK man on a luxury rooftop terrace at golden hour, light blue linen shirt, one hand resting on railing, relaxed natural half-smile, city skyline softly blurred behind, warm amber light, shot on Canon EOS R5 35mm f/2, natural skin tones, sharp eyes, cinematic lifestyle photography, photorealistic, no AI artifacts',
  'realistic candid photo of TOK man standing at an upscale rooftop bar at dusk, dark navy shirt, arms relaxed, direct intense gaze into camera, serious confident expression, city lights bokeh background, blue hour sky, dramatic directional rim light, shot on Sony 85mm f/1.4, sharp face, editorial style, photorealistic',

  // Setting 3: Beach / outdoor — fun, summer, carefree
  'realistic candid photo of TOK man at a luxury beach club, white linen shirt partially open, natural laughing expression caught mid-moment, sun-drenched beach and palm trees softly blurred in background, warm daylight, shot on 50mm f/2, natural shadows, no harsh flash, bright summer lifestyle photography, photorealistic, no AI artifacts',
  'realistic lifestyle photo of TOK man at an exclusive beach, wearing sunglasses and light linen shirt, sitting back relaxed with calm confident posture, sea horizon and beach umbrellas in bokeh background, bright midday light, shot on 35mm f/2, natural skin, slight warm film tone, dating profile aesthetic, photorealistic',

  // Setting 4: Formal / evening — sharp, powerful, high-status
  'realistic portrait of TOK man in a dark navy blazer and white shirt in a luxury hotel lounge, subtle confident smile, warm ambient pendant lighting, soft bokeh of upscale interior behind, shot on 85mm f/1.4, sharp facial features, natural skin texture, cinematic warm tones, editorial photography, photorealistic, no AI artifacts',
  'realistic photo of TOK man in a black blazer at an elegant bar, serious composed no-smile expression, direct eye contact, moody warm side light, luxury interior bokeh, shot on Sony A7IV 85mm f/1.4, sharp eyes and jaw, powerful confident energy, high-end dating profile, photorealistic',
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
            num_outputs: 4,
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
    return urls
      .map(u => (typeof u === 'string' ? u : (u as { url?: () => string })?.url?.() ?? String(u)))
      .filter(u => u && u.startsWith('http'))
  })
}
