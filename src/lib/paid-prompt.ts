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

export function buildPaidGenerationPrompt(hasTattooRef: boolean): string {
  return `Image #1 is the reference frame: a real photograph of a professional model. Image #1 defines the exact scene, composition, camera angle, framing, crop, camera distance, pose, body position, clothing, props and lighting. Do not change any of that.

The remaining images are reference photos of the real customer from different angles (and, if present, his full body and his tattoos). Use all of them together to reconstruct his exact identity: face shape, eyes and eye color, eyebrows, nose, lips, jawline, cheekbones, chin, ears, hairline, hair color and hairstyle, skin tone and skin texture, hands and finger shape, and arm/forearm proportions.

Hands and visible body must match the customer, not the template model or a generic idealised body. Check the customer's full-body reference photo carefully and carry over: his actual hand shape, finger length and thickness, knuckle size, and any hand/finger hair. Match his real muscle definition and build — if he is lean, do not add muscle; if he visibly has noticeable muscle or forearm/vein definition in his reference photos, keep that, don't smooth it away. Match visible vein patterns on hands/forearms if present. Keep skin tone consistent between face, neck, hands and any other exposed skin — these must all look like the same real person, not a lighter or more "airbrushed" body than the face.

Replace ONLY the person's face, head, hair, skin, hands and arms in image #1 with the customer's real identity from the reference photos. Do not change the pose, body position, clothing, framing, camera angle, background, or any scene object from image #1.

Critical matching rules — these override everything else:
- Head size and head-to-body ratio must exactly match the model in image #1. Do not enlarge, shrink, or reposition the head.
- Face direction and gaze must exactly match the model in image #1 — same angle, same tilt, same direction of gaze, same camera distance from the face.
- Facial expression must exactly match the model in image #1 — same mouth position, same eye openness, same overall mood. Do not invent a different expression than the one in image #1.
- Use the customer's real skin tone from his reference photos, not the original model's skin tone.
- If the customer has a clearly visible personal watch in his reference photos, reproduce that watch instead of any watch in image #1. Otherwise keep image #1's watch/accessories unchanged.
- If the model in image #1 is wearing sunglasses (or any other eyewear), the customer must wear that exact same eyewear in the same position on his face — do not remove it and do not leave him bare-eyed. Match the customer's identity through his other visible features (face shape, eyebrows, nose, lips, jawline, cheekbones, chin, ears, hairline, skin tone) exactly as precisely as when the eyes are visible. If image #1 has no eyewear, do not add any.

Realism requirements — the result must be indistinguishable from an authentic, unedited photograph, never AI-generated, never illustrated, never airbrushed:
- Natural skin with visible pores, subtle imperfections, and realistic shadow falloff consistent with image #1's lighting.
- No plastic or waxy skin texture, no mismatched lighting between face and body, no warped or malformed hands, no extra or missing fingers, no blurred or duplicated ears/hairline, no double edges, no floating hair strands, no gray or CGI undertone anywhere on the skin.
- Avoid the classic "too perfect" AI look: keep natural micro-texture and slight tonal variation in the skin, especially around the mouth, cheeks and eyes when smiling — do not smooth it into a flat, retouched, plastic surface. Keep natural smile lines and creases.
- Seamless blending at the hairline, ears, jaw, neck and wrists — no visible seams or compositing artifacts.
- Do not idealise, slim, smooth or beautify the face. Reproduce the exact real person.
Tattoos — read carefully, this is a common mistake:
- If the MODEL in image #1 has any visible tattoo on their arms, hands, neck, chest or anywhere else, that tattoo belongs to the model, NOT the customer. Remove it completely and replace it with clean, plain skin matching the customer's real skin tone and texture. Never let the model's tattoo carry over onto the customer.
${hasTattooRef
  ? '- A tattoo reference photo of the CUSTOMER is included. Reproduce the customer\'s own tattoo(s) faithfully — correct design, correct location, correct scale — on the visible skin wherever that body part is exposed in image #1.'
  : '- No tattoo reference photo was provided for the customer, so he should show no tattoos at all in the result. Do not invent tattoos and do not keep the model\'s original tattoos.'}

The final image must look like one real, unedited photograph of this exact person, taken in the exact setting, pose and moment shown in image #1.`
}
