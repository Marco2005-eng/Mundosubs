import Link from 'next/link'
import { Megaphone, ShieldCheck, Sparkles, Tag, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBestDiscount, getEligibleDiscounts } from '@/lib/discounts'
import { StorefrontClient } from './StorefrontClient'

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

  const CATEGORIES = ['streaming', 'game', 'license', 'software', 'music']

  return (
    <div className="storefront-page">
      <section className="storefront-hero">
        <div className="storefront-hero-copy">
          <span className="storefront-eyebrow">
            <Sparkles aria-hidden="true" />
            Tu mundo de suscripciones
          </span>
          <h1>
            Streaming, juegos y software en soles peruanos
          </h1>
          <p>
            Elige tu servicio, paga por transferencia o billetera digital y sube tu comprobante para activar tu acceso.
          </p>
          <div className="hero-actions">
            <a href="#catalog" className="hero-primary">Ver catalogo</a>
            {!user && <Link href="/auth/register" className="hero-secondary">Crear cuenta</Link>}
          </div>
        </div>

        <div className="storefront-trust-panel" aria-label="Ventajas de compra">
          <div>
            <ShieldCheck aria-hidden="true" />
            <strong>Pago manual revisado</strong>
            <span>Validamos tu comprobante antes de activar el servicio.</span>
          </div>
          <div>
            <Tag aria-hidden="true" />
            <strong>Cupones y promociones</strong>
            <span>Usa codigos de descuento al momento de pagar.</span>
          </div>
          <div>
            <Megaphone aria-hidden="true" />
            <strong>Soporte por WhatsApp</strong>
            <span>Consultas directas durante la compra o renovacion.</span>
          </div>
        </div>
      </section>

      <section className="announcements-section">
        <div className="section-heading">
          <div>
            <span>Novedades</span>
            <h2>Promos y avisos para comprar mejor</h2>
          </div>
          <Link href="/nosotros">Conoce MUNDOSUBS</Link>
        </div>

        {(announcements ?? []).length ? (
          <div className="announcements-grid">
            {(announcements ?? []).map((item: any) => {
              const Icon = item.type === 'promo' ? Tag : item.type === 'price_change' ? TrendingDown : Sparkles
              return (
                <article key={item.id} className="announcement-card">
                  <Icon aria-hidden="true" />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="announcement-empty">
            Pronto publicaremos cupones, nuevos servicios y cambios importantes aqui.
          </div>
        )}
      </section>

      <section id="catalog" className="catalog-shell">
        <div className="section-heading catalog-heading">
          <div>
            <span>Catalogo</span>
            <h2>Encuentra tu proxima suscripcion</h2>
          </div>
          <p>Filtra por categoria, compara precios y agrega al carrito en segundos.</p>
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
    </div>
  )
}
