import { createServiceClient } from '@/lib/supabase/server'
import { formatPEN } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Eye, Users, Search, Crown } from 'lucide-react'
import { PaginationControls } from '@/components/PaginationControls'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; q?: string }
}) {
  const supabase = createServiceClient()

  const page = parseInt(searchParams.page || '1')
  const limit = parseInt(searchParams.limit || '10')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (searchParams.q) {
    query = query.or(`email.ilike.%${searchParams.q}%,full_name.ilike.%${searchParams.q}%`)
  }

  const { data: users, count } = await query
  const totalPages = count ? Math.ceil(count / limit) : 1

  return (
    <div style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
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
              Usuarios
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {count || 0} usuarios registrados
            </p>
          </div>
        </div>
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
            placeholder="Buscar usuarios por email o nombre..."
            defaultValue={searchParams.q}
            className="input-dark"
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </form>
      </div>

      {!users?.length ? (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center'
        }}>
          <Users style={{ width: '48px', height: '48px', opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ color: 'var(--muted)' }}>
            {searchParams.q ? 'No usuarios encontrados' : 'No hay usuarios registrados'}
          </p>
          {searchParams.q && (
            <Link href="/admin/users" style={{
              color: 'var(--accent2)',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'inline-block',
              marginTop: '8px'
            }}>
              Limpiar búsqueda
            </Link>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {users.map((u: any) => {
            const isAdmin = u.role === 'admin'
            
            return (
              <div key={u.id} style={{
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
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: isAdmin ? 'linear-gradient(135deg, var(--accent), var(--hot))' : 'var(--bg3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Unbounded', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: isAdmin ? 'white' : 'var(--muted)'
                  }}>
                    {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                  </div>
                  {isAdmin && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--hot)',
                      background: 'rgba(249,115,22,0.1)',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      <Crown style={{ width: '12px', height: '12px' }} /> Admin
                    </span>
                  )}
                </div>
                
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '4px'
                }}>
                  {u.user_metadata?.full_name || u.full_name || 'Sin nombre'}
                </h3>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                  marginBottom: '16px',
                  wordBreak: 'break-all'
                }}>
                  {u.email}
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border2)'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px'
                    }}>
                      Registrado
                    </div>
                    <div style={{
                      fontFamily: "'Unbounded', sans-serif",
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text)'
                    }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) : '-'}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px'
                    }}>
                      Rol
                    </div>
                    <div style={{
                      fontFamily: "'Unbounded', sans-serif",
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: isAdmin ? 'var(--hot)' : 'var(--text)'
                    }}>
                      {isAdmin ? 'Admin' : 'Usuario'}
                    </div>
                  </div>
                </div>

                <Link href={`/admin/users/${u.id}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  marginTop: '16px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border2)',
                  background: 'transparent',
                  color: 'var(--text)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}>
                  <Eye style={{ width: '16px', height: '16px' }} /> Ver detalles
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/admin/users"
        />
      )}
    </div>
  )
}
