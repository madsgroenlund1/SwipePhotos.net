/**
 * Template catalog — 42 professional model photos used as base images for face-swap.
 * Metadata was verified by visual inspection of every photo.
 *
 * HOW TO ADD YOUR OWN PHOTOS:
 *  1. Upload to Supabase bucket "references" (currently public)
 *  2. Add an entry below with full metadata
 *  3. Set active: true
 *  4. Set previewEligible: true for the 5 best photos (keep total at 5)
 */

export type FaceAngle   = 'frontal' | 'slight-left' | 'slight-right' | 'profile-left' | 'profile-right'
export type Expression  = 'smile' | 'slight-smile' | 'neutral' | 'serious' | 'confident' | 'candid'
export type Category    = 'city' | 'casual' | 'outdoor' | 'formal' | 'restaurant'
export type Crop        = 'close-up' | 'bust' | 'half-body' | 'three-quarter' | 'full-body'
export type LightType   = 'natural' | 'golden-hour' | 'studio' | 'ambient' | 'backlit'

export type Template = {
  id: string
  url: string
  bucket: 'public' | 'private'
  category: Category
  setting: string
  expression: Expression
  faceAngle: FaceAngle
  lightType: LightType
  crop: Crop
  hasGlasses: boolean
  hasBeard: boolean
  quality: number
  active: boolean
  previewEligible: boolean
  skinTone: 'any' | 'light' | 'medium' | 'dark'
  isMannequin?: boolean
}

const BASE = 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references'

export const TEMPLATES: Template[] = [

  // ── Formal / hotel / museum (7 photos) ────────────────────────────────────
  {
    id: 'formal-01',
    url: `${BASE}/536607362.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Museum event hall dinner',
    expression: 'slight-smile',
    faceAngle: 'slight-right',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'formal-02',
    url: `${BASE}/536640715.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Museum event hall dinner',
    expression: 'slight-smile',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'formal-03',
    url: `${BASE}/model-610581112.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Louvre museum gallery',
    expression: 'confident',
    faceAngle: 'slight-left',
    lightType: 'ambient',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'formal-04',
    url: `${BASE}/model-651983567.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Luxury hotel bathroom marble',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'studio',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'formal-05',
    url: `${BASE}/model-656788933.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Luxury tailor boutique',
    expression: 'slight-smile',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'formal-06',
    url: `${BASE}/model-708999683.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Luxury yacht cabin red accent',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'studio',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'formal-07',
    url: `${BASE}/model-710537485.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'Luxury yacht cabin doorway',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'studio',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },

  // ── City / urban streets (16 photos) ──────────────────────────────────────
  {
    id: 'city-01',
    url: `${BASE}/670580191.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Metro escalator',
    expression: 'candid',
    faceAngle: 'slight-right',
    lightType: 'ambient',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 7,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-02',
    url: `${BASE}/671193930.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Metro train',
    expression: 'slight-smile',
    faceAngle: 'slight-left',
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
    id: 'city-03',
    url: `${BASE}/model-566594022.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Venice canal bridge night',
    expression: 'confident',
    faceAngle: 'slight-left',
    lightType: 'ambient',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-04',
    url: `${BASE}/model-590915174.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Barcelona city street',
    expression: 'confident',
    faceAngle: 'slight-left',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-05',
    url: `${BASE}/model-601551406.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'European cobblestone alley',
    expression: 'neutral',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-06',
    url: `${BASE}/model-609644343.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'European alley looking at phone',
    expression: 'candid',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 5,
    active: false,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-07',
    url: `${BASE}/model-653691675.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Building entrance doorway',
    expression: 'neutral',
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
    id: 'city-08',
    url: `${BASE}/model-671108876.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Rome Colosseum',
    expression: 'neutral',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'city-09',
    url: `${BASE}/model-671250925.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Museum steps Naples',
    expression: 'candid',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-10',
    url: `${BASE}/model-703861624.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Italian building entrance Milan',
    expression: 'serious',
    faceAngle: 'slight-left',
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
    id: 'city-11',
    url: `${BASE}/model-715412525.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Italian village rustic doorway',
    expression: 'slight-smile',
    faceAngle: 'slight-left',
    lightType: 'natural',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'city-12',
    url: `${BASE}/model-724685144.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Milan outdoor restaurant terrace',
    expression: 'candid',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-13',
    url: `${BASE}/model-726838267.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Italian building doorway',
    expression: 'neutral',
    faceAngle: 'slight-right',
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
    id: 'city-14',
    url: `${BASE}/model-727190138.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Luxury store front Milan',
    expression: 'neutral',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-15',
    url: `${BASE}/model-728893385.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Vienna city street Palais Dorotheum',
    expression: 'candid',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'city-16',
    url: `${BASE}/model-731736194.jpg`,
    bucket: 'public',
    category: 'city',
    setting: 'Steps in front of ornate door',
    expression: 'serious',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },

  // ── Outdoor / yacht / beach / pool (8 photos) ─────────────────────────────
  {
    id: 'outdoor-01',
    url: `${BASE}/model-568282345.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Waterfront dock canal',
    expression: 'neutral',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'outdoor-02',
    url: `${BASE}/model-610613378.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Concrete wall urban',
    expression: 'neutral',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'outdoor-03',
    url: `${BASE}/model-671808132.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Moroccan market souk',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'three-quarter',
    hasGlasses: true,
    hasBeard: false,
    quality: 6,
    active: false,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'outdoor-04',
    url: `${BASE}/model-682657360.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Infinity pool Mediterranean sunset',
    expression: 'neutral',
    faceAngle: 'slight-left',
    lightType: 'golden-hour',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 10,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'outdoor-05',
    url: `${BASE}/model-705365478.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Outdoor brand event cafe',
    expression: 'neutral',
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
    id: 'outdoor-06',
    url: `${BASE}/model-706035720.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Yacht marina two people sunglasses',
    expression: 'serious',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: true,
    hasBeard: false,
    quality: 3,
    active: false,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'outdoor-07',
    url: `${BASE}/model-708089048.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Yacht deck Mediterranean',
    expression: 'confident',
    faceAngle: 'slight-right',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: true,
    hasBeard: false,
    quality: 7,
    active: false,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'outdoor-08',
    url: `${BASE}/model-708793199.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Luxury yacht interior lounge',
    expression: 'smile',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'outdoor-09',
    url: `${BASE}/model-731072445.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'Venice piazza football',
    expression: 'candid',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'full-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 5,
    active: false,
    previewEligible: false,
    skinTone: 'any',
  },

  // ── Restaurant / café (9 photos) ──────────────────────────────────────────
  {
    id: 'restaurant-01',
    url: `${BASE}/headshot-restaurant.webp`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Trendy restaurant bar with plants',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: true,
    quality: 9,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-02',
    url: `${BASE}/model-643582149.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Ornate classic European restaurant',
    expression: 'candid',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 5,
    active: false,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-03',
    url: `${BASE}/model-656384899.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Japanese sushi restaurant',
    expression: 'slight-smile',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-04',
    url: `${BASE}/model-658442365.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Japanese sushi restaurant',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-05',
    url: `${BASE}/model-670874313.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Ornate Moroccan restaurant',
    expression: 'smile',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 9,
    active: true,
    previewEligible: true,
    skinTone: 'any',
  },
  {
    id: 'restaurant-06',
    url: `${BASE}/model-670986892.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Ornate Moroccan restaurant',
    expression: 'serious',
    faceAngle: 'slight-left',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-07',
    url: `${BASE}/model-687476205.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Rustic stone wall restaurant booth',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-08',
    url: `${BASE}/model-704784546.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Outdoor brand event two people',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 3,
    active: false,
    previewEligible: false,
    skinTone: 'any',
  },
  {
    id: 'restaurant-09',
    url: `${BASE}/model-710423421.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Modern restaurant red bar',
    expression: 'serious',
    faceAngle: 'slight-left',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 8,
    active: true,
    previewEligible: false,
    skinTone: 'any',
  },

  // ── Casual / relaxed (1 photo) ────────────────────────────────────────────
  {
    id: 'casual-01',
    url: `${BASE}/model-689274595.jpg`,
    bucket: 'public',
    category: 'casual',
    setting: 'Hotel mirror selfie',
    expression: 'serious',
    faceAngle: 'frontal',
    lightType: 'ambient',
    crop: 'half-body',
    hasGlasses: false,
    hasBeard: false,
    quality: 5,
    active: false,
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
 * Pick 5 preview templates focused on the customer's chosen style/category.
 * Returns templates primarily from that category, padding with variety from others.
 */
export function getPreviewTemplatesForCategory(category: string): Template[] {
  const resolved = (STYLE_TO_CATEGORY[category] ?? category) as Category
  const pool = TEMPLATES.filter(t => t.active).sort((a, b) => b.quality - a.quality)

  const primary = pool.filter(t => t.category === resolved)
  const secondary = pool.filter(t => t.category !== resolved)

  // Take as many as possible from the primary category (up to 5), pad with variety
  const picked: Template[] = [
    ...primary.slice(0, 5),
    ...secondary.slice(0, Math.max(0, 5 - primary.length)),
  ]

  return picked.slice(0, 5)
}

/**
 * Pick up to `count` templates for the paid photo set.
 * Prioritises variety: different categories, expressions, crops, face angles.
 * Put preferredCategory first.
 */
// Map onboarding style IDs that don't exactly match template categories
const STYLE_TO_CATEGORY: Record<string, Category> = {
  rooftop: 'outdoor',
  beach:   'outdoor',
}

export function pickPaidTemplates(preferredCategory?: string, count = 20): Template[] {
  const pool = getActiveTemplates().sort((a, b) => b.quality - a.quality)

  const resolved = preferredCategory
    ? (STYLE_TO_CATEGORY[preferredCategory] ?? preferredCategory as Category)
    : undefined

  const preferred = pool.filter(t => t.category === resolved)
  const rest = pool.filter(t => t.category !== resolved)

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
 * Rotates through all customer uploads so each template uses a different source photo.
 */
export function pickCustomerPhotoForTemplate(
  customerPhotoUrls: string[],
  templateIndex: number
): string {
  if (!customerPhotoUrls.length) throw new Error('No customer photos')
  return customerPhotoUrls[templateIndex % customerPhotoUrls.length]
}
