import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { AdminVoucherList } from '@/components/AdminVoucherList'

function getVoucher(order: any) {
  if (Array.isArray(order.vouchers)) return order.vouchers[0] ?? null
  return order.vouchers ?? null
}

export default async function AdminVouchersPage() {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) redirect('/')

  const supabase = createAdminClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, created_at, amount, discount_pct,
      products(name),
      vouchers(bank, operation_number, uploaded_at, file_url)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Admin vouchers error:', error)
  }

  const reviewOrders = (orders ?? []).filter((order: any) => Boolean(getVoucher(order)))

  return (
    <div style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--bg3)',
            color: 'var(--muted)',
            textDecoration: 'none'
          }}>
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
          </Link>
          <div>
            <h1 style={{
              fontFamily: "'Unbounded', sans-serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text)'
            }}>
              Comprobantes pendientes
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {reviewOrders.length} pedidos esperando revision
            </p>
          </div>
        </div>
      </div>

      {reviewOrders.length > 0 && (
        <div style={{
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.25)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <Clock style={{ width: '20px', height: '20px', color: 'var(--hot)' }} />
          <span style={{ color: 'var(--hot)', fontWeight: 500, fontSize: '0.9rem' }}>
            Tienes {reviewOrders.length} comprobante{reviewOrders.length > 1 ? 's' : ''} pendiente{reviewOrders.length > 1 ? 's' : ''} de revision
          </span>
        </div>
      )}

      <AdminVoucherList orders={reviewOrders as any} />
    </div>
  )
}
