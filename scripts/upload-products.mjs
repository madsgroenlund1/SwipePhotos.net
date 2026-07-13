// One-off script: upload Produktet/<Month>/<Tier>/*.jpg into the Supabase
// "references" bucket under products/<Month>/<Tier>/<filename>, and print a
// JSON manifest of { month, tier, fileName, url } so templates.ts can be
// built from real data instead of guessing.
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const ROOT = process.argv[2] // path to Produktet folder
const manifest = []

const months = fs.readdirSync(ROOT).filter(m => !m.startsWith('.') && fs.statSync(path.join(ROOT, m)).isDirectory())

for (const month of months) {
  const monthDir = path.join(ROOT, month)
  const tiers = fs.readdirSync(monthDir).filter(t => !t.startsWith('.') && fs.statSync(path.join(monthDir, t)).isDirectory())
  for (const tier of tiers) {
    const tierDir = path.join(monthDir, tier)
    const files = fs.readdirSync(tierDir).filter(f => /\.(jpg|jpeg|webp|png)$/i.test(f))
    for (const file of files) {
      const filePath = path.join(tierDir, file)
      const buffer = fs.readFileSync(filePath)
      const storagePath = `products/${month}/${tier}/${file}`
      const ext = path.extname(file).toLowerCase()
      const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
      const { error } = await supabase.storage.from('references').upload(storagePath, buffer, { contentType, upsert: true })
      if (error) {
        console.error('FAILED', storagePath, error.message)
        continue
      }
      const { data: { publicUrl } } = supabase.storage.from('references').getPublicUrl(storagePath)
      manifest.push({ month, tier, fileName: file, url: publicUrl })
      console.error('OK', storagePath)
    }
  }
}

console.log(JSON.stringify(manifest, null, 2))
