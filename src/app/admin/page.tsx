import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { AdminClient } from './AdminClient'
import { PLANS } from '@/lib/pricing'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin-auth')?.value

  if (adminAuth !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login')
  }

  const supabase = await createAdminClient()

  const [{ data: orders }, { data: affiliates }, { data: revenueOrders }, { data: previewEvents }, { count: totalOrdersCount }, { data: siteVisits }] = await Promise.all([
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
    supabase
      .from('preview_events')
      .select('created_at, style, outcome')
      .order('created_at', { ascending: false })
      .limit(2000),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('site_visits')
      .select('created_at, path, ip, referrer')
      .order('created_at', { ascending: false })
      .limit(5000),
  ])

  // Current live EUR monthly prices (see src/lib/pricing.ts) — package_type
  // values are the Stripe PackageId keys (starter/popular/elite).
  const priceById: Record<string, number> = Object.fromEntries(
    PLANS.map(p => [p.id, p.monthly])
  )

  const revenue = (revenueOrders || []).reduce((acc, o) => {
    return acc + (priceById[o.package_type] || 0)
  }, 0)

  return (
    <AdminClient
      orders={orders || []}
      affiliates={affiliates || []}
      revenue={revenue}
      previewEvents={previewEvents || []}
      totalOrdersCount={totalOrdersCount || 0}
      siteVisits={siteVisits || []}
    />
  )
}
