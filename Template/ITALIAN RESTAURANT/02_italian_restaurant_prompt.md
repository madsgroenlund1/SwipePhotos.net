# Italian Restaurant / Pizza Setting – fal-ai/seedream-5-pro/edit

## How to use this file in fal-ai/seedream-5-pro/edit

**Recommended image order inside fal:**
1. **Template image** = the mannequin/template photo for this setting.
2. **Customer photo – full body** = clear full-body photo, head to shoes.
3. **Customer photo – left angle** = customer turned slightly left.
4. **Customer photo – front** = customer facing the camera directly.
5. **Customer photo – right angle** = customer turned slightly right.
6. **Optional tattoo photo** = only if the customer has visible tattoos that must be reproduced.

**Important global rules for every output:**
- The result must look like a **real photograph**, not AI-generated.
- The customer must look like the **same person in all outputs**.
- Match the customer’s **face shape, eye color, skin tone, skin texture, hair color, hairline, eyebrows, nose, lips, jawline, and overall identity** as closely as possible.
- Use the customer’s **three face-angle photos** heavily to lock identity and realism.
- Keep the customer’s head size and body proportions **consistent with the template**.
- Keep the customer looking in **the same direction as the template model**.
- Preserve the template’s **pose, framing, composition, outfit style, environment, props, and camera angle**, unless the prompt explicitly says otherwise.
- If the customer is wearing a **clearly visible personal watch** in the input photos, reproduce **that watch** instead of the template watch. If no watch is clearly visible, keep the template watch unchanged.
- If the customer provides a **tattoo photo** or clearly visible tattoos, reproduce them accurately in the correct location, scale, and orientation. If no tattoo input is provided, do **not** invent tattoos.
- Maintain natural skin detail: subtle pores, natural highlights, realistic shadows, believable texture, and clean blending at the hairline, ears, neck, wrists, and hands.
- Avoid all common edit errors: no warped face, no wrong eye color, no wrong skin tone, no mismatched neck, no extra fingers, no broken hands, no floating props, no blurred facial features, no AI artifacts, and no leftover gray mannequin material.
- The face swap must be **seamless** and must look like the customer was truly photographed in that scene.


## Template-specific notes
- Preserve the intimate Italian street-restaurant atmosphere with the pizza in the foreground, white linen shirt, tableware, and narrow street background.
- Keep the customer leaning forward exactly like the template, with the same shoulder angle and head tilt.
- Preserve the visible forearms and hands.
- Keep the expression subtle and believable, with natural restaurant lighting and realistic skin tones.

## Prompt A – Neutral / calm expression
```text
Use the first image as the template scene and composition reference, and use the customer photos as identity references. Replace the mannequin/template person with the customer while keeping the exact Italian restaurant scene, camera angle, framing, head tilt, leaning-forward pose, body proportions, white linen shirt, pizza foreground, plates, glasses, and ambient street background.

Make the result photorealistic and believable, as if the customer was truly photographed in this restaurant. Match the customer’s identity very precisely using all customer references: same face shape, eyes, eyebrows, nose, lips, cheekbones, skin tone, skin texture, hair color, hairline, and jawline. Keep the customer looking in the same direction as the template and preserve the same head-size-to-body ratio as the template.

Expression: neutral and self-contained. Mouth closed. No teeth visible. The customer should look composed, calm, and slightly detached, not angry, not sad, and not smiling.

If the customer has a clearly visible personal watch in the reference photos, use that watch instead of the template watch if a watch is visible. If no watch is clearly visible, keep the template styling. If a tattoo photo is provided, reproduce the tattoo accurately in the correct location. If no tattoo photo is provided, do not invent tattoos.

Critical realism requirements: natural skin detail, seamless face replacement, correct hand anatomy, realistic fingers, clean edges around hair and ears, consistent neck color, realistic shirt texture and folds, and no mannequin-gray areas. No AI artifacts, no warped mouth, no incorrect eye color, and no identity drift.
```

## Prompt B – Slight positive closed-mouth smile
```text
Use the first image as the template scene and composition reference, and use the customer photos as identity references. Replace the mannequin/template person with the customer while keeping the exact Italian restaurant scene, camera angle, framing, head tilt, leaning-forward pose, body proportions, white linen shirt, pizza foreground, plates, glasses, and ambient street background.

Make the result photorealistic and believable, as if the customer was truly photographed in this restaurant. Match the customer’s identity very precisely using all customer references: same face shape, eyes, eyebrows, nose, lips, cheekbones, skin tone, skin texture, hair color, hairline, and jawline. Keep the customer looking in the same direction as the template and preserve the same head-size-to-body ratio as the template.

Expression: slightly positive and natural. Closed-mouth smile only. No teeth visible. The customer should look subtly warm and relaxed, not overly happy and not exaggerated.

If the customer has a clearly visible personal watch in the reference photos, use that watch instead of the template watch if a watch is visible. If no watch is clearly visible, keep the template styling. If a tattoo photo is provided, reproduce the tattoo accurately in the correct location. If no tattoo photo is provided, do not invent tattoos.

Critical realism requirements: natural skin detail, seamless face replacement, correct hand anatomy, realistic fingers, clean edges around hair and ears, consistent neck color, realistic shirt texture and folds, and no mannequin-gray areas. No AI artifacts, no warped mouth, no incorrect eye color, and no identity drift.
```
