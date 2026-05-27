import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPEN } from '@/lib/utils'
import { AlertTriangle, BarChart3, CheckCircle, Clock, CreditCard, FileText, MessageCircle, Package, QrCode, Settings, ShoppingBag, Tag, Ticket, TrendingUp, Users, XCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

function getVoucher(order: any) {
  if (Array.isArray(order.vouchers)) return order.vouchers[0] ?? null
  return order.vouchers ?? null
}

export default async function AdminPage() {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) redirect('/')

  const supabase = createServiceClient()

  // Get all stats
  const [
    { data: pendingOrders },
    { count: activeSubscriptions },
    { data: revenueData },
    { count: totalUsers },
    { count: totalProducts },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('orders').select('id, amount, products(name), vouchers(bank, operation_number)').eq('status', 'pending'),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
    supabase.from('orders').select('amount, created_at').eq('status', 'approved'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('orders').select('id, created_at, amount, status, products(name)').order('created_at', { ascending: false }).limit(5),
  ])

  const totalRevenue = (revenueData ?? []).reduce((sum, o) => sum + parseFloat(String(o.amount)), 0)
  const approvedOrdersCount = (revenueData ?? []).length

  const pendingVoucherOrders = (pendingOrders ?? []).filter((order: any) => Boolean(getVoucher(order)))
  const pendingVouchers = pendingVoucherOrders.length
  const pendingRevenue = pendingVoucherOrders.reduce((sum: number, o: any) => sum + parseFloat(String(o.amount)), 0)

  const stats = [
    { label: 'Comprobantes pendientes', value: pendingVouchers ?? 0, icon: CreditCard, href: '/admin/vouchers', color: 'var(--hot)', bg: 'rgba(249,115,22,0.1)' },
    { label: 'Suscripciones activas', value: activeSubscriptions ?? 0, icon: ShoppingBag, href: '/admin/subscriptions', color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Usuarios registrados', value: totalUsers ?? 0, icon: Users, href: '/admin/users', color: 'var(--accent2)', bg: 'rgba(124,58,237,0.1)' },
    { label: 'Ingresos totales', value: formatPEN(totalRevenue), icon: TrendingUp, href: '/admin/finances', color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' },
  ]

  const menuItems = [
    { label: 'Comprobantes', href: '/admin/vouchers', icon: CreditCard, desc: `${pendingVouchers ?? 0} pendientes`, badge: (pendingVouchers ?? 0) > 0 },
    { label: 'Productos', href: '/admin/products', icon: Package, desc: `${totalProducts ?? 0} activos` },
    { label: 'Usuarios', href: '/admin/users', icon: Users, desc: `${totalUsers ?? 0} registrados` },
    { label: 'Suscripciones', href: '/admin/subscriptions', icon: ShoppingBag, desc: `${activeSubscriptions ?? 0} activas` },
    { label: 'Pedidos', href: '/admin/orders', icon: FileText, desc: `${approvedOrdersCount} aprobados` },
    { label: 'Finanzas', href: '/admin/finances', icon: BarChart3, desc: 'Reportes y egresos' },
    { label: 'Pagos', href: '/admin/payments', icon: QrCode, desc: 'QR y cuentas' },
    { label: 'Descuentos', href: '/admin/discounts', icon: Tag, desc: 'Gestionar reglas' },
    { label: 'Cupones', href: '/admin/coupons', icon: Ticket, desc: 'Codigos y promos' },
    { label: 'Configuración', href: '/admin/settings', icon: Settings, desc: 'Ajustes del sitio' },
  ]

  return (
    <div style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: "'Unbounded', sans-serif",
          fontSize: '1.8rem',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: '8px'
        }}>
          Panel de administración
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Gestiona tu negocio de suscripciones digitales
        </p>
      </div>

      {/* Alert Banner */}
      {pendingVouchers && pendingVouchers > 0 && (
        <div style={{
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.25)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle style={{ width: '20px', height: '20px', color: 'var(--hot)' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--hot)', fontSize: '0.9rem' }}>
                Tienes {pendingVouchers} comprobante{pendingVouchers > 1 ? 's' : ''} pendiente{pendingVouchers > 1 ? 's' : ''} de revisión
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Importe total: {formatPEN(pendingRevenue)}
              </div>
            </div>
          </div>
          <Link href="/admin/vouchers" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'var(--hot)',
            color: 'white',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            Revisar ahora
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '40px'
      }}>
        {stats.map((stat, i) => (
          <Link key={i} href={stat.href || '#'} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border2)',
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {stat.label}
                </span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <stat.icon style={{ width: '16px', height: '16px', color: stat.color }} />
                </div>
              </div>
              <div style={{
                fontFamily: "'Unbounded', sans-serif",
                fontSize: '1.5rem',
                fontWeight: 700,
                color: stat.color
              }}>
                {stat.value}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--text)'
          }}>
            Acceso rápido
          </h2>
          <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {menuItems.map((item, i) => (
            <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: item.badge ? 'rgba(249,115,22,0.05)' : 'var(--card)',
                border: item.badge ? '1px solid rgba(249,115,22,0.2)' : '1px solid var(--border2)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: item.badge ? 'rgba(249,115,22,0.1)' : 'rgba(124,58,237,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <item.icon style={{ width: '18px', height: '18px', color: item.badge ? 'var(--hot)' : 'var(--accent2)' }} />
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {item.label}
                    {item.badge && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--hot)'
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--text)'
          }}>
            Actividad reciente
          </h2>
          <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
          <Link href="/admin/orders" style={{ fontSize: '0.85rem', color: 'var(--accent2)', textDecoration: 'none' }}>
            Ver todos →
          </Link>
        </div>

        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {(!recentOrders || recentOrders.length === 0) ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
              No hay actividad reciente
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentOrders.map((order: any, i: number) => (
                <div key={order.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < recentOrders.length - 1 ? '1px solid var(--border2)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: order.status === 'approved' ? 'rgba(34,197,94,0.1)' :
                                 order.status === 'pending' ? 'rgba(249,115,22,0.1)' : 'rgba(239,68,68,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {order.status === 'approved' ? (
                        <CheckCircle style={{ width: '16px', height: '16px', color: 'var(--green)' }} />
                      ) : order.status === 'pending' ? (
                        <Clock style={{ width: '16px', height: '16px', color: 'var(--hot)' }} />
                      ) : (
                        <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                        {order.products?.name || 'Producto'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {new Date(order.created_at).toLocaleDateString('es-PE', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--green)' }}>
                      {formatPEN(order.amount)}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: order.status === 'approved' ? 'rgba(34,197,94,0.1)' :
                                 order.status === 'pending' ? 'rgba(249,115,22,0.1)' : 'rgba(239,68,68,0.1)',
                      color: order.status === 'approved' ? 'var(--green)' :
                             order.status === 'pending' ? 'var(--hot)' : '#ef4444',
                      fontWeight: 500,
                      textTransform: 'capitalize'
                    }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Support Info */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        background: 'rgba(37,211,102,0.1)',
        border: '1px solid rgba(37,211,102,0.2)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <MessageCircle style={{ width: '20px', height: '20px', color: '#25D366' }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          ¿Necesitas ayuda? Los clientes pueden contactarte por WhatsApp: <strong style={{ color: 'var(--text)' }}>+51 977706674</strong>
        </span>
      </div>
    </div>
  )
}
