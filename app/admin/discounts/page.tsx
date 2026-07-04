'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Tag, Trash2, Edit } from 'lucide-react'

const schema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Nombre requerido'),
  type: z.enum(['loyalty', 'manual']),
  pct: z.coerce.number().positive().max(100, 'Máximo 100%'),
  min_purchases: z.coerce.number().int().min(0).optional(),
})

type FormData = z.infer<typeof schema>

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { type: 'loyalty', min_purchases: 3 } })

  async function loadDiscounts() {
    const supabase = createClient()
    const { data } = await supabase.from('discounts').select('*').order('created_at', { ascending: false })
    setDiscounts(data ?? [])
  }

  useEffect(() => { loadDiscounts() }, [])

  async function onSubmit(data: FormData) {
    setLoading(true)
    const method = data.id ? 'PUT' : 'POST'
    const res = await fetch('/api/admin/discounts', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setLoading(false)
    if (!res.ok) return
    reset({ type: 'loyalty', min_purchases: 3, id: undefined, label: '', pct: 0 })
    setShowForm(false)
    loadDiscounts()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este descuento? Si ya fue usado, no se podrá eliminar.')) return
    
    await fetch(`/api/admin/discounts?id=${id}`, { method: 'DELETE' })
    loadDiscounts()
  }

  async function handleToggleActive(d: any) {
    await fetch('/api/admin/discounts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...d, active: !d.active }),
    })
    loadDiscounts()
  }

  function handleEdit(d: any) {
    reset({
      id: d.id,
      label: d.label,
      type: d.type,
      pct: d.pct,
      min_purchases: d.min_purchases || 0
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
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
              Descuentos
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {discounts.length} reglas de descuento
            </p>
          </div>
        </div>
        <button onClick={() => {
          if (showForm) {
            reset({ type: 'loyalty', min_purchases: 3, id: undefined, label: '', pct: 0 })
          }
          setShowForm(!showForm)
        }} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '8px',
          background: showForm ? 'var(--bg3)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
          color: 'white',
          border: showForm ? '1px solid var(--border2)' : 'none',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          {showForm ? 'Cancelar' : <><Plus style={{ width: '16px', height: '16px' }} /> Nuevo descuento</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '20px'
          }}>
            {watch('id') ? 'Editar regla de descuento' : 'Crear nueva regla de descuento'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text)' }}>
                  Nombre (interno)
                </label>
                <input
                  {...register('label')}
                  placeholder="Ej: Cliente frecuente"
                  className="input-dark"
                  style={{ width: '100%' }}
                />
                {errors.label && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.label.message}</span>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text)' }}>
                  Tipo
                </label>
                <select
                  value={watch('type')}
                  onChange={(e) => setValue('type', e.target.value as any)}
                  className="input-dark"
                  style={{ width: '100%' }}
                >
                  <option value="loyalty">Por lealtad (compras)</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text)' }}>
                  Porcentaje (%)
                </label>
                <input
                  type="number"
                  {...register('pct')}
                  placeholder="10"
                  className="input-dark"
                  style={{ width: '100%' }}
                />
                {errors.pct && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.pct.message}</span>}
              </div>
              {watch('type') === 'loyalty' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text)' }}>
                    Mínimo compras
                  </label>
                  <input
                    type="number"
                    {...register('min_purchases')}
                    placeholder="3"
                    className="input-dark"
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '12px 24px',
              borderRadius: '8px',
              background: 'var(--green)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              alignSelf: 'flex-start'
            }}>
              {loading ? <Loader2 className="animate-spin" /> : watch('id') ? 'Guardar cambios' : 'Crear descuento'}
            </button>
          </form>
        </div>
      )}

      {/* Discounts List */}
      {!discounts.length ? (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border2)',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center'
        }}>
          <Tag style={{ width: '48px', height: '48px', opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>No hay descuentos configurados</p>
          <button onClick={() => setShowForm(true)} style={{
            color: 'var(--accent2)',
            background: 'none',
            border: 'none',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            Crear primer descuento
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {discounts.map((d) => (
            <div key={d.id} style={{
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
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(34,197,94,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Tag style={{ width: '20px', height: '20px', color: 'var(--green)' }} />
                </div>
                <button 
                  onClick={() => handleToggleActive(d)}
                  style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: d.active ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                  color: d.active ? 'var(--green)' : 'var(--muted)',
                  border: 'none',
                  cursor: 'pointer'
                }}>
                  {d.active ? 'Activo' : 'Inactivo'}
                </button>
              </div>
              
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: '4px'
              }}>
                {d.label}
              </h3>
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--muted)',
                textTransform: 'capitalize',
                marginBottom: '12px'
              }}>
                Tipo: {d.type === 'loyalty' ? 'Por lealtad' : 'Manual'}
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
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: 'var(--green)'
                  }}>
                    {d.pct}%
                  </span>
                  {d.type === 'loyalty' && d.min_purchases && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '8px' }}>
                      desde {d.min_purchases} compras
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(d)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', cursor: 'pointer'
                  }}>
                    <Edit style={{ width: '16px', height: '16px' }} />
                  </button>
                  <button onClick={() => handleDelete(d.id)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer'
                  }}>
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}