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
  duration_days: z.coerce.number().int().positive('Duracion debe ser mayor a 0'),
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
  { value: 'music', label: 'Musica', code: 'FM' },
] as const

export default function ProductFormPage() {
  const params = useParams<{ productId: string }>()
  const isNew = params.productId === 'new'
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageUrlDraft, setImageUrlDraft] = useState('')

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
          setImageUrls((gallery.length ? gallery : product.image_url ? [product.image_url] : []).slice(0, 4))
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
    const normalizedImageUrls = imageUrls.map((url) => url.trim()).filter(Boolean).slice(0, 4)
    const payload = {
      ...data,
      image_url: normalizedImageUrls[0] ?? null,
      image_urls: normalizedImageUrls,
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

    toast({ title: isNew ? 'Producto creado exitosamente' : 'Producto actualizado' })
    router.push('/admin/products')
  }

  function addImageUrl() {
    const url = imageUrlDraft.trim()
    if (!url) return

    if (imageUrls.length >= 4) {
      toast({ variant: 'destructive', title: 'Solo puedes agregar hasta 4 imagenes' })
      return
    }

    const parsed = z.string().url().safeParse(url)
    if (!parsed.success) {
      toast({ variant: 'destructive', title: 'URL de imagen invalida' })
      return
    }

    setImageUrls((current) => [...current, url].slice(0, 4))
    setImageUrlDraft('')
  }

  function removeImageUrl(index: number) {
    setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  async function uploadProductImages(files: FileList | null) {
    if (!files?.length) return
    const remaining = 4 - imageUrls.length

    if (remaining <= 0) {
      toast({ variant: 'destructive', title: 'Solo puedes agregar hasta 4 imagenes' })
      return
    }

    const selectedFiles = Array.from(files).slice(0, remaining)
    const formData = new FormData()
    selectedFiles.forEach((file) => formData.append('files', file))
    formData.append('productId', isNew ? 'new' : params.productId)

    setUploadingImages(true)
    const res = await fetch('/api/admin/product-images', {
      method: 'POST',
      body: formData,
    })
    const result = await res.json().catch(() => ({}))
    setUploadingImages(false)

    if (!res.ok) {
      toast({ variant: 'destructive', title: result.error || 'No se pudieron subir las imagenes' })
      return
    }

    setImageUrls((current) => [...current, ...(result.urls ?? [])].slice(0, 4))
    toast({ title: 'Imagenes cargadas' })
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
              {isNew ? 'Agrega un nuevo servicio al catalogo' : 'Modifica los detalles del producto'}
            </p>
          </div>
        </div>
      </div>

      <div style={panelStyle}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Field label="Nombre del producto *" error={errors.name?.message}>
            <input {...register('name')} placeholder="Ej: Netflix Premium" className="input-dark" style={{ width: '100%' }} />
          </Field>

          <ImageManager
            imageUrls={imageUrls}
            imageUrlDraft={imageUrlDraft}
            uploadingImages={uploadingImages}
            onDraftChange={setImageUrlDraft}
            onAddUrl={addImageUrl}
            onRemove={removeImageUrl}
            onUpload={uploadProductImages}
          />

          <div>
            <label style={labelStyle}>Categoria *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setValue('category', cat.value)}
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
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 900 }}>{cat.code}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Precio (PEN) *" error={errors.price?.message}>
              <div style={{ position: 'relative' }}>
                <span style={currencyStyle}>S/</span>
                <input type="number" step="0.01" {...register('price')} className="input-dark" style={{ width: '100%', paddingLeft: '36px' }} />
              </div>
            </Field>

            <Field label="Duracion (dias) *" error={errors.duration_days?.message}>
              <input type="number" {...register('duration_days')} className="input-dark" style={{ width: '100%' }} />
            </Field>
          </div>

          <Field label="Descripcion del producto" error={errors.description?.message}>
            <textarea
              {...register('description')}
              placeholder="Escribe una breve descripcion del producto o servicio..."
              className="input-dark"
              style={{
                width: '100%',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            />
          </Field>

          <Field label="Caracteristicas (una por linea)">
            <textarea
              {...register('features')}
              placeholder={'Calidad 4K\nCompartido hasta 5\nDescarga offline'}
              className="input-dark"
              style={{
                width: '100%',
                minHeight: '120px',
                resize: 'vertical',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            />
          </Field>

          <div style={statusPanelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {active ? (
                <Eye style={{ width: '20px', height: '20px', color: 'var(--green)' }} />
              ) : (
                <EyeOff style={{ width: '20px', height: '20px', color: 'var(--muted)' }} />
              )}
              <div>
                <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.9rem' }}>Producto activo</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {active ? 'Visible en el catalogo publico' : 'Oculto del catalogo'}
                </div>
              </div>
            </div>
            <label style={{ position: 'relative', width: '48px', height: '26px' }}>
              <input type="checkbox" {...register('active')} style={{ opacity: 0, width: 0, height: 0 }} />
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

function ImageManager({
  imageUrls,
  imageUrlDraft,
  uploadingImages,
  onDraftChange,
  onAddUrl,
  onRemove,
  onUpload,
}: {
  imageUrls: string[]
  imageUrlDraft: string
  uploadingImages: boolean
  onDraftChange: (value: string) => void
  onAddUrl: () => void
  onRemove: (index: number) => void
  onUpload: (files: FileList | null) => void
}) {
  const atLimit = imageUrls.length >= 4

  return (
    <div>
      <label style={labelStyle}>Imagenes del producto</label>
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
          <input
            value={imageUrlDraft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="https://cdn.ejemplo.com/imagen.png"
            className="input-dark"
            style={{ width: '100%' }}
          />
          <button type="button" onClick={onAddUrl} disabled={atLimit} style={secondaryButtonStyle(atLimit)}>
            <Plus style={{ width: 16, height: 16 }} />
            URL
          </button>
        </div>

        <label style={uploadBoxStyle(atLimit || uploadingImages)}>
          {uploadingImages ? <Loader2 className="animate-spin" /> : <Upload style={{ width: 17, height: 17 }} />}
          {uploadingImages ? 'Subiendo imagenes...' : 'Cargar desde la computadora'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={atLimit || uploadingImages}
            onChange={(event) => onUpload(event.target.files)}
            style={{ display: 'none' }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
          {Array.from({ length: 4 }).map((_, index) => {
            const url = imageUrls[index]
            return (
              <div key={index} style={imageSlotStyle}>
                {url ? (
                  <>
                    <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" style={imagePreviewStyle} />
                    <button type="button" onClick={() => onRemove(index)} aria-label="Quitar imagen" style={removeImageButtonStyle}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </>
                ) : (
                  <ImageIcon style={{ width: '24px', height: '24px', color: 'var(--muted)' }} />
                )}
              </div>
            )
          })}
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: 0 }}>
          Puedes combinar URLs e imagenes cargadas. Maximo 4 imagenes JPG, PNG o WEBP de hasta 2 MB cada una.
        </p>
      </div>
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
    minHeight: '44px',
    border: '1px dashed var(--border2)',
    borderRadius: '10px',
    background: 'var(--bg3)',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
  }
}

function submitStyle(loading: boolean) {
  return {
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
    opacity: loading ? 0.7 : 1,
  }
}
