import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { buildUserWhatsAppLink } from '@/lib/whatsapp'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, Search, ShieldCheck, User, Package, AlertTriangle, MessageCircle } from 'lucide-react'
import { PaginationControls } from '@/components/PaginationControls'

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

function statusFor(expiresAt: string) {
  const days = daysUntil(expiresAt)
  if (days < 0) return { key: 'expired', label: 'Vencida', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
  if (days <= 3) return { key: 'expiring', label: 'Por vencer', color: 'var(--hot)', bg: 'rgba(249,115,22,0.1)' }
  return { key: 'active', label: 'Activa', color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' }
}

function cleanSearch(value?: string) {
  return value?.trim().replace(/[(),]/g, ' ').replace(/\s+/g, ' ') || ''
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export default async function AdminSubscriptionsPage({
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
  const now = new Date().toISOString()
  const search = cleanSearch(searchParams.q)
  const searchLike = `%${search}%`
  let userIds: string[] = []
  let productIds: string[] = []

  if (search) {
    const [{ data: users }, { data: products }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id')
        .or(`email.ilike.${searchLike},full_name.ilike.${searchLike}`)
        .limit(200),
      supabase
        .from('products')
        .select('id')
        .or(`name.ilike.${searchLike},category.ilike.${searchLike}`)
        .limit(200),
    ])

    userIds = (users ?? []).map((user: any) => user.id)
    productIds = (products ?? []).map((product: any) => product.id)
  }

  let query = supabase
    .from('subscriptions')
    .select(`
      id,
      user_id,
      product_id,
      order_id,
      starts_at,
      expires_at,
      products(name, category),
      subscription_access(id)
    `, { count: 'exact' })
    .order('expires_at', { ascending: true })
    .range(from, to)

  if (searchParams.status === 'active') query = query.gte('expires_at', now)
  if (searchParams.status === 'expired') query = query.lt('expires_at', now)
  if (search) {
    const filters = [
      ...userIds.map((id) => `user_id.eq.${id}`),
      ...productIds.map((id) => `product_id.eq.${id}`),
      ...(isUuid(search) ? [`order_id.eq.${search}`] : []),
    ]

    query = filters.length ? query.or(filters.join(',')) : query.eq('id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: subscriptions, count } = await query
  const profileIds = Array.from(new Set((subscriptions ?? []).map((sub: any) => sub.user_id).filter(Boolean)))
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, email, full_name, phone').in('id', profileIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]))
  const rows = (subscriptions ?? []).map((sub: any) => ({
    ...sub,
    users: profileMap.get(sub.user_id) ?? null,
  }))

  const activeCount = (subscriptions ?? []).filter((sub: any) => new Date(sub.expires_at) >= new Date()).length
  const expiringCount = (subscriptions ?? []).filter((sub: any) => {
    const days = daysUntil(sub.expires_at)
    return days >= 0 && days <= 3
  }).length
  const totalPages = count ? Math.ceil(count / limit) : 1
  const currentStatus = searchParams.status || 'all'

  return (
    <div style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
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
              Suscripciones
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Gestiona servicios activos, vencimientos y accesos por usuario
            </p>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <Stat label="Total" value={count ?? 0} icon={Package} color="var(--accent2)" bg="rgba(124,58,237,0.1)" />
        <Stat label="Activas en pagina" value={activeCount} icon={ShieldCheck} color="var(--green)" bg="rgba(34,197,94,0.1)" />
        <Stat label="Por vencer" value={expiringCount} icon={AlertTriangle} color="var(--hot)" bg="rgba(249,115,22,0.1)" />
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <form style={{ flex: '1', minWidth: '220px', maxWidth: '420px', position: 'relative' }}>
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
            placeholder="Buscar por usuario o servicio..."
            defaultValue={searchParams.q}
            className="input-dark"
            style={{ width: '100%', paddingLeft: '40px' }}
          />
          {currentStatus !== 'all' && <input type="hidden" name="status" value={currentStatus} />}
        </form>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: 'Todas' },
            { value: 'active', label: 'Activas' },
            { value: 'expired', label: 'Vencidas' },
          ].map((opt) => (
            <Link
              key={opt.value}
              href={`/admin/subscriptions?${new URLSearchParams({
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
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {!rows.length ? (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          color: 'var(--muted)'
        }}>
          No hay suscripciones con los filtros seleccionados.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {rows.map((sub: any) => {
            const status = statusFor(sub.expires_at)
            const days = daysUntil(sub.expires_at)
            const hasAccess = (sub.subscription_access?.length ?? 0) > 0
            const reminderLink = buildUserWhatsAppLink(
              sub.users?.phone,
              `Hola ${sub.users?.full_name || ''}, te recordamos que tu servicio ${sub.products?.name || 'de MUNDOSUBS'} vence el ${new Date(sub.expires_at).toLocaleDateString('es-PE')}. Puedes contactarnos para renovar.`
            )

            return (
              <article key={sub.id} style={{
                background: 'var(--card)',
                border: '1px solid var(--border2)',
                borderRadius: '12px',
                padding: '18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      borderRadius: '999px',
                      background: status.bg,
                      color: status.color,
                      fontWeight: 800
                    }}>
                      {status.label}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      borderRadius: '999px',
                      background: hasAccess ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                      color: hasAccess ? 'var(--green)' : 'var(--muted)',
                      fontWeight: 800
                    }}>
                      {hasAccess ? 'Acceso entregado' : 'Sin acceso'}
                    </span>
                  </div>
                  <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 800, marginBottom: '4px' }}>
                    {sub.products?.name || 'Servicio'}
                  </h2>
                  <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                    {sub.products?.category || '-'} - Pedido #{sub.order_id.slice(0, 8)}
                  </p>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text)', fontSize: '0.86rem', minWidth: 0 }}>
                    <User style={{ width: 16, height: 16, color: 'var(--muted)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sub.users?.full_name || sub.users?.email || 'Usuario'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
                    <CalendarClock style={{ width: 16, height: 16, flexShrink: 0 }} />
                    <span>
                      Vence {new Date(sub.expires_at).toLocaleDateString('es-PE')}
                      {days >= 0 ? ` - quedan ${days} días` : ` - hace ${Math.abs(days)} días`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  {reminderLink ? (
                    <a href={reminderLink} target="_blank" rel="noopener noreferrer" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      padding: '9px 13px',
                      borderRadius: '8px',
                      border: '1px solid rgba(37,211,102,0.28)',
                      background: 'rgba(37,211,102,0.12)',
                      color: '#16a34a',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      textAlign: 'center'
                    }}>
                      <MessageCircle style={{ width: 15, height: 15 }} />
                      Recordar
                    </a>
                  ) : (
                    <span style={{
                      padding: '9px 13px',
                      borderRadius: '8px',
                      border: '1px solid var(--border2)',
                      background: 'var(--bg3)',
                      color: 'var(--muted)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textAlign: 'center'
                    }}>
                      Sin teléfono
                    </span>
                  )}
                  <Link href={`/admin/users/${sub.user_id}`} style={{
                    padding: '9px 13px',
                    borderRadius: '8px',
                    border: '1px solid var(--border2)',
                    background: 'var(--bg3)',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}>
                    Ver usuario
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/admin/subscriptions"
        />
      )}
    </div>
  )
}

function Stat({ label, value, icon: Icon, color, bg }: { label: string; value: number; icon: any; color: string; bg: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: '8px', background: bg, color, display: 'grid', placeItems: 'center' }}>
          <Icon style={{ width: 16, height: 16 }} />
        </div>
      </div>
      <strong style={{ color, fontFamily: "'Unbounded', sans-serif", fontSize: '1.45rem' }}>{value}</strong>
    </div>
  )
}
