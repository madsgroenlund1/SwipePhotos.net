import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { AdminClient } from './AdminClient'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin-auth')?.value

  if (adminAuth !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login')
  }

  const supabase = await createAdminClient()

  const [{ data: orders }, { data: affiliates }, { data: revenueOrders }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, users(email)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('affiliates')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('package_type, status')
      .eq('status', 'ready'),
  ])

  const revenue = (revenueOrders || []).reduce((acc, o) => {
    const prices: Record<string, number> = { starter: 19, popular: 39, elite: 79 }
    return acc + (prices[o.package_type] || 0)
  }, 0)

  return <AdminClient orders={orders || []} affiliates={affiliates || []} revenue={revenue} />
}
