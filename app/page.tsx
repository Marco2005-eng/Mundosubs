import { createClient } from '@/lib/supabase/server'
import { getEligibleDiscounts, getBestDiscount } from '@/lib/discounts'
import { StorefrontClient } from './StorefrontClient'
import Link from 'next/link'
import { Megaphone, Sparkles, Tag, TrendingDown } from 'lucide-react'

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
    .limit(6)
    .then((result) => result.error ? { data: [] } : result)
  const discounts = user ? await getEligibleDiscounts(user.id) : []

  const items = (products ?? []).map((product) => {
    const best = getBestDiscount(discounts, product.id, product.category)
    return { product, discountPct: best?.pct ?? 0, discountLabel: best?.label }
  })

  const CATEGORIES = ['streaming', 'game', 'license', 'software', 'music']

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      {/* Hero Section */}
      <section className="store-hero" style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '90px 5% 70px',
        textAlign: 'center'
      }}>
        {/* Glowing orbs */}
        <div style={{
          position: 'absolute',
          top: '-140px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.22) 0%, transparent 65%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '40px',
          right: '-80px',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(249,115,22,0.12) 0%, transparent 65%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--accent2)',
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(168,85,247,0.25)',
          padding: '5px 14px',
          borderRadius: '20px',
          marginBottom: '24px'
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent2)', animation: 'pulse 2s infinite' }} />
          Tu mundo de suscripciones
        </div>

        <h1 style={{
          fontFamily: "'Unbounded', sans-serif",
          fontSize: 'clamp(2rem, 5.5vw, 3.8rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          maxWidth: '800px',
          margin: '0 auto 18px',
          letterSpacing: '-1px'
        }}>
          <span className="text-grad">Streaming, juegos y más</span>
          <br />en soles peruanos
        </h1>

        <p style={{
          color: 'var(--muted)',
          fontSize: '1.05rem',
          maxWidth: '480px',
          margin: '0 auto 36px',
          lineHeight: 1.65
        }}>
          Accede a Netflix, Spotify, Xbox, Steam y más. Sin tarjeta internacional, directamente desde Perú.
        </p>

        <div className="hero-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#catalog" className="btn-primary" style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: 'white',
            border: 'none',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.95rem',
            fontWeight: 600,
            padding: '13px 28px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textDecoration: 'none',
            display: 'inline-block'
          }}>
            Ver catálogo
          </a>
          {!user && (
            <Link href="/auth/register" className="btn-secondary" style={{
              background: 'transparent',
              border: '1px solid var(--border2)',
              color: 'var(--text)',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.95rem',
              fontWeight: 500,
              padding: '13px 28px',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              Crear cuenta
            </Link>
          )}
        </div>
      </section>

      {/* Stats */}
      <div className="store-stats" style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 0,
        borderTop: '1px solid var(--border2)',
        borderBottom: '1px solid var(--border2)',
        background: 'var(--bg2)'
      }}>
        {[
          { n: '+500', l: 'Clientes activos' },
          { n: '15+', l: 'Servicios disponibles' },
          { n: 'S/0', l: 'Sin tarjeta internacional' }
        ].map((stat, i) => (
          <div key={i} className="store-stat" style={{
            padding: '28px 48px',
            textAlign: 'center',
            borderRight: '1px solid var(--border2)',
            flex: '1',
            minWidth: '140px'
          }}>
            <div style={{
              fontFamily: "'Unbounded', sans-serif",
              fontSize: '1.8rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--accent2), var(--hot))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>{stat.n}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '4px' }}>{stat.l}</div>
          </div>
        ))}
      </div>

      <section style={{ width: '90%', maxWidth: '1100px', margin: '42px auto 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
          <div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.15rem',
              fontWeight: 900,
              color: 'var(--text)'
            }}>
              Novedades y promociones
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>
              Cupones, nuevos servicios y cambios importantes para tus proximas compras.
            </p>
          </div>
          <Megaphone style={{ width: 24, height: 24, color: 'var(--accent2)' }} />
        </div>

        {(announcements ?? []).length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
            {(announcements ?? []).map((item: any) => {
              const Icon = item.type === 'promo' ? Tag : item.type === 'price_change' ? TrendingDown : Sparkles
              return (
                <article key={item.id} style={{
                  border: '1px solid var(--border2)',
                  borderRadius: '12px',
                  background: 'var(--card)',
                  padding: '16px',
                  display: 'grid',
                  gap: '10px'
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: item.type === 'promo' ? 'rgba(34,197,94,0.1)' : 'rgba(124,58,237,0.1)',
                    display: 'grid',
                    placeItems: 'center'
                  }}>
                    <Icon style={{ width: 18, height: 18, color: item.type === 'promo' ? 'var(--green)' : 'var(--accent2)' }} />
                  </div>
                  <div>
                    <h3 style={{ color: 'var(--text)', fontSize: '0.95rem', fontWeight: 850, marginBottom: '4px' }}>
                      {item.title}
                    </h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.45 }}>
                      {item.body}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div style={{
            border: '1px dashed var(--border2)',
            borderRadius: '12px',
            background: 'var(--bg2)',
            padding: '18px',
            color: 'var(--muted)',
            fontSize: '0.86rem'
          }}>
            Pronto publicaremos cupones y novedades aqui.
          </div>
        )}
      </section>

      {/* Catalog */}
      <div id="catalog" className="catalog-shell" style={{ width: '90%', maxWidth: '1100px', margin: '48px auto 70px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: 'var(--muted)'
          }}>
            Catálogo
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
        </div>

        {!items.length ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            No hay productos disponibles.
          </div>
        ) : (
          <StorefrontClient
            items={items}
            categories={CATEGORIES}
            initialCategory={searchParams.category}
            initialQuery={searchParams.q}
          />
        )}
      </div>
    </div>
  )
}
