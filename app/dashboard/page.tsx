import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscriptionStatus } from '@/components/SubscriptionStatus'
import { DiscountBadge } from '@/components/DiscountBadge'
import { AccessDetailsList } from '@/components/AccessDetailsList'
import { RenewSubscriptionButton } from '@/components/RenewSubscriptionButton'
import Link from 'next/link'
import { ArrowRight, Plus, History, User, Upload, Clock } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { formatPEN } from '@/lib/utils'

export default async function DashboardPage() {
  const user = await getSession()
  if (!user) redirect('/auth/login')

  // Use service client to bypass RLS for reading subscriptions
  const supabase = createServiceClient()

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*, products(name, category)')
    .eq('user_id', user.id)
    .order('expires_at', { ascending: false })

  if (error) {
    console.error('Error fetching subscriptions:', error)
  }

  const subList = subscriptions ?? []
  const now = new Date()

  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('id, created_at, amount, order_type, products(name, category)')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const { data: accessItems } = await supabase
    .from('subscription_access')
    .select(`
      id,
      login_url,
      account_email,
      account_password,
      profile_name,
      profile_pin,
      login_code,
      notes,
      products(name, category),
      subscriptions(expires_at)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '40px 5%' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '32px' 
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Unbounded', sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '4px'
          }}>
            Mi cuenta
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Bienvenido de vuelta 👋
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/dashboard/profile" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border2)',
            background: 'var(--bg3)',
            color: 'var(--text)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500
          }}>
            <User className="h-4 w-4" /> Perfil
          </Link>
          <Link href="/dashboard/history" className="btn-secondary" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border2)',
            background: 'var(--bg3)',
            color: 'var(--text)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500
          }}>
            <History className="h-4 w-4" /> Historial
          </Link>
        </div>
      </div>

      {/* User Info */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--hot))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Unbounded', sans-serif",
          fontSize: '1.2rem',
          fontWeight: 700,
          color: 'white'
        }}>
          {(user.full_name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 600, color: 'var(--text)' }}>
            {user.full_name || 'Usuario'}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            {user.email}
          </p>
        </div>
      </div>

      {(pendingOrders?.length ?? 0) > 0 && (
        <div style={{ marginBottom: '40px' }}>
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
              Pagos pendientes
            </h2>
            <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
          </div>

          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            {pendingOrders?.map((order: any) => (
              <div key={order.id} style={{
                background: 'var(--card)',
                border: '1px solid rgba(249,115,22,0.28)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'rgba(249,115,22,0.12)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--hot)'
                  }}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.95rem' }}>
                      {order.order_type === 'renewal' ? 'Renovacion' : 'Pedido'}: {order.products?.name || 'Pedido pendiente'}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                      {formatPEN(order.amount)} · Pedido #{order.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
                <Link href={`/checkout/${order.id}`} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}>
                  <Upload className="h-4 w-4" />
                  Subir comprobante
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {(accessItems?.length ?? 0) > 0 && (
        <div style={{ marginBottom: '40px' }}>
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
              Accesos de mis servicios
            </h2>
            <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
          </div>

          <AccessDetailsList items={(accessItems ?? []) as any} />
        </div>
      )}

      {/* Active Subscriptions */}
      <div style={{ marginBottom: '40px' }}>
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
            Mis suscripciones activas
          </h2>
          <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
        </div>

        {!subscriptions?.length ? (
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border2)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📦</div>
            <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
              No tienes suscripciones activas.
            </p>
            <Link href="/" className="btn-primary" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600
            }}>
              <Plus className="h-4 w-4" /> Explorar servicios
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {subscriptions.map((sub) => {
              const expiresAt = new Date(sub.expires_at)
              const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000)
              const isExpired = daysLeft < 0
              const isExpiringSoon = daysLeft >= 0 && daysLeft <= 5

              return (
              <div key={sub.id} style={{
                background: 'var(--card)',
                border: isExpired
                  ? '1px solid rgba(239,68,68,0.32)'
                  : isExpiringSoon
                    ? '1px solid rgba(249,115,22,0.36)'
                    : '1px solid var(--border2)',
                borderRadius: '12px',
                padding: '20px',
                transition: 'all 0.2s',
                display: 'grid',
                gap: '14px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(124,58,237,0.15)',
                    color: 'var(--accent2)'
                  }}>
                    {(sub as any).products?.category}
                  </span>
                  <SubscriptionStatus expiresAt={sub.expires_at} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    marginBottom: '4px'
                  }}>
                    {(sub as any).products?.name}
                  </h3>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--muted)'
                  }}>
                    {(sub as any).products?.category}
                  </p>
                </div>

                <div style={{
                  borderRadius: '10px',
                  background: isExpired ? 'rgba(239,68,68,0.08)' : isExpiringSoon ? 'rgba(249,115,22,0.09)' : 'var(--bg2)',
                  border: '1px solid var(--border2)',
                  padding: '10px 12px',
                  display: 'grid',
                  gap: '4px'
                }}>
                  <span style={{ color: 'var(--text)', fontSize: '0.8rem', fontWeight: 800 }}>
                    {isExpired
                      ? 'Suscripcion vencida'
                      : isExpiringSoon
                        ? `Vence en ${daysLeft === 0 ? 'hoy' : `${daysLeft} dia${daysLeft === 1 ? '' : 's'}`}`
                        : `Activa hasta ${expiresAt.toLocaleDateString('es-PE')}`}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>
                    {isExpired
                      ? 'Puedes reactivarla creando un nuevo pago.'
                      : 'Si renuevas antes de vencer, conservas los dias restantes.'}
                  </span>
                </div>

                <RenewSubscriptionButton
                  subscriptionId={sub.id}
                  label={isExpired ? 'Reactivar' : 'Renovar'}
                />
              </div>
              )
            })}
          </div>
        )}
</div>
    </div>
  )
}
