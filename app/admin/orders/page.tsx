import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { formatPEN } from '@/lib/utils'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, FileText, Search, CheckCircle, XCircle, Clock } from 'lucide-react'
import { PaginationControls } from '@/components/PaginationControls'

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; status?: string; q?: string }
}) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) redirect('/')

  const supabase = createServiceClient()

  const page = parseInt(searchParams.page || '1')
  const limit = parseInt(searchParams.limit || '10')
  const from = (page - 1) * limit
  const to = from + limit - 1

  const search = searchParams.q?.trim()
  let productIds: string[] = []

  if (search) {
    const { data: matchingProducts } = await supabase
      .from('products')
      .select('id')
      .ilike('name', `%${search}%`)
      .limit(100)

    productIds = (matchingProducts ?? []).map((product: any) => product.id)
  }

  let query = supabase
    .from('orders')
    .select('*, products(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }

  if (search) {
    query = productIds.length
      ? query.in('product_id', productIds)
      : query.eq('id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: orders, count, error } = await query
  const totalPages = count ? Math.ceil(count / limit) : 1

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { 
      label: 'Pendiente', 
      color: 'var(--muted)', 
      bg: 'rgba(100,116,139,0.1)',
      icon: Clock 
    },
    approved: { 
      label: 'Aprobado', 
      color: 'var(--green)', 
      bg: 'rgba(34,197,94,0.1)',
      icon: CheckCircle 
    },
    rejected: { 
      label: 'Rechazado', 
      color: '#ef4444', 
      bg: 'rgba(239,68,68,0.1)',
      icon: XCircle 
    },
  }

  const currentStatus = searchParams.status || 'all'

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
              Pedidos
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {count || 0} pedidos en total
            </p>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <form style={{ flex: '1', minWidth: '200px', maxWidth: '400px', position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.4,
              width: '18px',
              height: '18px'
            }} />
            <input
              type="text"
              name="q"
              placeholder="Buscar por producto..."
              defaultValue={searchParams.q}
              className="input-dark"
              style={{ width: '100%', paddingLeft: '40px' }}
            />
            {currentStatus !== 'all' && (
              <input type="hidden" name="status" value={currentStatus} />
            )}
          </form>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { value: 'all', label: 'Todos' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'approved', label: 'Aprobado' },
              { value: 'rejected', label: 'Rechazado' },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={`/admin/orders?${new URLSearchParams({
                  ...(opt.value !== 'all' && { status: opt.value }),
                  ...(searchParams.q && { q: searchParams.q }),
                }).toString()}`}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: currentStatus === opt.value ? 'var(--accent)' : 'var(--border2)',
                  background: currentStatus === opt.value ? 'rgba(124,58,237,0.15)' : 'var(--bg3)',
                  color: currentStatus === opt.value ? 'var(--accent2)' : 'var(--muted)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {!orders?.length ? (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center'
        }}>
          <FileText style={{ width: '48px', height: '48px', opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ color: error ? '#ef4444' : 'var(--muted)' }}>
            {error ? `Error al cargar pedidos: ${error.message}` : 'No hay pedidos con los filtros seleccionados'}
          </p>
          <Link href="/admin/orders" style={{
            color: 'var(--accent2)',
            textDecoration: 'none',
            fontWeight: 500,
            display: 'inline-block',
            marginTop: '8px'
          }}>
            Limpiar filtros
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {orders.map((order: any) => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const StatusIcon = status.icon
            
            return (
              <div key={order.id} style={{
                background: 'var(--card)',
                border: '1px solid var(--border2)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minWidth: '200px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: status.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <StatusIcon style={{ width: '22px', height: '22px', color: status.color }} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                      marginBottom: '4px'
                    }}>
                      #{order.id.slice(0, 8)}
                    </div>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--text)'
                    }}>
                      {order.products?.name}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                      marginTop: '4px'
                    }}>
                      {new Date(order.created_at).toLocaleDateString('es-PE', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: "'Unbounded', sans-serif",
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: 'var(--green)'
                    }}>
                      {formatPEN(order.amount)}
                    </div>
                    {order.discount_pct > 0 && (
                      <span style={{
                        fontSize: '0.7rem',
                        color: 'var(--green)',
                        background: 'rgba(34,197,94,0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        -{order.discount_pct}% OFF
                      </span>
                    )}
                  </div>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: status.bg,
                    color: status.color
                  }}>
                    <StatusIcon style={{ width: '14px', height: '14px' }} />
                    {status.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/admin/orders"
        />
      )}
    </div>
  )
}
