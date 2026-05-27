import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatPEN } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Eye, CreditCard, Clock, Search } from 'lucide-react'

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

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
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
            placeholder="Buscar por ID, banco o numero..."
            className="input-dark"
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>
      </div>

      {!reviewOrders.length ? (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center'
        }}>
          <CreditCard style={{ width: '48px', height: '48px', opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>No hay comprobantes pendientes</p>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Los pedidos apareceran aqui cuando el cliente suba su comprobante.
          </span>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {reviewOrders.map((order: any) => {
            const voucher = getVoucher(order)

            return (
              <div key={order.id} style={{
                background: 'var(--card)',
                border: '1px solid var(--border2)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                gap: '18px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(249,115,22,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CreditCard style={{ width: '22px', height: '22px', color: 'var(--hot)' }} />
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
                      display: 'flex',
                      gap: '16px',
                      marginTop: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                      flexWrap: 'wrap'
                    }}>
                      <span>Banco: {voucher?.bank || '-'}</span>
                      <span>Operacion: {voucher?.operation_number || '-'}</span>
                      <span>{new Date(voucher?.uploaded_at || order.created_at).toLocaleDateString('es-PE')}</span>
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
                  <Link href={`/admin/vouchers/${order.id}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}>
                    <Eye style={{ width: '16px', height: '16px' }} /> Revisar
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
