import Link from 'next/link'
import { Banknote, Clock3, CreditCard, Landmark, Megaphone, ShieldCheck, Smartphone, Sparkles, Tag, TrendingDown, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBestDiscount, getEligibleDiscounts } from '@/lib/discounts'
import { StorefrontClient } from './StorefrontClient'
import { StorefrontHeroSlider } from '@/components/StorefrontHeroSlider'
import { CouponCodePill } from '@/components/CouponCodePill'

export const revalidate = 60

export default async function StorefrontPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('name')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, type, created_at')
    .eq('active', true)
    .or('starts_at.is.null,starts_at.lte.' + new Date().toISOString())
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(4)
    .then((result) => result.error ? { data: [] } : result)

  const discounts = user ? await getEligibleDiscounts(user.id) : []
  const items = (products ?? []).map((product) => {
    const best = getBestDiscount(discounts, product.id, product.category)
    return { product, discountPct: best?.pct ?? 0, discountLabel: best?.label }
  })

  const CATEGORIES = ['streaming', 'music', 'game', 'software', 'license']
  const CATEGORY_META: Record<string, { label: string; icon: string }> = {
    streaming: { label: 'Streaming', icon: 'TV' },
    music: { label: 'Música', icon: 'FM' },
    game: { label: 'Juegos', icon: 'GP' },
    software: { label: 'Software', icon: 'SW' },
    license: { label: 'Licencias', icon: 'KEY' },
  }
  const categorySummaries = CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_META[category].label,
    icon: CATEGORY_META[category].icon,
    count: items.filter(({ product }) => product.category === category).length,
  }))

  return (
    <div className="storefront-page">
      <StorefrontHeroSlider userLoggedIn={Boolean(user)} />

      <section className="trust-bar" aria-label="Ventajas de MUNDOSUBS">
        <div><ShieldCheck aria-hidden="true" /> Pago validado manualmente</div>
        <div><Megaphone aria-hidden="true" /> Soporte por WhatsApp</div>
        <div><Tag aria-hidden="true" /> Cupones y descuentos</div>
        <div><Zap aria-hidden="true" /> Activación rápida</div>
        <div><Banknote aria-hidden="true" /> Pagos en soles</div>
      </section>

      <section id="categorias" className="store-band">
        <div className="store-section">
          <div className="section-heading">
            <div>
              <span>Explorar por área</span>
              <h2>Qué buscas hoy</h2>
            </div>
          </div>
          <div className="category-showcase">
            {categorySummaries.map((item) => (
              <Link key={item.category} href={`/?category=${item.category}#catalog`} className="category-tile">
                <strong>{item.icon}</strong>
                <span>{item.label}</span>
                <small>{item.count} servicios</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="promos" className="store-section announcements-section">
        <div className="section-heading">
          <div>
            <span>Ahorra más</span>
            <h2>Promociones y novedades</h2>
          </div>
          <Link href="/nosotros">Conoce MUNDOSUBS</Link>
        </div>

        {(announcements ?? []).length ? (
          <div className="announcements-grid">
            {(announcements ?? []).map((item: any, index: number) => {
              const isPromo = item.type === 'promo'
              const isPriceChange = item.type === 'price_change'
              const isFirst = index === 0

              // Extract coupon code and percentage from text
              const codeMatch = item.body?.match(/código\s+([A-Z0-9_\-]{3,})/i)
              const couponCode = isPromo ? (codeMatch?.[1] ?? null) : null
              const pctMatch = item.title?.match(/(\d+)%/)
              const pct = pctMatch?.[1] ?? null

              const bgGradient = isPromo
                ? 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)'
                : isPriceChange
                ? 'linear-gradient(135deg, #064e3b 0%, #059669 100%)'
                : 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)'

              const accentClr = isPromo ? '#c4b5fd' : isPriceChange ? '#6ee7b7' : '#fed7aa'
              const labelTxt = isPromo ? '🏷️ Cupón activo' : isPriceChange ? '📉 Precio especial' : '✨ Novedad'

              if (isFirst) {
                // ── Hero banner (first card) ──
                return (
                  <article
                    key={item.id}
                    className="announcement-card"
                    style={{
                      background: bgGradient,
                      borderColor: 'transparent',
                      padding: '28px 32px',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 20,
                      minHeight: 160,
                    }}
                  >
                    {/* Left: text content */}
                    <div className="announcement-main-copy" style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.8px',
                        textTransform: 'uppercase', color: accentClr, width: 'max-content',
                        background: 'rgba(255,255,255,0.12)', borderRadius: 999,
                        padding: '3px 10px', border: '1px solid rgba(255,255,255,0.18)',
                      }}>
                        {labelTxt}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#fff', lineHeight: 1.25 }}>
                        {item.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                        {item.body}
                      </p>
                      {couponCode && (
                        <div style={{ marginTop: 4 }}>
                          <CouponCodePill code={couponCode} dark />
                        </div>
                      )}
                    </div>

                    {/* Right: big % badge */}
                    {pct && (
                      <div className="announcement-percent-badge" style={{
                        flexShrink: 0, textAlign: 'center',
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 20, padding: '18px 24px',
                      }}>
                        <span className="announcement-percent-value" style={{
                          display: 'block',
                          fontFamily: "'Unbounded', sans-serif",
                          fontSize: '2.8rem', fontWeight: 900, lineHeight: 1,
                          color: '#fff',
                        }}>{pct}%</span>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: accentClr, fontWeight: 700, marginTop: 4, letterSpacing: '0.5px' }}>
                          OFF
                        </span>
                      </div>
                    )}
                  </article>
                )
              }

              // ── Secondary cards ──
              return (
                <article
                  key={item.id}
                  className="announcement-card"
                  style={{
                    background: isPromo
                      ? 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, var(--card) 100%)'
                      : isPriceChange
                      ? 'linear-gradient(135deg, rgba(5,150,105,0.08) 0%, var(--card) 100%)'
                      : 'linear-gradient(135deg, rgba(249,115,22,0.06) 0%, var(--card) 100%)',
                    borderColor: isPromo
                      ? 'rgba(124,58,237,0.2)'
                      : isPriceChange
                      ? 'rgba(5,150,105,0.2)'
                      : 'rgba(249,115,22,0.18)',
                  }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.5px',
                    textTransform: 'uppercase', width: 'max-content',
                    color: isPromo ? 'var(--accent2)' : isPriceChange ? 'var(--green)' : '#f97316',
                    background: isPromo ? 'rgba(124,58,237,0.1)' : isPriceChange ? 'rgba(5,150,105,0.1)' : 'rgba(249,115,22,0.1)',
                    borderRadius: 999, padding: '3px 9px',
                    border: `1px solid ${isPromo ? 'rgba(124,58,237,0.2)' : isPriceChange ? 'rgba(5,150,105,0.18)' : 'rgba(249,115,22,0.2)'}`,
                  }}>
                    {labelTxt}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  {couponCode && <CouponCodePill code={couponCode} />}
                </article>
              )
            })}
          </div>
        ) : (
          <div className="promo-layout">
            <article className="promo-card promo-main">
              <span>Explora más</span>
              <h3>Bienvenido a MUNDOSUBS</h3>
              <p>Descubre el catálogo completo de suscripciones premium y empieza a disfrutar hoy mismo con total seguridad.</p>
              <Link href="#catalog" style={{ 
                display: 'inline-block',
                marginTop: '12px',
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>Ver catálogo</Link>
            </article>
            <div className="promo-side">
              <article className="promo-card promo-small">
                <span>Consejo</span>
                <h3>Renueva antes de vencer</h3>
                <p>Evita interrupciones y conserva tus accesos activos.</p>
              </article>
              <article className="promo-card promo-small promo-green">
                <span>Próximamente</span>
                <h3>Nuevos bundles digitales</h3>
                <p>Combos especiales para streaming, musica y software.</p>
              </article>
            </div>
          </div>
        )}
      </section>



      <section id="catalog" className="store-section catalog-shell">
        <div className="section-heading catalog-heading">
          <div>
            <span>Catálogo completo</span>
            <h2>Encuentra tu suscripción</h2>
          </div>
          <p>Filtra por categoría, compara precios y agrega al carrito en segundos.</p>
        </div>

        {!items.length ? (
          <div className="catalog-empty">
            <h3>No hay productos disponibles</h3>
            <p>Vuelve pronto o consulta por WhatsApp.</p>
          </div>
        ) : (
          <StorefrontClient
            items={items}
            categories={CATEGORIES}
            initialCategory={searchParams.category}
            initialQuery={searchParams.q}
          />
        )}
      </section>

      <section id="como-funciona" className="store-band">
        <div className="store-section steps-section">
          <div>
            <span className="section-kicker">Proceso simple</span>
            <h2>De elegir a activar en 4 pasos</h2>
          </div>
          <div className="steps-grid">
            {[
              ['1', 'Elige tu plan', 'Navega el catálogo, filtra por categoría y agrega al carrito.'],
              ['2', 'Realiza el pago', 'Paga con Yape, Plin, banco o transferencia en soles.'],
              ['3', 'Sube tu voucher', 'Adjunta el comprobante para que el equipo lo revise.'],
              ['4', 'Listo para usar', 'Aprobamos el pedido y activamos tu acceso digital.'],
            ].map(([number, title, text]) => (
              <article key={number} className="step-card">
                <strong>{number}</strong>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="payment-strip" aria-label="Métodos de pago aceptados">
        <span>Métodos de pago aceptados</span>
        <div>
          <span><Smartphone aria-hidden="true" /> Yape</span>
          <span><Smartphone aria-hidden="true" /> Plin</span>
          <span><Landmark aria-hidden="true" /> BCP</span>
          <span><CreditCard aria-hidden="true" /> Interbank</span>
          <span><Clock3 aria-hidden="true" /> Transferencia</span>
        </div>
      </section>
    </div>
  )
}
