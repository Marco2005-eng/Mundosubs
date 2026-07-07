'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Package, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatPEN } from '@/lib/utils'

interface Product {
  id: string
  name: string
  category: string
  price: number
  duration_days: number
  active: boolean
  image_urls: string[] | null
  image_url: string | null
}

export function AdminProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Filter and sort client-side (instant)
  const filteredProducts = useMemo(() => {
    setPage(1) // Reset page when query changes
    return initialProducts.filter((p) => {
      const matchesQ = q.trim() 
        ? p.name.toLowerCase().includes(q.toLowerCase()) 
        : true
      const matchesCat = category !== 'all' 
        ? p.category === category 
        : true
      return matchesQ && matchesCat
    })
  }, [q, category, initialProducts])

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / limit)
  const paginatedProducts = useMemo(() => {
    const from = (page - 1) * limit
    const to = from + limit
    return filteredProducts.slice(from, to)
  }, [filteredProducts, page, limit])

  return (
    <div>
      {/* Filtros Instantáneos */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', width: '100%', maxWidth: '650px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
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
            placeholder="Buscar productos en tiempo real..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input-dark"
            style={{ width: '100%', paddingLeft: '40px', height: '42px' }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-dark text-sm"
          style={{ padding: '0 12px', borderRadius: '8px', cursor: 'pointer', height: '42px', minWidth: '180px' }}
        >
          <option value="all">Todas las categorías</option>
          <option value="streaming">Streaming</option>
          <option value="game">Juegos</option>
          <option value="license">Licencias</option>
          <option value="software">Software</option>
          <option value="music">Música</option>
        </select>
      </div>

      {/* Grid de Productos */}
      {paginatedProducts.length === 0 ? (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center'
        }}>
          <Package style={{ width: '48px', height: '48px', opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>
            No se encontraron productos coincidentes
          </p>
          {(q || category !== 'all') && (
            <button
              onClick={() => {
                setQ('')
                setCategory('all')
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent2)',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {paginatedProducts.map((p) => {
            const productImage = Array.isArray(p.image_urls) && p.image_urls.length ? p.image_urls[0] : p.image_url

            return (
              <div key={p.id} style={{
                background: 'var(--card)',
                border: '1px solid var(--border2)',
                borderRadius: '12px',
                padding: '20px',
                transition: 'all 0.2s'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  {productImage ? (
                    <img
                      src={productImage}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        border: '1px solid var(--border2)',
                        objectFit: 'contain',
                        padding: '5px',
                        background: 'var(--bg2)'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--accent), var(--hot))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Package style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                  )}
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: p.active ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                    color: p.active ? 'var(--green)' : 'var(--muted)'
                  }}>
                    {p.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '4px'
                }}>
                  {p.name}
                </h3>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                  textTransform: 'capitalize',
                  marginBottom: '12px'
                }}>
                  {p.category}
                </p>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border2)'
                }}>
                  <div>
                    <span style={{
                      fontFamily: "'Unbounded', sans-serif",
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--green)'
                    }}>
                      {formatPEN(p.price)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '4px' }}>
                      / {p.duration_days} días
                    </span>
                  </div>
                  <Link href={`/admin/products/${p.id}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border2)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    textDecoration: 'none'
                  }}>
                    <Pencil style={{ width: '14px', height: '14px' }} /> Editar
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginación Local */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 py-4" style={{ borderTop: '1px solid var(--border2)' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Mostrar</span>
            <select 
              value={limit} 
              onChange={(e) => {
                setLimit(parseInt(e.target.value))
                setPage(1)
              }}
              className="input-dark text-sm px-2 py-1 rounded"
              style={{ width: '80px', height: '36px' }}
            >
              {[5, 10, 20].map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>por página</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border2)',
                background: page === 1 ? 'var(--bg3)' : 'var(--card)',
                color: page === 1 ? 'var(--muted)' : 'var(--text)',
                cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
            </button>

            <span style={{ fontSize: '0.85rem', color: 'var(--text)', padding: '0 8px' }}>
              Página {page} de {totalPages}
            </span>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border2)',
                background: page === totalPages ? 'var(--bg3)' : 'var(--card)',
                color: page === totalPages ? 'var(--muted)' : 'var(--text)',
                cursor: page === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
