'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import type { Product } from '@/components/ProductCard'
import { useToast } from '@/components/ui/use-toast'
import { Search } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  streaming: 'Streaming',
  game: 'Juegos',
  license: 'Licencia',
  software: 'Software',
  music: 'Musica',
}

interface ResolvedProduct {
  product: Product
  discountPct: number
  discountLabel?: string
}

export function StorefrontClient({
  items,
  categories,
  initialCategory,
  initialQuery,
}: {
  items: ResolvedProduct[]
  categories: string[]
  initialCategory?: string
  initialQuery?: string
}) {
  const [category, setCategory] = useState(initialCategory ?? '')
  const [query, setQuery] = useState(initialQuery ?? '')
  const { addItem } = useCartStore()
  const { toast } = useToast()

  const filtered = items.filter(item => {
    if (category && item.product.category !== category) return false
    if (query && !item.product.name.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const transitionKey = `${category || 'all'}-${query}-${filtered.length}`

  function handleCategory(cat: string) {
    setCategory(cat)
    const url = new URL(window.location.href)
    if (cat) url.searchParams.set('category', cat)
    else url.searchParams.delete('category')
    if (query) url.searchParams.set('q', query)
    else url.searchParams.delete('q')
    window.history.replaceState({}, '', url.toString())
  }

  function handleSearch(val: string) {
    setQuery(val)
    const url = new URL(window.location.href)
    if (val) url.searchParams.set('q', val)
    else url.searchParams.delete('q')
    if (category) url.searchParams.set('category', category)
    else url.searchParams.delete('category')
    window.history.replaceState({}, '', url.toString())
  }

  function handleAddToCart(product: Product, discountPct: number) {
    addItem(product, discountPct)
    toast({
      title: '✓ Agregado al carrito',
      description: product.name,
      duration: 2000,
    })
  }

  return (
    <>
      <div className="catalog-controls" style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: '28px',
      }}>
        <div className="catalog-search" style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.35, color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Buscar servicio..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            className="input-dark"
            style={{ width: '100%', paddingLeft: '38px' }}
          />
        </div>

        <div className="category-strip" style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleCategory('')}
            style={{
              background: !category ? 'rgba(124,58,237,0.15)' : 'var(--bg3)',
              border: '1px solid var(--border2)',
              color: !category ? 'var(--accent2)' : 'var(--muted)',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategory(category === cat ? '' : cat)}
              style={{
                background: category === cat ? 'rgba(124,58,237,0.15)' : 'var(--bg3)',
                border: '1px solid var(--border2)',
                color: category === cat ? 'var(--accent2)' : 'var(--muted)',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 500,
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div key={transitionKey} className="product-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(245px, 1fr))',
        gap: '18px',
        animation: 'catalogGridEnter 360ms cubic-bezier(.2,.8,.2,1)',
      }}>
        {filtered.map(({ product, discountPct }, index) => (
          <div
            key={product.id}
            className="card product-card"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border2)',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
              position: 'relative',
              opacity: 0,
              animation: 'catalogCardEnter 420ms cubic-bezier(.2,.8,.2,1) forwards',
              animationDelay: `${Math.min(index * 45, 270)}ms`,
            }}
          >
            <div className="product-card-media" style={{
              height: '152px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Unbounded', sans-serif",
              fontSize: '1.22rem',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: 0,
              background: product.image_url
                ? 'linear-gradient(135deg, rgba(248,250,252,0.98), rgba(241,245,249,0.94))'
                : 'linear-gradient(135deg, var(--accent), var(--hot))',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: product.image_url
                  ? 'radial-gradient(circle at 50% 42%, rgba(124,58,237,0.14), transparent 56%)'
                  : 'linear-gradient(to bottom, transparent 34%, rgba(15,15,26,0.86))',
              }} />
              {product.image_url ? (
                <div
                  style={{
                    width: '112px',
                    height: '112px',
                    borderRadius: '22px',
                    background: '#ffffff',
                    border: '1px solid rgba(148,163,184,0.24)',
                    display: 'grid',
                    placeItems: 'center',
                    padding: '16px',
                    boxShadow: '0 18px 42px rgba(15,23,42,0.16)',
                    zIndex: 1,
                  }}
                >
                  <img
                    src={product.image_url}
                    alt={`${product.name} logo`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '22px',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(255,255,255,0.13)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'white',
                  boxShadow: '0 18px 42px rgba(15,15,26,0.24)',
                  zIndex: 1,
                }}>
                  {product.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 2,
                fontSize: '0.66rem',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                padding: '5px 10px',
                borderRadius: '999px',
                background: product.image_url ? 'rgba(15,23,42,0.08)' : 'rgba(0,0,0,0.52)',
                color: product.image_url ? 'var(--text)' : 'rgba(255,255,255,0.88)',
              }}>
                {CATEGORY_LABELS[product.category] ?? product.category}
              </span>
            </div>

            <div className="product-card-body" style={{ padding: '16px' }}>
              <h3 style={{
                fontSize: '1.02rem',
                fontWeight: 800,
                marginBottom: '6px',
                letterSpacing: 0,
                color: 'var(--text)',
                lineHeight: 1.25,
              }}>
                {product.name}
              </h3>
              <p style={{
                fontSize: '0.78rem',
                color: 'var(--muted)',
                lineHeight: 1.5,
                marginBottom: '10px',
              }}>
                {product.features?.slice(0, 2).join(', ')}
              </p>

              <span style={{
                display: 'inline-block',
                margin: '10px 0',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--accent2)',
                background: 'rgba(168,85,247,0.1)',
                border: '1px solid rgba(168,85,247,0.2)',
                padding: '2px 9px',
                borderRadius: '5px',
              }}>
                {product.duration_days} días de acceso
              </span>

              {discountPct > 0 && (
                <span style={{
                  display: 'inline-block',
                  marginLeft: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--green)',
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  padding: '2px 9px',
                  borderRadius: '5px',
                }}>
                  -{discountPct}% OFF
                </span>
              )}

              <div className="product-card-footer" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border2)',
                paddingTop: '13px',
                marginTop: '12px',
              }}>
                <div style={{
                  fontFamily: "'Unbounded', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--green)',
                }}>
                  S/{product.price.toFixed(2)}
                </div>
                <button
                  onClick={() => handleAddToCart(product, discountPct)}
                  className="btn-add"
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    color: 'var(--green)',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '7px 13px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            No hay productos disponibles.
          </div>
        )}
      </div>
    </>
  )
}
