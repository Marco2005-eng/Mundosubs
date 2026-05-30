import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PurchaseHistory } from '@/components/PurchaseHistory'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function HistoryPage() {
  const user = await getSession()
  if (!user) redirect('/auth/login')
  const supabase = createServiceClient()

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      amount,
      original_amount,
      discount_pct,
      status,
      order_type,
      products(name, category)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('Purchase history orders error:', ordersError)
  }

  const orderIds = (orders ?? []).map((order: any) => order.id)
  const { data: subscriptions, error: subscriptionsError } = orderIds.length
    ? await supabase
      .from('subscriptions')
      .select('order_id, expires_at')
      .in('order_id', orderIds)
    : { data: [], error: null }

  if (subscriptionsError) {
    console.error('Purchase history subscriptions error:', subscriptionsError)
  }

  const subscriptionByOrder = new Map(
    (subscriptions ?? []).map((subscription: any) => [subscription.order_id, subscription])
  )

  const rows = (orders ?? []).map((order: any) => ({
    id: order.id,
    created_at: order.created_at,
    product_name: `${order.order_type === 'renewal' ? 'Renovacion - ' : ''}${order.products?.name ?? 'Producto'}`,
    category: order.products?.category ?? '-',
    original_amount: order.original_amount,
    discount_pct: order.discount_pct,
    amount: order.amount,
    status: order.status,
    expires_at: subscriptionByOrder.get(order.id)?.expires_at ?? null,
  }))

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Historial de compras</h1>
      </div>
      <PurchaseHistory orders={rows} />
    </div>
  )
}
