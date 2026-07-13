import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — SwipePhotos.net',
  description: 'Tips and guides for getting more matches on dating apps with AI photos.',
}

const POSTS = [
  {
    slug: 'are-ai-dating-photos-allowed',
    title: 'Are AI Dating Photos Allowed on Tinder and Hinge in 2026?',
    excerpt: 'Dating apps have updated their policies. Here\'s exactly what\'s allowed, what\'s not, and how to stay safe.',
    readTime: '6 min read',
    date: 'June 15, 2026',
    tag: 'Platform Policy',
  },
  {
    slug: 'how-to-make-ai-photos-look-real',
    title: 'How to Make AI Photos Look Natural and Convincing',
    excerpt: 'A deep dive into the techniques behind natural-looking AI photos: face-swap technology, realistic lighting, and professional settings.',
    readTime: '8 min read',
    date: 'June 8, 2026',
    tag: 'How-To Guide',
  },
  {
    slug: '3-photos-every-man-needs',
    title: 'The 3 Photos Every Man Needs on His Dating Profile',
    excerpt: 'Dating app data from 100,000+ profiles shows exactly which photo types drive the most matches. Here\'s the formula.',
    readTime: '5 min read',
    date: 'June 1, 2026',
    tag: 'Dating Strategy',
  },
]

export default async function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-4xl font-bold text-white mb-3">Blog</h1>
        <p className="text-zinc-400 text-lg mb-12">Tips and strategies for getting more matches on dating apps.</p>

        <div className="space-y-6">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block bg-[#111] border border-white/8 rounded-2xl p-6 hover:scale-[1.01] transition-transform group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  {post.tag}
                </span>
                <span className="text-zinc-600 text-sm">{post.date}</span>
                <span className="text-zinc-600 text-sm">·</span>
                <span className="text-zinc-600 text-sm">{post.readTime}</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {post.title}
              </h2>
              <p className="text-zinc-400 leading-relaxed">{post.excerpt}</p>
              <span className="inline-block mt-4 text-blue-400 text-sm font-medium">Read more →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
