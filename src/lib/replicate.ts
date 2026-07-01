import Replicate from 'replicate'

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

// Dating-style scene prompts — TOK is the trigger word for the trained face
export const SCENE_PROMPTS = [
  'candid photo of TOK man at an outdoor Italian restaurant, cobblestone street, white linen shirt, relaxed natural smile, warm sunlight, bokeh background, photorealistic',
  'photo of TOK man standing on European city street at golden hour, light casual shirt, confident expression, looking at camera, shallow depth of field, photorealistic',
  'photo of TOK man at a rooftop bar at night, city lights bokeh, casual shirt, relaxed pose, ambient warm light, photorealistic portrait',
  'photo of TOK man at beach club, white open linen shirt, sunglasses, holding cocktail, summer vibes, photorealistic',
  'candid photo of TOK man at outdoor cafe terrace, people blurred in background, light shirt, natural laughing expression, warm daylight, photorealistic',
  'photo of TOK man in a cozy coffee shop, natural window light, casual smart outfit, genuine smile, candid lifestyle, photorealistic',
  'photo of TOK man walking along marina, boats in background, sunny day, casual summer outfit, photorealistic',
  'photo of TOK man at home, clean modern interior, natural window light, casual outfit, warm smile, lifestyle, photorealistic',
]

export async function trainModel(imageUrls: string[], orderId: string) {
  const username = process.env.REPLICATE_USERNAME!
  const modelName = `user-${orderId.slice(0, 12)}`

  // Create destination model on Replicate
  try {
    await replicate.models.create(username, modelName, {
      visibility: 'private',
      hardware: 'gpu-a40-large',
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
      input: {
        input_images: imageUrls,
        steps: 1000,
        trigger_word: 'TOK',
        learning_rate: 0.0004,
        batch_size: 1,
        resolution: '512,768,1024',
        autocaption: true,
        autocaption_prefix: 'a photo of TOK man,',
      },
    }
  )

  return training
}

export async function generatePhotos(loraUrl: string): Promise<string[]> {
  const results: string[] = []

  for (const prompt of SCENE_PROMPTS) {
    try {
      const output = await replicate.run(
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
      const urls = Array.isArray(output) ? output : [output]
      results.push(...urls.filter(Boolean))
    } catch (err) {
      console.error('Generation failed for prompt:', prompt, err)
    }
  }

  return results
}
