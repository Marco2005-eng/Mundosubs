'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  Camera, FileText, ImagePlus, Loader2,
  CheckCircle, X, ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const schema = z.object({
  operationNumber: z.string().min(1, 'Ingresa el número de operación'),
})
type FormData = z.infer<typeof schema>

interface VoucherUploadProps {
  orderId: string
  userId: string
  paymentMethodLabel: string
  existingVoucher: {
    bank: string | null
    operationNumber: string | null
    uploadedAt: string | null
  } | null
}

export function VoucherUpload({ orderId, paymentMethodLabel, existingVoucher }: VoucherUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef  = useRef<HTMLInputElement>(null)
  const pdfRef     = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function handleFile(selected: File | null) {
    setFileError(null)
    if (!selected) {
      setFile(null)
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      const mb = (selected.size / (1024 * 1024)).toFixed(1)
      setFileError(`El archivo pesa ${mb} MB. El máximo permitido es 5 MB.`)
      setFile(null)
      return
    }
    setFile(selected)
  }

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function onSubmit(data: FormData) {
    if (!file) {
      toast({ variant: 'destructive', title: 'Falta el comprobante', description: 'Adjunta una foto o captura del pago.' })
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      form.append('orderId', orderId)
      form.append('operationNumber', data.operationNumber)
      form.append('bank', paymentMethodLabel)
      form.append('file', file)

      const res = await fetch('/api/vouchers', { method: 'POST', body: form })
      if (!res.ok) {
        const r = await res.json().catch(() => null)
        throw new Error(r?.error || 'Error al enviar')
      }
      toast({ title: '¡Comprobante enviado!', description: 'Verificaremos tu pago en breve.' })
      router.push('/dashboard')
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 14 }}>

      {/* ── Op. number ── */}
      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)' }}>
          Número de operación
        </label>
        <input
          {...register('operationNumber')}
          placeholder="Ej: 123456789"
          style={{
            height: 42, borderRadius: 9, padding: '0 14px',
            background: 'var(--bg2)',
            border: `1px solid ${errors.operationNumber ? '#ef4444' : 'var(--border2)'}`,
            color: 'var(--text)', fontSize: '0.9rem',
          }}
        />
        {errors.operationNumber && (
          <p style={{ margin: 0, color: '#ef4444', fontSize: '0.76rem' }}>
            {errors.operationNumber.message}
          </p>
        )}
        <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--muted)' }}>
          Lo encuentras en la captura o constancia de tu app bancaria.
        </p>
      </div>

      {/* ── Existing voucher indicator ── */}
      {existingVoucher && !file && (
        <div style={{
          borderRadius: 10, padding: '12px 14px',
          background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
          display: 'grid', gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CheckCircle style={{ width: 15, height: 15, color: '#3b82f6', flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
              Ya enviaste un comprobante
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            {existingVoucher.bank && <>Banco: {existingVoucher.bank}</>}
            {existingVoucher.bank && existingVoucher.operationNumber && ' · '}
            {existingVoucher.operationNumber && <>Operación: {existingVoucher.operationNumber}</>}
            {existingVoucher.uploadedAt && (
              <> — {new Date(existingVoucher.uploadedAt).toLocaleDateString('es-PE')}</>
            )}
          </p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted)' }}>
            Si subes uno nuevo, reemplazará el anterior.
          </p>
        </div>
      )}

      {/* ── File picker ── */}
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)' }}>
          Captura o foto del comprobante
        </label>

        {/* Hidden inputs */}
        <input ref={galleryRef} type="file" accept="image/*"                      className="sr-only" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        <input ref={pdfRef}     type="file" accept="application/pdf"               className="sr-only" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />

        {fileError && (
          <p style={{ margin: 0, color: '#ef4444', fontSize: '0.78rem', padding: '8px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: 6 }}>
            {fileError}
          </p>
        )}

        {!file ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <PickBtn icon={<ImagePlus style={{ width: 16, height: 16 }} />} label="Desde galería" onClick={() => galleryRef.current?.click()} />
              <PickBtn icon={<Camera    style={{ width: 16, height: 16 }} />} label="Tomar foto"     onClick={() => cameraRef.current?.click()}  />
            </div>
            <button
              type="button"
              onClick={() => pdfRef.current?.click()}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600,
              }}
            >
              <FileText style={{ width: 13, height: 13 }} />
              Adjuntar PDF en su lugar
            </button>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted)' }}>
              Formatos: JPG, PNG, WEBP o PDF. Máximo 5 MB.
            </p>
          </div>
        ) : (
          <div style={{
            borderRadius: 10, padding: 12,
            background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
            display: 'grid', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <CheckCircle style={{ width: 16, height: 16, color: 'var(--green)', flexShrink: 0 }} />
                <span style={{
                  fontSize: '0.84rem', fontWeight: 700, color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {file.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, display: 'flex' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {preview && (
              <div style={{
                borderRadius: 8, overflow: 'hidden',
                background: '#000', border: '1px solid var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: 200,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Vista previa" style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain' }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10, marginTop: 4 }}>
        <Link
          href="/"
          style={{
            height: 44, padding: '0 16px', borderRadius: 9,
            border: '1px solid var(--border2)', background: 'var(--bg2)',
            color: 'var(--muted)', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}
        >
          Cancelar
        </Link>
        <Button
          type="submit"
          disabled={loading}
          style={{
            height: 44, borderRadius: 9,
            background: 'var(--green)', border: 'none', color: '#fff',
            fontWeight: 800, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading
            ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Enviando…</>
            : <><ShieldCheck style={{ width: 16, height: 16 }} /> Enviar comprobante</>}
        </Button>
      </div>
    </form>
  )
}

/* ── File-pick button ── */
function PickBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 42, borderRadius: 9, cursor: 'pointer',
        border: '1px dashed var(--border2)', background: 'var(--bg2)',
        color: 'var(--text)', fontSize: '0.84rem', fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      }}
    >
      {icon} {label}
    </button>
  )
}
