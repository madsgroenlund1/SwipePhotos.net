import Replicate from 'replicate'

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export const PRESET_PROMPTS: Record<string, string> = {
  'outdoor-adventure':
    'photo of TOK man hiking in mountains, golden hour light, casual outfit, backpack, natural smile, shot on iPhone, candid lifestyle',
  'city-life':
    'photo of TOK man walking on city street, urban background, stylish casual outfit, natural expression, shallow depth of field, smartphone photography',
  'rooftop-bar':
    'photo of TOK man at rooftop bar at dusk, city skyline background, confident smile, evening wear, bokeh lights, lifestyle photography',
  'beach-vibes':
    'photo of TOK man at beach, summer vibes, casual shirt, relaxed pose, golden hour, ocean in background, candid shot',
  'home-studio':
    'photo of TOK man sitting at home, clean modern interior, casual outfit, natural window light, genuine smile, iPhone photography',
  'marina-walk':
    'photo of TOK man walking along marina, boats in background, sunny day, casual summer outfit, lifestyle photo, candid moment',
  'coffee-shop':
    'photo of TOK man in cozy coffee shop, natural light from window, laptop nearby, casual smart outfit, genuine candid expression',
  'black-and-white':
    'black and white photo of TOK man, dramatic lighting, sharp contrast, confident expression, artistic portrait, film photography style',
}

export async function trainModel(imageUrls: string[], orderId: string) {
  const training = await replicate.trainings.create(
    'ostris',
    'flux-dev-lora-trainer',
    'latest',
    {
      destination: `swipephotos/model-${orderId}` as `${string}/${string}`,
      input: {
        input_images: imageUrls,
        steps: 1000,
        trigger_word: 'TOK',
        learning_rate: 0.0001,
        batch_size: 1,
        resolution: '512,768,1024',
        autocaption: true,
      },
    }
  )
  return training
}

export async function generatePhoto(
  loraUrl: string,
  preset: string
): Promise<string[]> {
  const prompt = PRESET_PROMPTS[preset] || PRESET_PROMPTS['city-life']

  const output = await replicate.run(
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
      },
    }
  )

  return output as string[]
}
