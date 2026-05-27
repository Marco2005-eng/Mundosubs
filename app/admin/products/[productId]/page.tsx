'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  category: z.enum(['streaming', 'game', 'license', 'software', 'music']),
  price: z.coerce.number().positive('Precio debe ser mayor a 0'),
  duration_days: z.coerce.number().int().positive('Duración debe ser mayor a 0'),
  features: z.string(),
  image_url: z.string().url('URL de imagen invalida').or(z.literal('')).optional(),
  active: z.boolean(),
})

type FormData = z.infer<typeof schema>

const CATEGORIES = [
  { value: 'streaming', label: 'Streaming', emoji: '🎬' },
  { value: 'game', label: 'Juegos', emoji: '🎮' },
  { value: 'license', label: 'Licencia', emoji: '🔑' },
  { value: 'software', label: 'Software', emoji: '💻' },
  { value: 'music', label: 'Música', emoji: '🎵' },
]

export default function ProductFormPage() {
  const params = useParams<{ productId: string }>()
  const isNew = params.productId === 'new'
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormData>({ 
      resolver: zodResolver(schema), 
      defaultValues: { 
        active: true,
        category: 'streaming',
        price: 0,
        duration_days: 30,
        image_url: ''
      } 
    })

  const active = watch('active')
  const category = watch('category')
  const imageUrl = watch('image_url')

  useEffect(() => {
    if (isNew) return
    let ignore = false

    fetch(`/api/admin/products?id=${encodeURIComponent(params.productId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('No se pudo cargar el producto')
        return res.json()
      })
      .then(({ product }) => {
        if (!ignore && product) {
          reset({ ...product, image_url: product.image_url ?? '', features: product.features?.join('\n') ?? '' })
        }
      })
      .catch(() => {
        if (!ignore) {
          toast({ variant: 'destructive', title: 'Error al cargar el producto' })
        }
      })

    return () => {
      ignore = true
    }
  }, [params.productId, isNew, reset, toast])

  async function onSubmit(data: FormData) {
    setLoading(true)
    const payload = {
      ...data,
      image_url: data.image_url?.trim() || null,
      features: data.features.split('\n').map((f) => f.trim()).filter(Boolean),
    }

    const url = '/api/admin/products'
    const method = isNew ? 'POST' : 'PUT'
    const body = isNew ? payload : { ...payload, id: params.productId }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Error al guardar' })
      return
    }
    toast({ title: isNew ? '✅ Producto creado exitosamente' : '✅ Producto actualizado' })
    router.push('/admin/products')
  }

  return (
    <div style={{ padding: '40px 5%', maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin/products" style={{
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
              {isNew ? 'Nuevo producto' : 'Editar producto'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {isNew ? 'Agrega un nuevo servicio al catálogo' : 'Modifica los detalles del producto'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Nombre */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
              Nombre del producto *
            </label>
            <input
              {...register('name')}
              placeholder="Ej: Netflix Premium"
              className="input-dark"
              style={{ width: '100%' }}
            />
            {errors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.name.message}</span>}
          </div>

          {/* Logo por URL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
              Logo o imagen por URL
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '12px', alignItems: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                border: '1px solid var(--border2)',
                background: 'var(--bg3)',
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden'
              }}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
                  />
                ) : (
                  <ImageIcon style={{ width: '24px', height: '24px', color: 'var(--muted)' }} />
                )}
              </div>
              <div>
                <input
                  {...register('image_url')}
                  placeholder="https://cdn.ejemplo.com/logo.png"
                  className="input-dark"
                  style={{ width: '100%' }}
                />
                <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '6px' }}>
                  Usa una URL publica JPG, PNG, WEBP o SVG. Si queda vacio se usara el diseño por defecto.
                </p>
              </div>
            </div>
            {errors.image_url && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.image_url.message}</span>}
          </div>

          {/* Categoría */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
              Categoría *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setValue('category', cat.value as any)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '8px',
                    border: category === cat.value ? '2px solid var(--accent)' : '1px solid var(--border2)',
                    background: category === cat.value ? 'rgba(124,58,237,0.1)' : 'var(--bg3)',
                    color: category === cat.value ? 'var(--accent2)' : 'var(--muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{cat.emoji}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'capitalize' }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Precio y Duración */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
                Precio (PEN) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  fontWeight: 500
                }}>S/</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('price')}
                  className="input-dark"
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
              {errors.price && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.price.message}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
                Duración (días) *
              </label>
              <input
                type="number"
                {...register('duration_days')}
                className="input-dark"
                style={{ width: '100%' }}
              />
              {errors.duration_days && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.duration_days.message}</span>}
            </div>
          </div>

          {/* Características */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>
              Características (una por línea)
            </label>
            <textarea
              {...register('features')}
              placeholder="Calidad 4K&#10;Compartido hasta 5&#10;Descarga offline"
              className="input-dark"
              style={{ 
                width: '100%', 
                minHeight: '120px', 
                resize: 'vertical',
                fontFamily: "'Space Grotesk', sans-serif"
              }}
            />
          </div>

          {/* Estado */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'var(--bg3)',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {active ? (
                <Eye style={{ width: '20px', height: '20px', color: 'var(--green)' }} />
              ) : (
                <EyeOff style={{ width: '20px', height: '20px', color: 'var(--muted)' }} />
              )}
              <div>
                <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.9rem' }}>
                  Producto activo
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {active ? 'Visible en el catálogo público' : 'Oculto del catálogo'}
                </div>
              </div>
            </div>
            <label style={{ position: 'relative', width: '48px', height: '26px' }}>
              <input 
                type="checkbox" 
                {...register('active')}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                inset: 0,
                background: active ? 'var(--green)' : 'var(--muted)',
                borderRadius: '26px',
                transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '20px',
                  width: '20px',
                  left: active ? '24px' : '3px',
                  bottom: '3px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: '0.3s'
                }} />
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 24px',
              borderRadius: '8px',
              background: loading ? 'var(--muted)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: 'white',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save style={{ width: '18px', height: '18px' }} />}
            {isNew ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
