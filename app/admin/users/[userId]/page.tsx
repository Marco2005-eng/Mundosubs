import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatPEN } from '@/lib/utils'
import { buildUserWhatsAppLink } from '@/lib/whatsapp'
import Link from 'next/link'
import { ArrowLeft, Mail, Calendar, CreditCard, Package, MessageCircle, Crown, Gift, FileText } from 'lucide-react'
import { DiscountManager } from '@/components/DiscountManager'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('es-PE')
  } catch {
    return '-'
  }
}

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const serviceSupabase = createServiceClient()

  const { data: user } = await serviceSupabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  
  if (!user) notFound()

  // Obtener orders
  const ordersRes = await serviceSupabase
    .from('orders')
    .select('id, created_at, amount, status, products(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  const orders = ordersRes.data || []

  // Obtener subscriptions
  const subsRes = await serviceSupabase
    .from('subscriptions')
    .select('*, products(name)')
    .eq('user_id', userId)
    .order('expires_at', { ascending: false })
  const subscriptions = subsRes.data || []

  // Obtener discounts del usuario
  const userDiscountsRes = await serviceSupabase
    .from('user_discounts')
    .select('*, discounts(label, pct)')
    .eq('user_id', userId)
  const userDiscounts = userDiscountsRes.data || []

  // Obtener discounts disponibles para asignar
  const availableDiscountsRes = await serviceSupabase
    .from('discounts')
    .select('id, label, pct')
    .eq('active', true)
    .order('pct', { ascending: false })
  const availableDiscounts = availableDiscountsRes.data || []

  // Calcular stats
  const approvedOrders = orders.filter(o => o.status === 'approved')
  const totalSpent = approvedOrders.reduce((sum, o) => sum + parseFloat(String(o.amount)), 0)
  const now = new Date()
  const activeSubs = subscriptions.filter(s => s.expires_at && new Date(s.expires_at) > now)
  const activeDiscounts = userDiscounts.filter(d => !d.used_at && (!d.expires_at || new Date(d.expires_at) > now))
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const whatsappLink = buildUserWhatsAppLink(
    user.phone,
    `Hola ${user.full_name || ''}, te escribimos de MUNDOSUBS sobre tu cuenta y servicios activos.`
  )

  return (
    <div style={{ padding: '40px 5%', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin/users" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg3)', color: 'var(--muted)', textDecoration: 'none' }}>
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
          </Link>
          <div>
            <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {user.full_name || 'Sin nombre'}
              {user.role === 'admin' && (
                <span style={{ fontSize: '0.7rem', background: 'linear-gradient(135deg, var(--accent), var(--hot))', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  <Crown style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />Admin
                </span>
              )}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Usuario registrado el {formatDate(user.created_at)}</p>
          </div>
        </div>
        {whatsappLink ? (
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', background: '#25D366', color: 'white', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            <MessageCircle style={{ width: '18px', height: '18px' }} /> WhatsApp
          </a>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', background: 'var(--bg3)', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            <MessageCircle style={{ width: '18px', height: '18px' }} /> Sin telefono
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CreditCard style={{ width: '18px', height: '18px', color: 'var(--green)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Total gastado</span>
          </div>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)' }}>{formatPEN(totalSpent)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>{approvedOrders.length} compras aprobadas</div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Package style={{ width: '18px', height: '18px', color: 'var(--accent2)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Suscripciones activas</span>
          </div>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent2)' }}>{activeSubs.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>{subscriptions.length} totales</div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Gift style={{ width: '18px', height: '18px', color: 'var(--hot)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Descuentos activos</span>
          </div>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--hot)' }}>{activeDiscounts.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>{userDiscounts.length} asignados</div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileText style={{ width: '18px', height: '18px', color: 'var(--muted)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Pedidos</span>
          </div>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>{orders.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>{pendingOrders.length} pendientes</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text)' }}>Información del usuario</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail style={{ width: '16px', height: '16px', color: 'var(--muted)' }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{user.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageCircle style={{ width: '16px', height: '16px', color: 'var(--muted)' }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{user.phone || 'Sin telefono registrado'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar style={{ width: '16px', height: '16px', color: 'var(--muted)' }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Registrado: {formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text)' }}>Suscripciones activas</h3>
          {activeSubs.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No tiene suscripciones activas</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeSubs.map((sub: any) => (
                <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>{sub.products?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Expira: {formatDate(sub.expires_at)}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: 'var(--green)', fontWeight: 500 }}>Activa</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text)' }}>Pedidos recientes</h3>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No hay pedidos</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {orders.map((order: any) => (
              <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg3)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>{order.products?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{formatDate(order.created_at)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--green)' }}>{formatPEN(order.amount)}</span>
                  <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', background: order.status === 'approved' ? 'rgba(34,197,94,0.1)' : order.status === 'pending' ? 'rgba(249,115,22,0.1)' : 'rgba(239,68,68,0.1)', color: order.status === 'approved' ? 'var(--green)' : order.status === 'pending' ? 'var(--hot)' : '#ef4444', fontWeight: 500, textTransform: 'capitalize' }}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px' }}>
        <DiscountManager 
          userId={userId}
          availableDiscounts={availableDiscounts}
          userDiscounts={userDiscounts}
        />
      </div>
    </div>
  )
}
