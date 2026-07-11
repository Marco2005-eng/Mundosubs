'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Image as ImageIcon, Loader2, Plus, Save, Upload, X } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  category: z.enum(['streaming', 'game', 'license', 'software', 'music']),
  price: z.coerce.number().positive('Precio debe ser mayor a 0'),
  duration_days: z.coerce.number().int().positive('Duración debe ser mayor a 0'),
  features: z.string(),
  active: z.boolean(),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const CATEGORIES = [
  { value: 'streaming', label: 'Streaming', code: 'TV' },
  { value: 'game', label: 'Juegos', code: 'GP' },
  { value: 'license', label: 'Licencia', code: 'KEY' },
  { value: 'software', label: 'Software', code: 'SW' },
  { value: 'music', label: 'Música', code: 'FM' },
] as const

export default function ProductFormPage() {
  const params = useParams<{ productId: string }>()
  const isNew = params.productId === 'new'
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Separated Image and Gallery State
  const [productIcon, setProductIcon] = useState<string>('')
  const [galleryUrls, setGalleryUrls] = useState<string[]>([])
  
  const [iconUrlDraft, setIconUrlDraft] = useState('')
  const [galleryUrlDraft, setGalleryUrlDraft] = useState('')
  
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        active: true,
        category: 'streaming',
        price: 0,
        duration_days: 30,
        features: '',
        description: '',
      },
    })

  const active = watch('active')
  const category = watch('category')

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
          reset({
            name: product.name ?? '',
            category: product.category ?? 'streaming',
            price: product.price ?? 0,
            duration_days: product.duration_days ?? 30,
            features: product.features?.join('\n') ?? '',
            active: Boolean(product.active),
            description: product.description ?? '',
          })

          const gallery = Array.isArray(product.image_urls) ? product.image_urls : []
          const mainIcon = product.image_url ?? gallery[0] ?? ''
          const secondary = gallery.filter((url: string) => url !== mainIcon).slice(0, 3)
          
          setProductIcon(mainIcon)
          setGalleryUrls(secondary)
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
    const normalizedIcon = productIcon.trim()
    const normalizedGallery = galleryUrls.map((url) => url.trim()).filter(Boolean).slice(0, 3)
    const allUrls = normalizedIcon ? [normalizedIcon, ...normalizedGallery] : normalizedGallery

    const payload = {
      ...data,
      image_url: normalizedIcon || null,
      image_urls: allUrls,
      features: data.features.split('\n').map((f) => f.trim()).filter(Boolean),
    }

    const method = isNew ? 'POST' : 'PUT'
    const body = isNew ? payload : { ...payload, id: params.productId }

    const res = await fetch('/api/admin/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Error al guardar' })
      return
    }

    toast({ 
      title: isNew ? '¡Producto creado!' : '¡Producto actualizado!',
      description: 'Actualizando el catálogo en tiempo real...',
    })
    router.push('/admin/products')
    router.refresh()
  }

  // Icon handlers
  function addIconUrl() {
    const url = iconUrlDraft.trim()
    if (!url) return
    const parsed = z.string().url().safeParse(url)
    if (!parsed.success) {
      toast({ variant: 'destructive', title: 'URL de ícono inválida' })
      return
    }
    setProductIcon(url)
    setIconUrlDraft('')
  }

  async function uploadIconImage(files: FileList | null) {
    if (!files?.length) return
    const file = files[0]
    const formData = new FormData()
    formData.append('files', file)
    formData.append('productId', isNew ? 'new' : params.productId)

    setUploadingIcon(true)
    const res = await fetch('/api/admin/product-images', {
      method: 'POST',
      body: formData,
    })
    const result = await res.json().catch(() => ({}))
    setUploadingIcon(false)

    if (!res.ok) {
      toast({ variant: 'destructive', title: result.error || 'No se pudo subir el ícono' })
      return
    }

    if (result.urls?.[0]) {
      setProductIcon(result.urls[0])
      toast({ title: 'Ícono cargado' })
    }
  }

  // Gallery handlers
  function addGalleryUrl() {
    const url = galleryUrlDraft.trim()
    if (!url) return
    if (galleryUrls.length >= 3) {
      toast({ variant: 'destructive', title: 'Solo puedes agregar hasta 3 imágenes secundarias' })
      return
    }
    const parsed = z.string().url().safeParse(url)
    if (!parsed.success) {
      toast({ variant: 'destructive', title: 'URL de imagen inválida' })
      return
    }
    setGalleryUrls((current) => [...current, url].slice(0, 3))
    setGalleryUrlDraft('')
  }

  function removeGalleryUrl(index: number) {
    setGalleryUrls((current) => current.filter((_, idx) => idx !== index))
  }

  async function uploadGalleryImages(files: FileList | null) {
    if (!files?.length) return
    const remaining = 3 - galleryUrls.length
    if (remaining <= 0) {
      toast({ variant: 'destructive', title: 'Solo puedes agregar hasta 3 imágenes secundarias' })
      return
    }

    const selectedFiles = Array.from(files).slice(0, remaining)
    const formData = new FormData()
    selectedFiles.forEach((file) => formData.append('files', file))
    formData.append('productId', isNew ? 'new' : params.productId)

    setUploadingGallery(true)
    const res = await fetch('/api/admin/product-images', {
      method: 'POST',
      body: formData,
    })
    const result = await res.json().catch(() => ({}))
    setUploadingGallery(false)

    if (!res.ok) {
      toast({ variant: 'destructive', title: result.error || 'No se pudieron subir las imágenes' })
      return
    }

    setGalleryUrls((current) => [...current, ...(result.urls ?? [])].slice(0, 3))
    toast({ title: 'Imágenes agregadas a la galería' })
  }

  return (
    <div style={{ padding: '40px 5%', maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin/products" style={backButtonStyle}>
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
          </Link>
          <div>
            <h1 style={titleStyle}>{isNew ? 'Nuevo producto' : 'Editar producto'}</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {isNew ? 'Agrega un nuevo servicio al catálogo' : 'Modifica los detalles del producto'}
            </p>
          </div>
        </div>
      </div>

      <div style={panelStyle}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Field label="Nombre del producto *" error={errors.name?.message}>
            <input {...register('name')} placeholder="Ej: Netflix Premium" className="input-dark" style={{ width: '100%' }} />
          </Field>

          {/* Section 1: Product Icon */}
          <div style={{ borderBottom: '1px solid var(--border2)', paddingBottom: '20px' }}>
            <label style={labelStyle}>Ícono del Producto (Imagen Principal) *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '16px', alignItems: 'center' }}>
              <div style={{
                ...imageSlotStyle,
                border: '2px dashed var(--accent)',
                background: 'rgba(92, 53, 176, 0.05)',
                width: '100px',
                height: '100px'
              }}>
                {productIcon ? (
                  <>
                    <img src={productIcon} alt="Ícono" loading="lazy" referrerPolicy="no-referrer" style={imagePreviewStyle} />
                    <button type="button" onClick={() => setProductIcon('')} aria-label="Quitar ícono" style={removeImageButtonStyle}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </>
                ) : (
                  <ImageIcon style={{ width: '28px', height: '28px', color: 'var(--accent)' }} />
                )}
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                  <input
                    value={iconUrlDraft}
                    onChange={(e) => setIconUrlDraft(e.target.value)}
                    placeholder="https://cdn.ejemplo.com/icono.png"
                    className="input-dark"
                    style={{ width: '100%' }}
                  />
                  <button type="button" onClick={addIconUrl} style={secondaryButtonStyle(false)}>
                    <Plus style={{ width: 16, height: 16 }} />
                    URL
                  </button>
                </div>

                <label style={uploadBoxStyle(uploadingIcon)}>
                  {uploadingIcon ? <Loader2 className="animate-spin" /> : <Upload style={{ width: 17, height: 17 }} />}
                  {uploadingIcon ? 'Subiendo...' : 'Subir ícono de la PC'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadingIcon}
                    onChange={(e) => uploadIconImage(e.target.files)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Product Gallery */}
          <div>
            <label style={labelStyle}>Galería de Imágenes Secundarias (Opcional, Máx. 3)</label>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                <input
                  value={galleryUrlDraft}
                  onChange={(e) => setGalleryUrlDraft(e.target.value)}
                  placeholder="https://cdn.ejemplo.com/imagen.png"
                  className="input-dark"
                  style={{ width: '100%' }}
                />
                <button type="button" onClick={addGalleryUrl} disabled={galleryUrls.length >= 3} style={secondaryButtonStyle(galleryUrls.length >= 3)}>
                  <Plus style={{ width: 16, height: 16 }} />
                  URL
                </button>
              </div>

              <label style={uploadBoxStyle(galleryUrls.length >= 3 || uploadingGallery)}>
                {uploadingGallery ? <Loader2 className="animate-spin" /> : <Upload style={{ width: 17, height: 17 }} />}
                {uploadingGallery ? 'Subiendo...' : 'Subir imágenes de la PC'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={galleryUrls.length >= 3 || uploadingGallery}
                  onChange={(e) => uploadGalleryImages(e.target.files)}
                  style={{ display: 'none' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                {Array.from({ length: 3 }).map((_, index) => {
                  const url = galleryUrls[index]
                  return (
                    <div key={index} style={imageSlotStyle}>
                      {url ? (
                        <>
                          <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" style={imagePreviewStyle} />
                          <button type="button" onClick={() => removeGalleryUrl(index)} aria-label="Quitar imagen" style={removeImageButtonStyle}>
                            <X style={{ width: 14, height: 14 }} />
                          </button>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <ImageIcon style={{ width: '22px', height: '22px', color: 'var(--muted)' }} />
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--muted)' }}>
                            Imagen {index + 1}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Categoría *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setValue('category', cat.value)}
                  style={{
                    background: category === cat.value ? 'var(--accent)' : 'var(--bg3)',
                    color: category === cat.value ? 'white' : 'var(--muted)',
                    border: '1px solid var(--border2)',
                    padding: '12px 6px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: '0.2s',
                  }}
                >
                  <span style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>{cat.code}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Precio (PEN) *" error={errors.price?.message}>
              <div style={{ position: 'relative' }}>
                <span style={currencyStyle}>S/</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('price')}
                  placeholder="29.90"
                  className="input-dark"
                  style={{ width: '100%', paddingLeft: '32px' }}
                />
              </div>
            </Field>

            <Field label="Duración (Días) *" error={errors.duration_days?.message}>
              <input
                type="number"
                {...register('duration_days')}
                placeholder="30"
                className="input-dark"
                style={{ width: '100%' }}
              />
            </Field>
          </div>

          <Field label="Características del servicio (Una por línea) *" error={errors.features?.message}>
            <textarea
              {...register('features')}
              placeholder="Ej: Pantallas Ultra HD&#10;Garantía completa&#10;Cuenta personal"
              className="input-dark"
              rows={4}
              style={{ width: '100%' }}
            />
          </Field>

          <Field label="Descripción adicional (Opcional)" error={errors.description?.message}>
            <textarea
              {...register('description')}
              placeholder="Escribe detalles adicionales..."
              className="input-dark"
              rows={3}
              style={{ width: '100%' }}
            />
          </Field>

          <div style={statusPanelStyle}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)' }}>
                {active ? 'Producto visible' : 'Producto oculto'}
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {active ? 'Los clientes pueden comprarlo en la tienda' : 'El producto no aparecerá en el catálogo'}
              </span>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
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
                transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  height: '20px',
                  width: '20px',
                  left: active ? '24px' : '3px',
                  bottom: '3px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: '0.3s',
                }} />
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading} style={submitStyle(loading)}>
            {loading ? <Loader2 className="animate-spin" /> : <Save style={{ width: '18px', height: '18px' }} />}
            {isNew ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  )
}

const backButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  background: 'var(--bg3)',
  color: 'var(--muted)',
  textDecoration: 'none',
}

const titleStyle = {
  fontFamily: "'Unbounded', sans-serif",
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--text)',
}

const panelStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border2)',
  borderRadius: '12px',
  padding: '24px',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 500,
  marginBottom: '8px',
  color: 'var(--text)',
}

const currencyStyle = {
  position: 'absolute' as const,
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--muted)',
  fontWeight: 500,
}

const statusPanelStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px',
  background: 'var(--bg3)',
  borderRadius: '8px',
}

const imageSlotStyle = {
  aspectRatio: '1 / 1',
  borderRadius: '12px',
  border: '1px solid var(--border2)',
  background: 'var(--bg3)',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  position: 'relative' as const,
}

const imagePreviewStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain' as const,
  padding: '8px',
}

const removeImageButtonStyle = {
  position: 'absolute' as const,
  top: '6px',
  right: '6px',
  width: '26px',
  height: '26px',
  borderRadius: '999px',
  border: '1px solid rgba(0,0,0,0.12)',
  background: 'rgba(15,23,42,0.82)',
  color: 'white',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
}

function secondaryButtonStyle(disabled: boolean) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    padding: '0 14px',
    borderRadius: '8px',
    border: '1px solid var(--border2)',
    background: disabled ? 'var(--bg3)' : 'var(--card)',
    color: disabled ? 'var(--muted)' : 'var(--text)',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

function uploadBoxStyle(disabled: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '38px',
    borderRadius: '8px',
    border: '1px dashed var(--border2)',
    background: 'var(--bg3)',
    color: disabled ? 'var(--muted)' : 'var(--text)',
    fontSize: '0.82rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  }
}

function submitStyle(disabled: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    height: '46px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--accent)',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    transition: '0.2s',
  }
}
