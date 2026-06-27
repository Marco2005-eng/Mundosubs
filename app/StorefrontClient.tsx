'use client'

import { useMemo, useState } from 'react'
import { Search, ShoppingCart, Star } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import type { Product } from '@/components/ProductCard'
import { ProductModal } from '@/components/ProductModal'
import { useToast } from '@/components/ui/use-toast'

const CATEGORY_LABELS: Record<string, string> = {
  streaming: 'Streaming',
  game: 'Juegos',
  license: 'Licencias',
  software: 'Software',
  music: 'Música',
}

const CATEGORY_BADGES: Record<string, string> = {
  streaming: 'TV',
  game: 'GP',
  license: 'KEY',
  software: 'SW',
  music: 'FM',
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
  const [selectedProduct, setSelectedProduct] = useState<ResolvedProduct | null>(null)
  const { addItem } = useCartStore()
  const { toast } = useToast()

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return items.filter(({ product }) => {
      if (category && product.category !== category) return false
      if (normalizedQuery && !product.name.toLowerCase().includes(normalizedQuery)) return false
      return true
    })
  }, [category, items, query])

  const hasFilter = Boolean(category || query.trim())
  const highlighted = useMemo(() => {
    const discounted = items.filter((item) => item.discountPct > 0)
    const source = discounted.length ? discounted : items
    return source.slice(0, 4)
  }, [items])

  const grouped = useMemo(() => {
    return categories
      .map((cat) => ({
        category: cat,
        label: CATEGORY_LABELS[cat] ?? cat,
        items: items.filter(({ product }) => product.category === cat).slice(0, 6),
      }))
      .filter((group) => group.items.length > 0)
  }, [categories, items])

  function updateUrl(nextCategory: string, nextQuery: string) {
    const url = new URL(window.location.href)
    if (nextCategory) url.searchParams.set('category', nextCategory)
    else url.searchParams.delete('category')
    if (nextQuery) url.searchParams.set('q', nextQuery)
    else url.searchParams.delete('q')
    window.history.replaceState({}, '', url.toString())
  }

  function handleCategory(cat: string) {
    const next = category === cat ? '' : cat
    setCategory(next)
    updateUrl(next, query)
  }

  function handleSearch(value: string) {
    setQuery(value)
    updateUrl(category, value)
  }

  function handleAddToCart(product: Product, discountPct: number) {
    addItem(product, discountPct)
    toast({
      title: 'Agregado al carrito',
      description: `${product.name} ya está listo para pagar.`,
      duration: 1800,
    })
  }

  function renderProductCard(item: ResolvedProduct, index = 0) {
    const { product, discountPct } = item
    const finalPrice = product.price * (1 - discountPct / 100)

    return (
      <article
        key={product.id}
        className="catalog-product-card"
        style={{ animationDelay: `${Math.min(index * 35, 180)}ms` }}
      >
        <button type="button" className="catalog-card-main" onClick={() => setSelectedProduct(item)}>
          <div className="catalog-card-media">
            <span className="catalog-card-category">{CATEGORY_LABELS[product.category] ?? product.category}</span>
            {product.image_url ? (
              <div className="catalog-card-logo">
                <img src={product.image_url} alt={`${product.name} logo`} loading="lazy" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="catalog-card-fallback">{product.name.slice(0, 2).toUpperCase()}</div>
            )}
          </div>

          <div className="catalog-card-content">
            <h3>{product.name}</h3>
            <p>{product.features?.slice(0, 2).join(', ') || 'Acceso digital con entrega revisada.'}</p>
            <div className="catalog-card-badges">
              <span>{product.duration_days} días</span>
              {discountPct > 0 && <span className="catalog-discount">-{discountPct}%</span>}
            </div>
          </div>
        </button>

        <div className="catalog-card-footer">
          <div>
            <strong>S/{finalPrice.toFixed(2)}</strong>
            {discountPct > 0 && <span>S/{product.price.toFixed(2)}</span>}
          </div>
          <button type="button" onClick={() => handleAddToCart(product, discountPct)}>
            <ShoppingCart aria-hidden="true" />
            Agregar
          </button>
        </div>
      </article>
    )
  }

  return (
    <div className="catalog-experience">
      <section className="catalog-toolbar" aria-label="Buscar y filtrar servicios">
        <div className="catalog-search">
          <Search aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar Netflix, Disney, Spotify..."
            value={query}
            onChange={(event) => handleSearch(event.target.value)}
          />
        </div>

        <div className="category-strip">
          <button type="button" className={!category ? 'active' : ''} onClick={() => handleCategory('')}>
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={category === cat ? 'active' : ''}
              onClick={() => handleCategory(cat)}
            >
              <span>{CATEGORY_BADGES[cat] ?? 'MS'}</span>
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </section>

      {hasFilter ? (
        <section className="catalog-section">
          <div className="catalog-section-header">
            <div>
              <span>{filtered.length} resultados</span>
              <h2>{category ? CATEGORY_LABELS[category] ?? category : 'Búsqueda'}</h2>
            </div>
          </div>
          <div className="catalog-grid">
            {filtered.map((item, index) => renderProductCard(item, index))}
          </div>
          {filtered.length === 0 && <EmptyCatalog />}
        </section>
      ) : (
        <>
          <section className="catalog-section catalog-featured">
            <div className="catalog-section-header">
              <div>
                <span>Recomendados</span>
                <h2>Servicios para empezar hoy</h2>
              </div>
              <Star aria-hidden="true" />
            </div>
            <div className="catalog-grid catalog-grid-featured">
              {highlighted.map((item, index) => renderProductCard(item, index))}
            </div>
          </section>

          {grouped.map((group) => (
            <section key={group.category} className="catalog-section">
              <div className="catalog-section-header">
                <div>
                  <span>{group.items.length} servicios</span>
                  <h2>{group.label}</h2>
                </div>
                <button type="button" onClick={() => handleCategory(group.category)}>
                  Ver categoría
                </button>
              </div>
              <div className="catalog-grid">
                {group.items.map((item, index) => renderProductCard(item, index))}
              </div>
            </section>
          ))}
        </>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct.product}
          discountPct={selectedProduct.discountPct}
          discountLabel={selectedProduct.discountLabel}
          open={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(product, discountPct) => handleAddToCart(product, discountPct)}
        />
      )}
    </div>
  )
}

function EmptyCatalog() {
  return (
    <div className="catalog-empty">
      <h3>No encontramos servicios con ese filtro</h3>
      <p>Prueba buscando por nombre o cambia la categoría.</p>
    </div>
  )
}
