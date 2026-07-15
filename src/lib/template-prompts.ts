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

const IDENTITY = `Take your time on identity — this matters more than anything else. First lock the head size purely from the template: measure the template model's head (crown to chin) relative to the frame and reproduce that exact size — do not enlarge, shrink, or otherwise distort the head. An oversized, undersized, or oddly-proportioned head compared to the template is an automatic failure.

Within that locked head frame, reconstruct the customer's actual face with passport-photo precision using all uploaded customer references — not "similar," an exact match: eye color (use the customer's real, exact shade — brown/blue/green/hazel — never a generic or different color; this is the most common failure, check it carefully), face shape, eyebrows, nose, lips, cheekbones, chin, jawline, ears, skin tone, skin texture, hair color and hairline. Use the customer's full-body photo to match build and proportions, and the three face-angle photos to lock identity from multiple angles. Keep the customer's eyes looking in the exact same gaze direction as the template (judged separately from head angle) — and both eyes must point in the SAME coherent direction as each other, natural binocular alignment; cross-eyed or misaligned eyes is a hard failure. Do not idealise, slim or smooth the face — reproduce the exact real person, imperfections included. If a family member would hesitate to recognize him in the result, it has failed. This must be 1:1 — nobody should be able to tell which parts came from the template versus the customer's own reference photos.

If any other person is visible anywhere in the template scene (background, blurred, out of focus), leave them completely untouched — only the primary subject's identity is replaced, never anyone else's.`

const HANDS_AND_BODY = `The customer's full-body reference photo is the ONLY source of truth for his build — not the template model's physique. This is a repeated mistake: giving a slim customer a muscular body because the template model is muscular. That is wrong every time. Look at his actual build in the full-body photo — slim, average, stocky, muscular — and reproduce exactly that in the template's pose and clothing; never add muscle, bulk, or definition that isn't visible in his own reference photo. Also carry over his actual hand shape, finger length and thickness, knuckle size, and any hand/finger hair. Match visible vein patterns on hands/forearms only if actually visible in the references — do not invent them. Match his actual skin tone consistently between face, neck, hands and any other exposed skin (chest, arms) — these must all look like the same real person's skin, not a lighter or more "airbrushed" body than the face.`

const WATCH_TATTOO = `If the customer has a clearly visible personal watch in the reference photos, use that watch instead of the template watch; otherwise keep the template watch. If the template model has any visible tattoo, that tattoo belongs to the model, not the customer — remove it and replace it with clean skin matching the customer's real skin tone. If the customer's own tattoo photo is provided, reproduce the customer's tattoos accurately in the correct location, scale and orientation instead. If no tattoo photo is provided, the customer should show no tattoos at all — do not invent tattoos and do not keep the template model's tattoos.`

const REALISM = `Critical realism requirements: seamless skin blending, natural pores, realistic shadows, realistic ear and neck transitions, realistic hands and fingers, realistic fabric folds, and no gray mannequin remnants anywhere. Do not change the environment or scene objects. No face distortion, no extra fingers, no wrong skin tone, no cartoonish texture, and no AI look. Avoid the classic "too perfect" AI look: skin must show natural micro-texture, slight tonal variation, and minor real-world asymmetry — not uniformly smooth, glossy, or airbrushed skin. This especially matters on a smiling face: keep the skin around the mouth, cheeks and eyes textured and real, not smoothed flat, and keep smile lines and natural creases instead of a plastic, retouched look. The final image must look like a genuine, slightly imperfect photograph of the customer, not AI-generated and not touched up.`

const EXPRESSION_A = `Expression ("Bad Boy" look): mouth closed, no teeth visible, not angry, not sad, not smiling. A magnetic, self-assured gaze — sharp, direct eye contact with real intensity, slightly lowered brow, a hint of a smirk at the corner of the mouth. Confident, a little edgy and mysterious, never blank or robotic. This must still be an exact match of the customer's own eyes, brow shape, and facial structure — only the intensity and focus of the expression changes, not the underlying face.`
const EXPRESSION_B = `Expression ("Gentleman" look): a genuine, warm closed-mouth smile, no teeth visible. Eyes softly engaged and slightly crinkled at the corners as in a real natural smile, relaxed brow, approachable and charming rather than stiff or forced. Should read as effortlessly attractive and likeable — the kind of expression that makes someone want to swipe right — while remaining unmistakably the customer's own face, eyes, and features, not an idealised or generic face.`

type StylePrompts = { neutral: string; smile: string }

function build(scene: string, extra = ''): StylePrompts {
  const base = (expression: string) =>
    `Use the first image as the template scene and composition reference, and use the customer photos as identity references. Replace the mannequin/template subject with the customer from the uploaded identity photos. ${scene}

${IDENTITY}

${HANDS_AND_BODY}

${expression}

${WATCH_TATTOO}${extra ? `\n\n${extra}` : ''}

${REALISM}`
  return { neutral: base(EXPRESSION_A), smile: base(EXPRESSION_B) }
}

export const TEMPLATE_PROMPTS: Record<string, StylePrompts> = {
  beach: build(
    'Preserve the exact beach-club setting, camera framing, seated laid-back pose, body position, white linen shirt with open collar, sunglasses, wristwatch, fruit platter, drink in hand, woven parasols, cream textiles, and luxury daytime atmosphere.',
    'The customer must wear the exact same sunglasses as the template model, in the same position on his face — never remove them, never show him bare-eyed. Even with sunglasses on, the result must still feel like the customer: match face shape, cheekbones, jawline, mouth shape, skin tone, hairline, hair color, and visible facial structure. Identity must be locked through these visible features exactly as precisely as if the eyes were shown.'
  ),
  restaurant: build(
    'Keep the exact Italian street-restaurant scene, camera angle, framing, head tilt, leaning-forward pose, body proportions, white linen shirt, pizza foreground, plates, glasses, visible forearms and hands, and ambient narrow-street background with natural restaurant lighting.'
  ),
  rooftop: build(
    'Preserve the exact rooftop poolside dinner setting, blue-hour lighting, city lights background, pool, table layout, flowers, wine glasses, menu, striped shirt, watch area, seated pose, hand-to-face pose, and framing.',
    `Important corrections for this specific template — read carefully, these are the two most common failures and both must be fixed:

1. LEG / LOWER BODY: image #1 shows the customer's leg and trouser fully extending down to the bottom edge of the frame, resting naturally in the seat. Do NOT crop, shorten, or truncate the leg. Do NOT let the leg end early or fade out above the bottom of the frame. Reproduce the leg, trouser fabric, and its full length exactly as far down as image #1 shows it, all the way to the frame edge, with correct proportions matching the rest of the body.

2. OPEN SHIRT / CHEST GAP: the shirt is worn open at the collar, exposing a triangle of chest/skin between the lapels. This area must show fully opaque, realistic human chest skin matching the customer's real skin tone and texture — with natural shading, a hint of chest hair if appropriate, and correct anatomy. This gap must NEVER show gray, flat, mannequin-colored, plastic, or semi-transparent material of any kind. Treat this exposed skin exactly like the face: it must look like real, photographed human skin, fully solid and opaque, not a placeholder.

Also keep all glasses, tableware, reflections, pool water, and distant lights intact, and ensure realistic arm, wrist and hand anatomy.`
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
