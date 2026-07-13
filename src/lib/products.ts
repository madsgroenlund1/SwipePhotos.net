// ─── Monthly product catalog (real model photos, per subscription tier) ─────
//
// Source of truth: the Produktet/<Month>/<Tier>/ folders in the repo, uploaded
// to Supabase storage bucket "references" under products/<Month>/<Tier>/<file>
// via scripts/upload-products.mjs.
//
// Each calendar month gets its own folder so paid subscribers see fresh
// templates every month. Only the CURRENT month's folder needs to exist —
// pick a package, get that month's photos for that tier. To add next month:
// 1. Create Produktet/<Month>/{Starter,Premium,Pro}/ with real model photos
// 2. Run: node scripts/upload-products.mjs Produktet
// No code changes needed — the month folder is resolved from the clock.

import { createAdminClientDirect } from '@/lib/supabase/server'
import type { PackageId } from '@/lib/stripe'

export const DANISH_MONTHS = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December',
] as const

const PACKAGE_TO_TIER: Record<PackageId, string> = {
  starter: 'Starter',
  popular: 'Premium',
  elite:   'Pro',
}

export function currentDanishMonth(date = new Date()): string {
  return DANISH_MONTHS[date.getMonth()]
}

export type ProductTemplate = {
  id: string
  url: string
  setting: string
}

/**
 * List every real model photo for a package's tier in a given month
 * (defaults to the current month). Falls back to the most recent month
 * that actually has files, so a mid-rollout gap doesn't break generation.
 */
export async function getMonthlyTemplates(
  packageId: PackageId,
  date = new Date()
): Promise<ProductTemplate[]> {
  const tier = PACKAGE_TO_TIER[packageId]
  const supabase = createAdminClientDirect()

  const startIdx = date.getMonth()
  for (let back = 0; back < 12; back++) {
    const month = DANISH_MONTHS[(startIdx - back + 12) % 12]
    const path = `products/${month}/${tier}`
    const { data, error } = await supabase.storage.from('references').list(path, { limit: 100 })
    if (error || !data?.length) continue

    const files = data.filter(f => /\.(jpe?g|webp|png)$/i.test(f.name))
    if (!files.length) continue

    return files.map(f => {
      const { data: { publicUrl } } = supabase.storage.from('references').getPublicUrl(`${path}/${f.name}`)
      return {
        id: `${month}-${tier}-${f.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        url: publicUrl,
        setting: f.name.replace(/\.[^.]+$/, '').replace(/\s*\(\d+\)\s*$/, '').trim(),
      }
    })
  }

  return []
}
