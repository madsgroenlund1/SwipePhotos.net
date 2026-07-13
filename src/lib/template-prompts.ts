// Per-setting prompts for preview generation, sourced from the Template/ folder:
//   Template/BEACH CLUB/01_beach_club_prompt.md         → style 'beach'
//   Template/ITALIAN RESTAURANT/02_italian_restaurant_prompt.md → style 'restaurant'
//   Template/ROOFTOP POOL/03_pool_view_prompt.md        → style 'rooftop'
//   Template/SMART FORMAL/04_suit_lounge_prompt.md      → style 'formal'
//
// Image order (per the md files):
//   1. template image  2. full-body  3. left angle  4. front  5. right angle
//   6. tattoo photo (only when the customer has tattoos)
//
// Each setting has two prompts: A = neutral/calm, B = slight closed-mouth smile.

const IDENTITY = `Match the customer's identity extremely closely using all uploaded customer references: face shape, eyes, eye color, eyebrows, nose, lips, cheekbones, chin, jawline, skin tone, skin texture, hair color, hairline, and overall facial proportions. Use the customer's full-body photo to match build and proportions, and the three face-angle photos to lock identity from multiple angles. Keep the customer looking in the same direction as the template and keep the head size and body proportions consistent with the template. Do not idealise, slim or smooth the face.`

const WATCH_TATTOO = `If the customer has a clearly visible personal watch in the reference photos, use that watch instead of the template watch; otherwise keep the template watch. If a tattoo photo is provided, reproduce the tattoos accurately in the correct location, scale and orientation. If no tattoo photo is provided, do not invent tattoos.`

const REALISM = `Critical realism requirements: seamless skin blending, natural pores, realistic shadows, realistic ear and neck transitions, realistic hands and fingers, realistic fabric folds, and no gray mannequin remnants anywhere. Do not change the environment or scene objects. No face distortion, no extra fingers, no wrong skin tone, no cartoonish texture, and no AI look. The final image must look like a genuine photograph of the customer, not AI-generated.`

const EXPRESSION_A = `Expression: neutral, composed, calm, and quietly confident. Mouth closed. No teeth visible. Not angry, not sad, not smiling — just relaxed and slightly aloof.`
const EXPRESSION_B = `Expression: slightly positive and approachable, but subtle. Closed-mouth smile only. No teeth visible. Relaxed, lightly pleased and natural — not overly cheerful.`

type StylePrompts = { neutral: string; smile: string }

function build(scene: string, extra = ''): StylePrompts {
  const base = (expression: string) =>
    `Use the first image as the template scene and composition reference, and use the customer photos as identity references. Replace the mannequin/template subject with the customer from the uploaded identity photos. ${scene}

${IDENTITY}

${expression}

${WATCH_TATTOO}${extra ? `\n\n${extra}` : ''}

${REALISM}`
  return { neutral: base(EXPRESSION_A), smile: base(EXPRESSION_B) }
}

export const TEMPLATE_PROMPTS: Record<string, StylePrompts> = {
  beach: build(
    'Preserve the exact beach-club setting, camera framing, seated laid-back pose, body position, white linen shirt with open collar, sunglasses, wristwatch, fruit platter, drink in hand, woven parasols, cream textiles, and luxury daytime atmosphere.',
    'Even with sunglasses on, the result must still feel like the customer: match face shape, cheekbones, jawline, mouth shape, skin tone, hairline, hair color, and visible facial structure. Keep the sunglasses exactly as positioned in the template.'
  ),
  restaurant: build(
    'Keep the exact Italian street-restaurant scene, camera angle, framing, head tilt, leaning-forward pose, body proportions, white linen shirt, pizza foreground, plates, glasses, visible forearms and hands, and ambient narrow-street background with natural restaurant lighting.'
  ),
  rooftop: build(
    'Preserve the exact rooftop poolside dinner setting, blue-hour lighting, city lights background, pool, table layout, flowers, wine glasses, menu, striped shirt, watch area, seated pose, hand-to-face pose, and framing.',
    'Important corrections for this template: keep the full visible lower scene intact — do not crop away the foreground below the table. In the open collar / chest area, replace all mannequin-gray material with realistic human skin or believable clothing depth. Ensure realistic arm, wrist and hand anatomy, and keep all glasses, tableware, reflections, pool water, and distant lights intact.'
  ),
  formal: build(
    'Preserve the exact indoor lounge environment, warm evening lighting, sofa position, camera angle, relaxed seated pose with one arm extended and the other hand holding the drink, dark suit, white shirt, belt, wristwatch area, and overall upscale composition.',
    'Make sure the hands, fingers, drink glass, and suit sleeves look anatomically correct and realistic, with a believable grip on the glass.'
  ),
}

/** Note appended when a tattoo reference image is included (always the last image). */
export function tattooNote(imageIndex: number): string {
  return `Image #${imageIndex} shows the customer's real tattoos. Reproduce these tattoos accurately on the same body parts wherever they are visible in the scene. Do not invent tattoos that are not in image #${imageIndex}.`
}
