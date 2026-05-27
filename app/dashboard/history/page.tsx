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

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, created_at, amount, original_amount, discount_pct, status,
      products(name, category),
      subscriptions(expires_at)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const rows = (orders ?? []).map((o: any) => ({
    id: o.id,
    created_at: o.created_at,
    product_name: o.products?.name ?? '—',
    category: o.products?.category ?? '—',
    original_amount: o.original_amount,
    discount_pct: o.discount_pct,
    amount: o.amount,
    status: o.status,
    expires_at: o.subscriptions?.[0]?.expires_at ?? null,
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
