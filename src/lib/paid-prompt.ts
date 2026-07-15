// ─── Bulletproof, reusable prompt for PAID generation (real model photos) ────
//
// Used for every image in every Produktet/<Month>/<Tier> folder, for every
// month going forward. One prompt, no per-photo customisation needed — the
// reference photo itself (image #1) supplies the scene, pose, camera angle,
// head size, face direction and expression. The model in that photo is the
// reference frame the customer's identity gets locked onto.
//
// Do not fork this per scene. If a specific photo needs special handling,
// fix it by choosing a better reference photo — not by writing a one-off
// prompt.
//
// PRIORITY ORDER (rewritten after a QC pass found consistent identity
// failures — wrong eye color, wrong head size, faces of BYSTANDERS in the
// scene being altered): identity accuracy comes before speed, before scene
// variety, before everything. A photo with a perfect scene but a face that
// isn't the customer is a failed photo, full stop.

// The single most-violated rule across every prompt in this app is eye
// color — logs show the model repeatedly rendering blue eyes despite
// explicit, correct instructions elsewhere. That happened because the
// instruction lived at the END of a long prompt; models reliably
// under-weight facts buried after everything else. Stating it as the VERY
// FIRST thing (and repeating it at the end) fixes that positional bias.
// Every caller (paid generation AND the free preview) must prepend this,
// never append it.
export function eyeColorHeader(eyeColor: string): string {
  return `⚠️ MOST IMPORTANT RULE, READ FIRST — EYE COLOR ⚠️
The customer's real, confirmed eye color is: ${eyeColor}. His eyes in the final image MUST be exactly this color. Do not render blue, gray, or green eyes unless "${eyeColor}" literally says so — this is the single most common mistake and an automatic reject if wrong. Keep this in mind for every step below.

`
}

/** @deprecated kept only so old call sites still compile — prepend eyeColorHeader() instead of appending this. */
export function eyeColorNote(eyeColor: string): string {
  return `CONFIRMED FACT — the customer's real eye color, verified from his reference photos, is: ${eyeColor}. Render his eyes in exactly this color. Do not use blue, gray, green or any other color unless that is literally the color stated here.`
}

export function buildPaidGenerationPrompt(hasTattooRef: boolean, eyeColor?: string): string {
  const header = eyeColor ? eyeColorHeader(eyeColor) : ''

  return `${header}You are compositing ONE specific real customer into a reference photograph. Precision on his identity matters more than anything else in this task — take your time, this is not a race.

Image #1 is the reference frame: a real photograph of a professional model, in a specific scene. Image #1 defines the exact scene, composition, camera angle, framing, crop, camera distance, pose, body position, clothing, props and lighting. None of that changes.

The remaining images are reference photos of the real customer — his face from multiple angles, and (if present) his full body and his tattoos. These are the ONLY source of truth for what his face looks like. Study them closely before generating anything.

═══════════════════════════════════════════════════════════════
STEP 1 — LOCK THE HEAD FRAME FROM IMAGE #1 (do this first)
═══════════════════════════════════════════════════════════════
Before touching identity, lock these purely geometric properties from the model in image #1, and never deviate from them:
- Head size relative to the body and frame — measure the model's head in image #1 (crown to chin) and reproduce that exact size. Do not enlarge or shrink the head. An oversized, undersized, or oddly-proportioned head compared to image #1 is an automatic failure.
- Head position, tilt, and rotation — identical angle and direction as image #1.
- Eye gaze direction — the customer's eyes must look in the exact same direction as the model's eyes in image #1 (same target, same angle off-camera or same direct-to-camera look). Gaze direction is judged separately from head rotation — get both right.
- Both eyes must point in the SAME coherent direction as each other — natural binocular alignment, like a real person looking at one point. Cross-eyed, wall-eyed, or misaligned eyes (each eye pointing a different way) is a hard failure and an instant reject, regardless of how good the rest of the face looks.
- Camera distance and framing — identical.

═══════════════════════════════════════════════════════════════
STEP 2 — REPLACE THE FACE WITH THE CUSTOMER'S FACE, 1:1
═══════════════════════════════════════════════════════════════
Within that locked head frame, the face itself must be the customer's real face, reconstructed with the same precision as a passport photo comparison — not "similar," not "inspired by," an exact match. This has been getting flagged as still not looking like the actual customer — treat every one of these as strict, individually-checked requirements, not general inspiration:
- Eye color: use the customer's ACTUAL eye color from his reference photos. Look closely at the reference photos and match the exact shade (e.g. brown, blue, green, hazel) — do not default to a generic or lighter/different eye color. Wrong eye color is one of the most common failures and an instant reject.
- Face shape, jawline, chin, and cheekbones — trace the customer's real bone structure, not a smoothed or generic oval.
- Eyebrows — shape, thickness, and color must match.
- Nose — exact shape and size from the reference photos.
- Lips and mouth shape — match the customer's, not the model's.
- Ears — shape and size must match, visible where the scene shows them.
- Hairline, hair color, and hair texture — from the reference photos.
- Skin tone and skin texture — from the reference photos, consistent across face, neck, and any exposed skin.
- Freckles, moles, or other distinguishing marks visible in the reference photos should be reproduced if that part of the face is visible in the final framing.

Cross-check: after generating, mentally compare the result side-by-side with the customer's own reference photos. If a family member would hesitate to recognize him, it has failed — regenerate that mental image before finalizing.

═══════════════════════════════════════════════════════════════
STEP 3 — TOUCH NOTHING AND NO ONE ELSE
═══════════════════════════════════════════════════════════════
This is critical and has been a repeated mistake: ONLY the primary subject (the person wearing the model's clothing / in the model's pose from image #1) gets his identity replaced. Every other person visible anywhere in image #1's scene — bystanders, other customers, staff, people in the background or blurred out of focus — MUST be left completely untouched, pixel-identical to image #1. Do not alter their faces, do not "improve" them, do not swap any other person's identity for anything. If you are not certain whether a figure in the scene is the primary subject, treat it as a bystander and leave it alone.

═══════════════════════════════════════════════════════════════
STEP 4 — HANDS, BODY AND BUILD MATCH THE CUSTOMER
═══════════════════════════════════════════════════════════════
The customer's full-body reference photo is the ONLY source of truth for his build — not the template model's body in image #1, not what would "look good" in the scene. This is a common and repeated mistake: giving a slim customer a muscular body because the template model is muscular. That is wrong every time. His body in the final image must look like the SAME PERSON as his full-body reference photo, dropped into image #1's pose and clothing — not the template model's physique with his face attached.
- Look at the customer's actual build in his full-body photo first: is he slim, average, stocky, muscular? Reproduce THAT — do not add muscle, do not add bulk, do not add definition that isn't visible in his own reference photo, even if the template model is more muscular. If he is slim, the result must look slim in that exact pose/clothing.
- SPECIFIC AND REPEATED FAILURE — bare/exposed arms: whenever image #1's clothing exposes bare skin on the arms (short sleeves, rolled-up sleeves, tank tops, open jackets), this is where muscle gets wrongly added most often. Look specifically at the customer's arms in his full-body photo — the actual thickness of his upper arm and forearm, how defined or undefined the muscle is, how much (if any) visible vein or tendon definition there is — and reproduce exactly that thickness and shape. A slim or average arm must stay slim/average even in a tight short sleeve; do not fill out the sleeve with added muscle just because it "looks better" in the scene.
- Use the customer's full-body reference photo for his actual hand shape, finger length and thickness, knuckle size, and any hand/finger hair.
- Match visible vein patterns on hands/forearms only if they are actually visible in his reference photos — do not invent them.
- Keep skin tone consistent between face, neck, hands and any other exposed skin — one real person, not a lighter/more airbrushed body than the face.

═══════════════════════════════════════════════════════════════
ACCESSORIES
═══════════════════════════════════════════════════════════════
- If the customer has a clearly visible personal watch in his reference photos, reproduce that watch instead of any watch in image #1. Otherwise keep image #1's watch/accessories unchanged, rendered as real metal/glass with believable reflections — never flat or plastic-looking.
- If the model in image #1 is wearing sunglasses (or any other eyewear), the customer must wear that exact same eyewear, in the same position on his face — never remove it, never leave him bare-eyed. With sunglasses on, identity must still be locked through every other visible feature (face shape, eyebrows, nose, lips, jawline, cheekbones, chin, ears, hairline, skin tone) with the same precision as when the eyes are visible. If image #1 has no eyewear, do not add any.

═══════════════════════════════════════════════════════════════
REALISM — must look like a real, unedited photograph
═══════════════════════════════════════════════════════════════
- Natural skin with visible pores, subtle imperfections, and realistic shadow falloff consistent with image #1's lighting. No plastic, waxy, airbrushed, or "AI-smooth" skin.
- No mismatched lighting between face and body, no warped or malformed hands, no extra or missing fingers, no blurred or duplicated ears/hairline, no double edges, no floating hair strands, no gray or CGI undertone anywhere.
- Seamless blending at the hairline, ears, jaw, neck and wrists — no visible seams or compositing artifacts.
- Do not idealise, slim, smooth or beautify the face. Reproduce the exact real person, imperfections included.

═══════════════════════════════════════════════════════════════
TATTOOS
═══════════════════════════════════════════════════════════════
- If the MODEL in image #1 has any visible tattoo on their arms, hands, neck, chest or anywhere else, that tattoo belongs to the model, NOT the customer. Remove it completely and replace it with clean, plain skin matching the customer's real skin tone and texture. Never let the model's tattoo carry over onto the customer.
${hasTattooRef
  ? '- A tattoo reference photo of the CUSTOMER is included. Reproduce the customer\'s own tattoo(s) faithfully — correct design, correct location, correct scale — on the visible skin wherever that body part is exposed in image #1.'
  : '- No tattoo reference photo was provided for the customer, so he should show no tattoos at all in the result. Do not invent tattoos and do not keep the model\'s original tattoos.'}

FINAL BAR: this must be 1:1. Nobody should be able to look at the result and the customer's own reference photos and tell which parts came from where — same eye color, same hair, same face, same gaze direction, same real build from his full-body photo. The final image must look like one real, unedited photograph of this exact customer, taken in the exact setting, pose and moment shown in image #1, with every other person in the scene completely unchanged.${eyeColor ? `\n\nLAST CHECK BEFORE YOU FINISH: eyes must be "${eyeColor}" — this was stated at the top of this prompt and is the single most common mistake. Verify it now.` : ''}`
}
