import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { formatPEN } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Package, Search } from 'lucide-react'
import { PaginationControls } from '@/components/PaginationControls'

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; q?: string }
}) {
  await requireAdmin()
  const supabase = createServiceClient()

  const page = parseInt(searchParams.page || '1')
  const limit = parseInt(searchParams.limit || '10')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('name')
    .range(from, to)

  if (searchParams.q) {
    query = query.ilike('name', `%${searchParams.q}%`)
  }

  const { data: products, count } = await query
  const totalPages = count ? Math.ceil(count / limit) : 1

  return (
    <div style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
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
              Productos
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {count || 0} productos en el catálogo
            </p>
          </div>
        </div>
        <Link href="/admin/products/new" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          color: 'white',
          fontSize: '0.9rem',
          fontWeight: 600,
          textDecoration: 'none'
        }}>
          <Plus style={{ width: '16px', height: '16px' }} /> Nuevo producto
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <form style={{ flex: '1', maxWidth: '400px', position: 'relative' }}>
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
            placeholder="Buscar productos..."
            defaultValue={searchParams.q}
            className="input-dark"
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </form>
      </div>

      {!products?.length ? (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center'
        }}>
          <Package style={{ width: '48px', height: '48px', opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>
            {searchParams.q ? 'No se encontraron productos' : 'No hay productos todavía'}
          </p>
          {searchParams.q ? (
            <Link href="/admin/products" style={{
              color: 'var(--accent2)',
              textDecoration: 'none',
              fontWeight: 500
            }}>
              Limpiar búsqueda
            </Link>
          ) : (
            <Link href="/admin/products/new" style={{
              color: 'var(--accent2)',
              textDecoration: 'none',
              fontWeight: 500
            }}>
              Crear primer producto
            </Link>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {products.map((p: any) => {
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

      {totalPages > 1 && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/admin/products"
        />
      )}
    </div>
  )
}
