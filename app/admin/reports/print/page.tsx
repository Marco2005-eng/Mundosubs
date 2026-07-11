import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatPEN } from '@/lib/utils'
import { PrintButton } from '@/components/PrintButton'

type SearchParams = {
  from?: string
  to?: string
  userId?: string
  userQuery?: string
  category?: string
  productId?: string
  productQuery?: string
  status?: string
}

function parseDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function endOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

export default async function AdminReportsPrintPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) redirect('/')

  const supabase = createServiceClient()

  // Get date range parameters
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1)
  const fromDate = parseDate(searchParams.from, defaultFrom)
  const toDate = endOfDay(parseDate(searchParams.to, now))

  const selectedUserId = searchParams.userId || ''
  const selectedUserQuery = searchParams.userQuery || ''
  const selectedCategory = searchParams.category || ''
  const selectedProductId = searchParams.productId || ''
  const selectedProductQuery = searchParams.productQuery || ''
  const selectedStatus = searchParams.status || ''

  // 1. Resolve matching users
  let matchedUserIds: string[] = []
  let userFilterActive = false
  if (selectedUserId) {
    matchedUserIds = [selectedUserId]
    userFilterActive = true
  } else if (selectedUserQuery) {
    userFilterActive = true
    const { data: matchedUsers } = await supabase
      .from('profiles')
      .select('id')
      .or(`email.ilike.%${selectedUserQuery}%,full_name.ilike.%${selectedUserQuery}%`)
    matchedUserIds = (matchedUsers ?? []).map((u: any) => u.id)
  }

  // 2. Resolve matching products
  let matchedProductIds: string[] = []
  let productFilterActive = false
  if (selectedProductId) {
    matchedProductIds = [selectedProductId]
    productFilterActive = true
  } else if (selectedProductQuery) {
    productFilterActive = true
    const { data: matchedProducts } = await supabase
      .from('products')
      .select('id')
      .ilike('name', `%${selectedProductQuery}%`)
    matchedProductIds = (matchedProducts ?? []).map((p: any) => p.id)
  }

  // 3. Build DB query
  let selectStr = 'id, amount, original_amount, discount_pct, status, created_at, product_id, user_id, products(name, category)'
  if (selectedCategory) {
    selectStr = 'id, amount, original_amount, discount_pct, status, created_at, product_id, user_id, products!inner(name, category)'
  }

  let query = supabase
    .from('orders')
    .select(selectStr)
    .gte('created_at', fromDate.toISOString())
    .lte('created_at', toDate.toISOString())
    .order('created_at', { ascending: false })

  if (userFilterActive) {
    if (matchedUserIds.length > 0) {
      query = query.in('user_id', matchedUserIds)
    } else {
      query = query.eq('user_id', '00000000-0000-0000-0000-000000000000')
    }
  }

  if (productFilterActive) {
    if (matchedProductIds.length > 0) {
      query = query.in('product_id', matchedProductIds)
    } else {
      query = query.eq('product_id', '00000000-0000-0000-0000-000000000000')
    }
  }

  if (selectedStatus) {
    query = query.eq('status', selectedStatus)
  }
  
  if (selectedCategory) {
    query = query.eq('products.category', selectedCategory)
  }

  const { data: rawOrders } = await query
  const orders = (rawOrders as any[]) ?? []

  // Load user profiles
  const profileIds = Array.from(new Set(orders.map((o) => o.user_id).filter(Boolean)))
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, email, full_name').in('id', profileIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const ordersWithUsers = orders.map((order) => ({
    ...order,
    user: profileMap.get(order.user_id) ?? null,
  }))

  // Metrics
  const totalAmount = ordersWithUsers
    .filter((o) => o.status === 'approved')
    .reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0)

  const pendingAmount = ordersWithUsers
    .filter((o) => o.status === 'pending')
    .reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0)

  const discountAmount = ordersWithUsers
    .filter((o) => o.status === 'approved')
    .reduce((sum, o) => {
      const amt = parseFloat(o.amount) || 0
      const orig = parseFloat(o.original_amount) || amt
      return sum + Math.max(0, orig - amt)
    }, 0)

  const totalOrdersCount = ordersWithUsers.length

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', padding: '32px 5%', color: '#0f172a' }}>
      <div className="print-hide" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Link href="/admin/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#334155', textDecoration: 'none', fontWeight: 700 }}>
          <ArrowLeft style={{ width: 18, height: 18 }} />
          Volver a reportes
        </Link>
        <PrintButton />
      </div>

      <section style={{ background: '#ffffff', border: '1px solid #dbe3ef', borderRadius: '10px', padding: '28px', maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', borderBottom: '2px solid #e2e8f0', paddingBottom: '18px', marginBottom: '22px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>Reporte Detallado de Ventas MUNDOSUBS</h1>
            <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.9rem' }}>
              Periodo: {fromDate.toLocaleDateString('es-PE')} - {toDate.toLocaleDateString('es-PE')}
              {selectedCategory && ` | Categoría: ${selectedCategory.toUpperCase()}`}
              {selectedStatus && ` | Estado: ${selectedStatus.toUpperCase()}`}
              {selectedUserQuery && ` | Cliente: ${selectedUserQuery}`}
              {selectedProductQuery && ` | Producto: ${selectedProductQuery}`}
            </p>
          </div>
          <div style={{ textAlign: 'right', color: '#64748b', fontSize: '0.82rem' }}>
            Generado por admin<br />
            {new Date().toLocaleString('es-PE')}
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '22px' }}>
          <PrintStat label="Total Facturado" value={formatPEN(totalAmount)} color="#16a34a" />
          <PrintStat label="Pendiente Validar" value={formatPEN(pendingAmount)} color="#dc2626" />
          <PrintStat label="Descuentos Otorgados" value={formatPEN(discountAmount)} color="#a855f7" />
          <PrintStat label="Total Pedidos" value={String(totalOrdersCount)} color="#0f172a" />
        </div>

        <h2 style={headingStyle}>Detalle de Pedidos</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '12px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>Producto</th>
              <th style={thStyle}>Categoría</th>
              <th style={thStyle}>Descuento</th>
              <th style={thStyle}>Monto</th>
              <th style={thStyle}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ordersWithUsers.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={tdStyle}>{new Date(order.created_at).toLocaleDateString('es-PE')}</td>
                <td style={tdStyle}>
                  {order.user?.full_name || 'Sin nombre'}<br/>
                  <small style={{ color: '#64748b' }}>{order.user?.email}</small>
                </td>
                <td style={tdStyle}>{order.products?.name || 'Servicio'}</td>
                <td style={tdStyle}>{order.products?.category || 'General'}</td>
                <td style={tdStyle}>{order.discount_pct > 0 ? `${order.discount_pct}%` : '0%'}</td>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{formatPEN(parseFloat(order.amount))}</td>
                <td style={tdStyle}>
                  <span style={{
                    color: order.status === 'approved' ? '#16a34a' : order.status === 'pending' ? '#d97706' : '#dc2626',
                    fontWeight: 'bold'
                  }}>
                    {order.status === 'approved' ? 'Aprobado' : order.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                  </span>
                </td>
              </tr>
            ))}
            <tr style={{ background: '#f8fafc', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
              <td style={tdStyle} colSpan={5}>TOTAL FACTURADO (APROBADO)</td>
              <td style={{ ...tdStyle, fontSize: '0.9rem', color: '#16a34a' }}>{formatPEN(totalAmount)}</td>
              <td style={tdStyle}></td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  )
}

const headingStyle = {
  fontSize: '1rem',
  fontWeight: 900,
  margin: '24px 0 10px',
}

const thStyle = {
  background: '#5c35b0',
  color: '#ffffff',
  border: '1px solid #cbd5e1',
  padding: '8px',
  textAlign: 'left' as const,
  fontWeight: 'bold'
}

const tdStyle = {
  border: '1px solid #cbd5e1',
  padding: '8px',
  color: '#334155'
}

function PrintStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', background: '#ffffff' }}>
      <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
      <strong style={{ color, fontSize: '1.1rem' }}>{value}</strong>
    </div>
  )
}
