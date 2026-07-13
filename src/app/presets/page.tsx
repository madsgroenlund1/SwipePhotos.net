import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Navbar } from '@/components/Navbar'

const PRESETS = [
  { id: 'outdoor-adventure', name: 'Outdoor Adventure', desc: 'Hiking, nature, golden hour lighting. Perfect for showing an active lifestyle.', emoji: '🏔️', category: 'Outdoor', premium: false },
  { id: 'city-life', name: 'City Life', desc: 'Urban street photography, café culture, metropolitan energy.', emoji: '🌆', category: 'Social', premium: false },
  { id: 'rooftop-bar', name: 'Rooftop Bar', desc: 'Evening ambiance, city skyline, confident social setting.', emoji: '🌃', category: 'Social', premium: true },
  { id: 'beach-vibes', name: 'Beach Vibes', desc: 'Summer lifestyle, relaxed casual, ocean backdrop.', emoji: '🏖️', category: 'Outdoor', premium: true },
  { id: 'home-studio', name: 'Home Studio', desc: 'Clean minimal interior, natural window light, authentic.', emoji: '🏠', category: 'Indoor', premium: true },
  { id: 'marina-walk', name: 'Marina Walk', desc: 'Boats, sunshine, waterfront lifestyle photography.', emoji: '⛵', category: 'Outdoor', premium: true },
  { id: 'coffee-shop', name: 'Coffee Shop', desc: 'Cozy indoor, natural light, candid working vibes.', emoji: '☕', category: 'Indoor', premium: true },
  { id: 'black-and-white', name: 'Black & White', desc: 'Dramatic contrast, artistic portrait, timeless film aesthetic.', emoji: '🎬', category: 'Lifestyle', premium: true },
]

const CATEGORIES = ['All', 'Outdoor', 'Indoor', 'Social', 'Lifestyle']

export default async function PresetsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Style Presets</h1>
          <p className="text-zinc-400 text-lg">
            Choose from 8 curated photography styles, each optimized for dating app success.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium border border-white/10 text-zinc-400 hover:border-blue-500 hover:text-blue-400 transition-colors first:bg-blue-600 first:border-blue-600 first:text-white"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Presets grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform group"
            >
              {/* Image placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                <span className="text-5xl">{preset.emoji}</span>
                {preset.premium && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Lock className="w-6 h-6 text-zinc-400" />
                      <span className="text-xs text-zinc-400 font-medium">Premium</span>
                    </div>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-black/50 text-zinc-400 text-[10px] font-medium px-2 py-1 rounded-full">
                  {preset.category}
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-white font-semibold mb-1">{preset.name}</h3>
                <p className="text-zinc-500 text-sm mb-4 leading-relaxed">{preset.desc}</p>
                <Link
                  href="/onboarding"
                  className="flex items-center justify-center w-full py-2.5 rounded-full text-sm font-medium border border-white/10 text-zinc-300 hover:border-blue-500 hover:text-blue-400 transition-colors"
                >
                  {preset.premium ? 'Upgrade to unlock →' : 'Try this preset →'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link
            href="/onboarding"
            className="inline-block bg-blue-600 hover:brightness-110 text-white font-semibold text-lg px-10 py-4 rounded-full transition-all"
          >
            Generate Your Photos →
          </Link>
        </div>
      </main>
    </div>
  )
}
