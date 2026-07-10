/**
 * Template catalog — the 42 professional model photos that serve as base images
 * for face-swap. Metadata drives template selection, matching, and variation logic.
 *
 * HOW TO ADD YOUR OWN PHOTOS:
 *  1. Upload to Supabase private bucket called "templates"
 *  2. Get the file path (e.g. "model-001.jpg")
 *  3. Add an entry below with full metadata
 *  4. Set active: true
 *  5. Set previewEligible: true for the 5 best photos
 *
 * Signed URLs are fetched at runtime from /api/admin/templates/signed-url
 * so customers never have direct access to the originals.
 */

export type FaceAngle   = 'frontal' | 'slight-left' | 'slight-right' | 'profile-left' | 'profile-right'
export type Expression  = 'smile' | 'slight-smile' | 'neutral' | 'serious' | 'confident' | 'candid'
export type Category    = 'city' | 'casual' | 'outdoor' | 'formal' | 'restaurant'
export type Crop        = 'close-up' | 'bust' | 'half-body' | 'three-quarter' | 'full-body'
export type LightType   = 'natural' | 'golden-hour' | 'studio' | 'ambient' | 'backlit'

export type Template = {
  id: string
  /** Public URL (Supabase public bucket) or path in private bucket */
  url: string
  /** For admin: which bucket — 'public' uses url directly, 'private' fetches signed URL */
  bucket: 'public' | 'private'
  category: Category
  /** Human-readable setting for display */
  setting: string
  expression: Expression
  faceAngle: FaceAngle
  lightType: LightType
  crop: Crop
  hasGlasses: boolean
  hasBeard: boolean
  /** Our subjective quality score 1–10. Use to rank tie-breaks. */
  quality: number
  /** Whether this photo is available for paying customers */
  active: boolean
  /** Whether this photo can appear in the free 5-photo preview */
  previewEligible: boolean
  /**
   * Loose skin-tone compatibility — 'any' means it works for all tones,
   * 'light' / 'dark' means it's better with that skin range.
   * Use to improve matching in the future.
   */
  skinTone: 'any' | 'light' | 'medium' | 'dark'
}

// ─── Current catalog (37 photos) ─────────────────────────────────────────────
// These reference the existing Supabase public storage.
// Replace url + set bucket: 'private' when you move to private storage.

const BASE = 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references'

export const TEMPLATES: Template[] = [

  // ── City / urban streets (11 photos) ──────────────────────────────────────
  {
    id: 'city-01',
    url: `${BASE}/model-566594022.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Urban street',
    expression: 'smile',
    faceAngle: 'slight-left',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'city-02',
    url: `${BASE}/model-590915174.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'City sidewalk',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-03',
    url: `${BASE}/model-601551406.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'European street',
    expression: 'candid',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-04',
    url: `${BASE}/model-656384899.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'City street corner',
    expression: 'confident',
    faceAngle: 'slight-left',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'city-05',
    url: `${BASE}/model-656788933.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Urban plaza',
    expression: 'candid',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-06',
    url: `${BASE}/model-682657360.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Street walk',
    expression: 'smile',
    faceAngle: 'slight-right',
    lightType: 'golden-hour',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'city-07',
    url: `${BASE}/model-703861624.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Urban wall',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-08',
    url: `${BASE}/model-704784546.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'European alley',
    expression: 'candid',
    faceAngle: 'slight-left',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-09',
    url: `${BASE}/model-708089048.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'City bench',
    expression: 'confident',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-10',
    url: `${BASE}/model-708793199.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Urban steps',
    expression: 'candid',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-11',
    url: `${BASE}/model-728893385.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'City at golden hour',
    expression: 'smile',
    faceAngle: 'frontal',
    lightType: 'golden-hour',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },

  // ── Casual / relaxed street (8 photos) ────────────────────────────────────
  {
    id: 'casual-01',
    url: `${BASE}/model-609644343.jpg`,
    bucket: 'public',
    category: 'casual',
    setting: 'Relaxed outdoors',
    expression: 'smile',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'casual-02',
    url: `${BASE}/model-610581112.jpg`,
    bucket: 'public',
    category: 'casual',
    setting: 'Casual street',
    expression: 'serious',
    faceAngle: 'slight-left',
    lightType: 'natural',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'casual-03',
    url: `${BASE}/model-610613378.jpg`,
    bucket: 'public',
    category: 'casual',
    setting: 'Leaning against wall',
    expression: 'candid',
    faceAngle: 'slight-right',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'casual-04',
    url: `${BASE}/model-671808132.jpg`,
    bucket: 'public',
    category: 'casual',
    setting: 'Park / open space',
    expression: 'confident',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'casual-05',
    url: `${BASE}/model-705365478.jpg`,
    bucket: 'public',
    category: 'casual',
    setting: 'Outdoor casual',
    expression: 'candid',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'casual-06',
    url: `${BASE}/model-706035720.jpg`,
    bucket: 'public',
    category: 'casual',
    setting: 'Casual walk',
    expression: 'smile',
    faceAngle: 'slight-left',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'casual-07',
    url: `${BASE}/model-715412525.jpg`,
    bucket: 'public',
    category: 'casual',
    setting: 'Sitting casually',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'casual-08',
    url: `${BASE}/model-731072445.jpg`,
    bucket: 'public',
    category: 'casual',
    setting: 'Rooftop casual',
    expression: 'candid',
    faceAngle: 'slight-right',
    lightType: 'golden-hour',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },

  // ── Outdoor / waterfront / harbour (7 photos) ─────────────────────────────
  {
    id: 'outdoor-01',
    url: `${BASE}/model-568282345.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Waterfront',
    expression: 'smile',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'outdoor-02',
    url: `${BASE}/model-643582149.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Harbour view',
    expression: 'serious',
    faceAngle: 'slight-left',
    lightType: 'natural',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'outdoor-03',
    url: `${BASE}/model-658442365.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Nature park',
    expression: 'candid',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'outdoor-04',
    url: `${BASE}/model-687476205.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Outdoor adventure',
    expression: 'confident',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'outdoor-05',
    url: `${BASE}/model-689274595.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Forest / trees',
    expression: 'candid',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'outdoor-06',
    url: `${BASE}/model-710537485.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Golden hour beach / water',
    expression: 'smile',
    faceAngle: 'slight-left',
    lightType: 'golden-hour',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'outdoor-07',
    url: `${BASE}/model-731736194.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Countryside',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },

  // ── Formal / hotel / suit (4 photos) ──────────────────────────────────────
  {
    id: 'formal-01',
    url: `${BASE}/model-651983567.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Hotel lobby',
    expression: 'confident',
    faceAngle: 'slight-left',
    lightType: 'studio',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'formal-02',
    url: `${BASE}/model-653691675.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Business setting',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'studio',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'formal-03',
    url: `${BASE}/model-708999683.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Smart event',
    expression: 'smile',
    faceAngle: 'slight-right',
    lightType: 'ambient',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'formal-04',
    url: `${BASE}/model-710423421.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Rooftop bar / terrace',
    expression: 'candid',
    faceAngle: 'frontal',
    lightType: 'golden-hour',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },

  // ── Extra uploads (5 photos — newly added to Supabase) ───────────────────
  // Metadata is a best guess — update faceAngle / expression / crop once you've reviewed the photos
  {
    id: 'extra-01',
    url: `${BASE}/536607362.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Urban street',
    expression: 'confident',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'extra-02',
    url: `${BASE}/536640715.jpg`,
    bucket: 'public',
    category: 'casual',
    setting: 'Casual outdoor',
    expression: 'smile',
    faceAngle: 'slight-left',
    lightType: 'natural',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'extra-03',
    url: `${BASE}/670580191.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Outdoor setting',
    expression: 'candid',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'extra-04',
    url: `${BASE}/671193930.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Smart setting',
    expression: 'serious',
    faceAngle: 'slight-right',
    lightType: 'ambient',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'extra-05',
    url: `${BASE}/headshot-restaurant.webp`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Restaurant headshot',
    expression: 'smile',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'close-up',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },

  // ── Restaurant / café (7 photos) ──────────────────────────────────────────
  {
    id: 'restaurant-01',
    url: `${BASE}/model-670874313.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Italian restaurant',
    expression: 'smile',
    faceAngle: 'slight-left',
    lightType: 'ambient',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'restaurant-02',
    url: `${BASE}/model-670986892.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Wine bar',
    expression: 'candid',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-03',
    url: `${BASE}/model-671108876.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Café terrace',
    expression: 'candid',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-04',
    url: `${BASE}/model-671250925.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Restaurant interior',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-05',
    url: `${BASE}/model-724685144.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Fine dining',
    expression: 'confident',
    faceAngle: 'slight-left',
    lightType: 'ambient',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-06',
    url: `${BASE}/model-726838267.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Outdoor café',
    expression: 'smile',
    faceAngle: 'slight-right',
    lightType: 'golden-hour',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-07',
    url: `${BASE}/model-727190138.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Brunch spot',
    expression: 'candid',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'bust',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getActiveTemplates(): Template[] {
  return TEMPLATES.filter(t => t.active)
}

export function getPreviewTemplates(): Template[] {
  const previews = TEMPLATES.filter(t => t.active && t.previewEligible)
  // Ensure variety across categories in the 5 preview slots
  const byCategory: Record<string, Template[]> = {}
  for (const t of previews) {
    byCategory[t.category] ??= []
    byCategory[t.category].push(t)
  }
  const picked: Template[] = []
  const cats = Object.keys(byCategory)
  let i = 0
  while (picked.length < 5 && i < 20) {
    const cat = cats[i % cats.length]
    const pool = byCategory[cat]
    if (pool?.length) picked.push(pool.shift()!)
    i++
  }
  // Fill remaining with highest quality if not enough previewEligible
  if (picked.length < 5) {
    const remaining = TEMPLATES
      .filter(t => t.active && !picked.includes(t))
      .sort((a, b) => b.quality - a.quality)
    picked.push(...remaining.slice(0, 5 - picked.length))
  }
  return picked.slice(0, 5)
}

/**
 * Pick up to `count` templates for the paid photo set.
 * Prioritises variety: different categories, expressions, crops, face angles.
 * Put preferredCategory first.
 */
export function pickPaidTemplates(preferredCategory?: string, count = 20): Template[] {
  const pool = getActiveTemplates().sort((a, b) => b.quality - a.quality)

  const preferred = pool.filter(t => t.category === preferredCategory)
  const rest = pool.filter(t => t.category !== preferredCategory)

  // Interleave: 40% preferred, 60% variety
  const preferredCount = Math.min(Math.round(count * 0.4), preferred.length)
  const selectedPreferred = preferred.slice(0, preferredCount)
  const selectedRest = pickVaried(rest, count - selectedPreferred.length)

  return [...selectedPreferred, ...selectedRest].slice(0, count)
}

/**
 * Select templates maximising variety across category, expression, crop, and face angle.
 */
function pickVaried(pool: Template[], count: number): Template[] {
  const result: Template[] = []
  const usedCats = new Set<string>()
  const usedExpressions = new Set<string>()
  const usedAngles = new Set<string>()
  const usedCrops = new Set<string>()

  // First pass: pick one of each expression
  for (const expr of ['smile', 'serious', 'confident', 'candid', 'neutral', 'slight-smile'] as const) {
    if (result.length >= count) break
    const match = pool.find(t => t.expression === expr && !result.includes(t))
    if (match) result.push(match)
  }

  // Second pass: fill remaining with variety
  for (const t of pool) {
    if (result.length >= count) break
    if (result.includes(t)) continue
    const novelty =
      (!usedCats.has(t.category) ? 2 : 0) +
      (!usedExpressions.has(t.expression) ? 1 : 0) +
      (!usedAngles.has(t.faceAngle) ? 1 : 0) +
      (!usedCrops.has(t.crop) ? 1 : 0)
    if (novelty > 0 || result.length < count) {
      result.push(t)
      usedCats.add(t.category)
      usedExpressions.add(t.expression)
      usedAngles.add(t.faceAngle)
      usedCrops.add(t.crop)
    }
  }

  return result.slice(0, count)
}

/**
 * Pick the best customer upload URL for a given template.
 * Strategy: rotate through available photos to use variety, but also
 * prefer photos where face angle likely matches the template.
 *
 * Without face-angle detection API, we cycle through uploads per template index.
 */
export function pickCustomerPhotoForTemplate(
  customerPhotoUrls: string[],
  templateIndex: number
): string {
  if (!customerPhotoUrls.length) throw new Error('No customer photos')
  // Round-robin so each template may use a different source photo
  return customerPhotoUrls[templateIndex % customerPhotoUrls.length]
}
