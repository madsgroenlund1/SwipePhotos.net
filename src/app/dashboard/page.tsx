import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardClient } from './DashboardClient'

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'
  const refLink = refCode ? `${appUrl}/?ref=${refCode}` : null

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="border-b border-white/5 px-6 h-16 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-0">
          <span className="text-white font-bold text-xl">SwipePhotos</span>
          <span className="text-blue-500 font-bold text-xl">.net</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-sm hidden sm:block">{user.email}</span>
          <Link href="/onboarding" className="bg-blue-600 hover:brightness-110 text-white text-sm font-medium px-4 py-2 rounded-full transition-all">
            New Order →
          </Link>
        </div>
      </nav>

      <DashboardClient orders={orders || []} refLink={refLink} />
    </div>
  )
}
