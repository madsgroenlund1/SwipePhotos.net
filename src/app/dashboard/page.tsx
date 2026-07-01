import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Download, ExternalLink, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  processing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  training: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  generating: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  ready: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  const [{ data: orders }, { data: userRow }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, generated_photos(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('users').select('referral_code').eq('id', user.id).single(),
  ])

  const refCode = userRow?.referral_code
  const refLink = refCode
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'}/?ref=${refCode}`
    : null

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 h-16 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-0">
          <span className="text-white font-bold text-xl">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-xl">.net</span>
        </Link>
        <div className="text-zinc-500 text-sm">{user.email}</div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">My Dashboard</h1>

        {/* Orders */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">My Orders</h2>
            <Link
              href="/onboarding"
              className="bg-blue-600 hover:brightness-110 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all"
            >
              Order Again →
            </Link>
          </div>

          {!orders?.length ? (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
              <p className="text-zinc-500 mb-4">No orders yet.</p>
              <Link href="/onboarding" className="text-blue-400 hover:text-blue-300 text-sm">
                Get your first AI photos →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: {
                id: string
                package_type: string
                status: string
                created_at: string
                generated_photos: { file_url: string }[]
              }) => (
                <div key={order.id} className="bg-[#111] border border-white/8 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <div>
                      <div className="text-white font-medium capitalize">{order.package_type} Package</div>
                      <div className="text-zinc-500 text-sm mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('text-xs font-medium px-3 py-1 rounded-full border capitalize', STATUS_COLORS[order.status] || STATUS_COLORS.processing)}>
                        {order.status}
                      </span>
                      {order.status === 'ready' && order.generated_photos?.length > 0 && (
                        <a
                          href={`/api/orders/${order.id}/download`}
                          className="flex items-center gap-2 bg-blue-600 hover:brightness-110 text-white text-sm font-medium px-4 py-2 rounded-full transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Download All
                        </a>
                      )}
                    </div>
                  </div>

                  {order.status === 'ready' && order.generated_photos?.length > 0 && (
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                      {order.generated_photos.slice(0, 8).map((photo: { file_url: string }, i: number) => (
                        <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden relative group bg-zinc-800">
                          <img src={photo.file_url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={photo.file_url} download>
                              <Download className="w-5 h-5 text-white" />
                            </a>
                          </div>
                        </div>
                      ))}
                      {order.generated_photos.length > 8 && (
                        <div className="aspect-[3/4] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <span className="text-zinc-400 text-sm font-medium">+{order.generated_photos.length - 8}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {order.status === 'processing' || order.status === 'training' || order.status === 'generating' ? (
                    <div className="flex items-center gap-3 text-zinc-400 text-sm">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                      Your photos are being generated. We&apos;ll email you when they&apos;re ready.
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Refer & Earn */}
        <section className="bg-[#111] border border-white/8 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-2">Refer &amp; Earn</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Earn 30% commission on every sale through your referral link. Payout at $50 minimum.
          </p>

          {refLink ? (
            <div className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-xl p-4">
              <code className="flex-1 text-zinc-300 text-sm truncate">{refLink}</code>
              <button
                onClick={() => navigator.clipboard.writeText(refLink)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-full transition-colors flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          ) : (
            <Link
              href="/affiliate"
              className="inline-flex items-center gap-2 bg-blue-600 hover:brightness-110 text-white text-sm font-medium px-5 py-3 rounded-full transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Apply for Affiliate Program
            </Link>
          )}
        </section>
      </main>
    </div>
  )
}
