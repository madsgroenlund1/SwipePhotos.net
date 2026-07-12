/**
 * Template catalog — model photos used as base images for identity generation.
 *
 * The catalog is built from the ACTUAL contents of the Supabase "references"
 * bucket (files are stored under descriptive names without extensions).
 *
 * HOW TO ADD YOUR OWN PHOTOS:
 *  1. Upload to Supabase bucket "references" (currently public)
 *  2. Add an entry to CATALOG below (name must match the bucket object name)
 *  3. previewEligible is reserved for the 4 mannequin templates
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

// ─── Catalog data ─────────────────────────────────────────────────────────────
// name = exact object name in the bucket (no extension). One entry per photo.

type CatalogEntry = {
  name: string
  category: Category
  setting: string
  quality?: number      // default 7
  lightType?: LightType // default 'natural'
  crop?: Crop           // default 'half-body'
}

const CATALOG: CatalogEntry[] = [
  // ── Restaurant ──────────────────────────────────────────────────────────
  { name: 'Restaurant (1)', category: 'restaurant', setting: 'upscale restaurant', quality: 8, lightType: 'ambient' },
  { name: 'Restaurant (2)', category: 'restaurant', setting: 'restaurant table', lightType: 'ambient' },
  { name: 'Restaurant (3)', category: 'restaurant', setting: 'restaurant table', lightType: 'ambient' },
  { name: 'Restaurant (4)', category: 'restaurant', setting: 'restaurant dinner', lightType: 'ambient' },
  { name: 'Restaurant (5)', category: 'restaurant', setting: 'restaurant dinner', lightType: 'ambient' },
  { name: 'Restaurant (6)', category: 'restaurant', setting: 'restaurant terrace', quality: 8 },
  { name: 'Restaurant (7)', category: 'restaurant', setting: 'restaurant table', lightType: 'ambient' },
  { name: 'Restaurant (8)', category: 'restaurant', setting: 'restaurant dinner', lightType: 'ambient' },
  { name: 'Restaurant (9)', category: 'restaurant', setting: 'restaurant table', lightType: 'ambient' },
  { name: 'Bar',            category: 'restaurant', setting: 'stylish cocktail bar', lightType: 'ambient' },

  // ── Formal ──────────────────────────────────────────────────────────────
  { name: 'Grey Suit (1)',          category: 'formal', setting: 'portrait in a tailored grey suit', quality: 8, lightType: 'studio' },
  { name: 'Grey Suit (2)',          category: 'formal', setting: 'portrait in a tailored grey suit', quality: 8, lightType: 'studio' },
  { name: "Men's Clothing Store",   category: 'formal', setting: "upscale men's clothing store", lightType: 'ambient' },
  { name: 'Art Gallery',            category: 'formal', setting: 'modern art gallery', lightType: 'ambient' },

  // ── City ────────────────────────────────────────────────────────────────
  { name: 'Sidewalk (1)',          category: 'city', setting: 'city sidewalk street', quality: 8 },
  { name: 'Sidewalk (2)',          category: 'city', setting: 'city sidewalk street' },
  { name: 'Sidewalk (3)',          category: 'city', setting: 'city sidewalk street' },
  { name: 'Sidewalk (4)',          category: 'city', setting: 'city sidewalk street' },
  { name: 'Sidewalk (5)',          category: 'city', setting: 'city sidewalk street' },
  { name: 'Sidewalk (6)',          category: 'city', setting: 'city sidewalk street' },
  { name: 'Bridge (1)',            category: 'city', setting: 'city bridge', quality: 8 },
  { name: 'Bridge (2)',            category: 'city', setting: 'city bridge' },
  { name: 'Gate (1)',              category: 'city', setting: 'historic city gate' },
  { name: 'Gate (2)',              category: 'city', setting: 'historic city gate' },
  { name: 'Old Town Thema',        category: 'city', setting: 'European old town street', quality: 8 },
  { name: 'Traffic Lights',        category: 'city', setting: 'urban street with traffic lights' },
  { name: 'Entrance (Building)',   category: 'city', setting: 'modern building entrance' },
  { name: 'Elevator',              category: 'city', setting: 'modern elevator', lightType: 'ambient' },
  { name: 'Underground (Escalator)', category: 'city', setting: 'metro station escalator', lightType: 'ambient' },
  { name: 'Underground (Metro)',   category: 'city', setting: 'metro station platform', lightType: 'ambient' },

  // ── Outdoor ─────────────────────────────────────────────────────────────
  { name: 'Boat',                    category: 'outdoor', setting: 'boat on the water', quality: 8 },
  { name: 'Boat (Social)',           category: 'outdoor', setting: 'social gathering on a boat', quality: 8 },
  { name: 'Pool View',               category: 'outdoor', setting: 'poolside with a scenic view', quality: 8 },
  { name: 'Colosseum',               category: 'outdoor', setting: 'the Colosseum in Rome' },
  { name: 'Fruit Market',            category: 'outdoor', setting: 'outdoor fruit market' },
  { name: 'Playing Ball (Sidewalk)', category: 'outdoor', setting: 'playing ball on a sidewalk', quality: 6 },

  // ── Casual ──────────────────────────────────────────────────────────────
  { name: 'Sofa',            category: 'casual', setting: 'sofa at home', lightType: 'ambient' },
  { name: 'Grey Wall',       category: 'casual', setting: 'minimal portrait against a grey wall', lightType: 'studio' },
  { name: 'Mirror',          category: 'casual', setting: 'mirror selfie', lightType: 'ambient' },
  { name: 'Mirror (Sixpack)', category: 'casual', setting: 'gym mirror selfie', quality: 6, lightType: 'ambient' },
  { name: 'Elevator Selfie', category: 'casual', setting: 'elevator mirror selfie', quality: 6, lightType: 'ambient' },
  { name: 'Basement',        category: 'casual', setting: 'industrial basement studio', lightType: 'ambient' },
  { name: 'Bathroom',        category: 'casual', setting: 'hotel bathroom mirror', quality: 6, lightType: 'ambient' },
]

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const CATALOG_TEMPLATES: Template[] = CATALOG.map((e): Template => ({
  id: slugify(e.name),
  url: `${BASE}/${encodeURIComponent(e.name)}`,
  bucket: 'public',
  category: e.category,
  setting: e.setting,
  expression: 'neutral',
  faceAngle: 'frontal',
  lightType: e.lightType ?? 'natural',
  crop: e.crop ?? 'half-body',
  hasGlasses: false,
  hasBeard: false,
  quality: e.quality ?? 7,
  active: true,
  previewEligible: false,
  skinTone: 'any',
}))

// ─── Mannequin templates (the 4 onboarding settings) ─────────────────────────
// Blank-head mannequin scenes — Seedream replaces the head with the customer's
// identity. These are the preview templates shown in onboarding.

const MANNEQUIN_TEMPLATES: Template[] = [
  {
    id: 'mannequin-italian-restaurant',
    url: `${BASE}/template-italian-restaurant.jpg`,
    bucket: 'public',
    category: 'restaurant',
    setting: 'Italian cobblestone street restaurant with pizza',
    expression: 'neutral',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 10,
    active: true,
    previewEligible: true,
    skinTone: 'any',
    isMannequin: true,
  },
  {
    id: 'mannequin-smart-formal',
    url: `${BASE}/template-smart-formal.jpg`,
    bucket: 'public',
    category: 'formal',
    setting: 'luxury hotel lounge sofa with whiskey glass and watch',
    expression: 'serious',
    faceAngle: 'slight-right',
    lightType: 'ambient',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 10,
    active: true,
    previewEligible: true,
    skinTone: 'any',
    isMannequin: true,
  },
  {
    id: 'mannequin-rooftop-pool',
    url: `${BASE}/template-rooftop-pool.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'rooftop infinity pool restaurant at dusk with wine glasses and city lights',
    expression: 'neutral',
    faceAngle: 'slight-left',
    lightType: 'golden-hour',
    crop: 'three-quarter',
    hasGlasses: false,
    hasBeard: false,
    quality: 10,
    active: true,
    previewEligible: true,
    skinTone: 'any',
    isMannequin: true,
  },
  {
    id: 'mannequin-beach-club',
    url: `${BASE}/template-beach-club.jpg`,
    bucket: 'public',
    category: 'outdoor',
    setting: 'beach club with macramé parasols, mojito drink, fruit platter and watch',
    expression: 'neutral',
    faceAngle: 'frontal',
    lightType: 'natural',
    crop: 'three-quarter',
    hasGlasses: true,
    hasBeard: false,
    quality: 10,
    active: true,
    previewEligible: true,
    skinTone: 'any',
    isMannequin: true,
  },
]

export const TEMPLATES: Template[] = [...CATALOG_TEMPLATES, ...MANNEQUIN_TEMPLATES]

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
