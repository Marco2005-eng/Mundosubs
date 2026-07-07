import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { AdminProductsManager } from '@/components/AdminProductsManager'

export default async function AdminProductsPage() {
  await requireAdmin()
  const supabase = createServiceClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('name')

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
              {products?.length || 0} productos en el catálogo
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

      <AdminProductsManager initialProducts={products || []} />
    </div>
  )
}
