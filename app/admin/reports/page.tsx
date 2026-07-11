import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminReportsClient } from '@/components/AdminReportsClient'

export const revalidate = 0

export default async function AdminReportsPage() {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) redirect('/')

  const supabase = createServiceClient()

  // Load all required data for live client-side processing
  const [ordersRes, productsRes, usersRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, amount, original_amount, discount_pct, status, created_at, product_id, user_id, products(name, category)')
      .order('created_at', { ascending: false }),
    supabase.from('products').select('id, name, category').order('name'),
    supabase.from('profiles').select('id, email, full_name').order('email'),
  ])

  const initialOrders = (ordersRes.data as any[]) ?? []
  const initialProducts = productsRes.data ?? []
  const initialUsers = usersRes.data ?? []

  return (
    <AdminReportsClient
      initialOrders={initialOrders}
      initialProducts={initialProducts}
      initialUsers={initialUsers}
    />
  )
}
