'use client'

import { useState } from 'react'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Camera, FileText, ImagePlus, Upload, Loader2 } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  operationNumber: z.string().min(1, 'Requerido'),
})

type FormData = z.infer<typeof schema>

interface VoucherUploadProps {
  orderId: string
  userId: string
  paymentMethodLabel: string
}

export function VoucherUpload({ orderId, paymentMethodLabel }: VoucherUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const pdfInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    if (!file) {
      toast({ variant: 'destructive', title: 'Selecciona el comprobante' })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('operationNumber', data.operationNumber)
      formData.append('bank', paymentMethodLabel)
      formData.append('file', file)

      const res = await fetch('/api/vouchers', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const result = await res.json().catch(() => null)
        throw new Error(result?.error || 'Error al enviar comprobante')
      }

      toast({ title: 'Comprobante enviado' })
      router.push('/dashboard')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error al subir comprobante',
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div
        className="rounded-md px-3 py-2 text-sm"
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          color: 'var(--muted)',
        }}
      >
        Metodo seleccionado:{' '}
        <strong style={{ color: 'var(--text)' }}>{paymentMethodLabel}</strong>
      </div>

      <div className="space-y-1">
        <Label>Numero de operacion</Label>
        <Input placeholder="Ej: 123456789, codigo Yape o Plin" {...register('operationNumber')} />
        {errors.operationNumber && (
          <p className="text-xs text-destructive">{errors.operationNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Comprobante de pago</Label>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold"
            style={{
              borderColor: 'var(--border2)',
              background: 'var(--bg3)',
              color: 'var(--text)',
            }}
          >
            <ImagePlus className="h-4 w-4" />
            Elegir de galeria
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold"
            style={{
              borderColor: 'var(--border2)',
              background: 'var(--bg3)',
              color: 'var(--text)',
            }}
          >
            <Camera className="h-4 w-4" />
            Tomar foto
          </button>
        </div>

        <button
          type="button"
          onClick={() => pdfInputRef.current?.click()}
          className="inline-flex items-center gap-2 text-xs font-semibold"
          style={{ color: 'var(--muted)' }}
        >
          <FileText className="h-3.5 w-3.5" />
          Subir PDF en su lugar
        </button>

        {file && (
          <div
            className="rounded-md px-3 py-2 text-xs"
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border2)',
              color: 'var(--muted)',
            }}
          >
            Archivo seleccionado:{' '}
            <strong style={{ color: 'var(--text)' }}>{file.name}</strong>
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/#catalog"
          className="inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
          style={{
            borderColor: 'var(--border2)',
            background: 'var(--bg3)',
            color: 'var(--text)',
            textDecoration: 'none',
          }}
        >
          Volver al catalogo
        </Link>
        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Enviar comprobante
        </Button>
      </div>
    </form>
  )
}
