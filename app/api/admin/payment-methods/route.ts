import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import {
  createSignedPaymentQrUrl,
  normalizePaymentMethod,
  paymentQrBucket,
  paymentQrPath,
  type PaymentMethodId,
} from '@/lib/payment-methods'

const methodSchema = z.object({
  id: z.enum(['bank_transfer', 'yape', 'plin']),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  enabled: z.boolean(),
  holder: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  bank_name: z.string().nullable().optional(),
  account_number: z.string().nullable().optional(),
  cci: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  qr_path: z.string().nullable().optional(),
  sort_order: z.number().int(),
})

const methodsSchema = z.array(methodSchema)
const ALLOWED_QR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_QR_SIZE = 2 * 1024 * 1024

function getExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) return fromName
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return null
}

export async function GET() {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const methods = await Promise.all(
    (data ?? []).map(async (method) => {
      const normalizedMethod = normalizePaymentMethod(method)
      const signed = await createSignedPaymentQrUrl(normalizedMethod.id, normalizedMethod.qr_path)

      return {
        ...normalizedMethod,
        qr_path: signed.path,
        qr_url: signed.signedUrl,
        qr_error: signed.error,
      }
    })
  )

  return NextResponse.json({ methods })
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const rawMethods = formData.get('methods')
  if (typeof rawMethods !== 'string') {
    return NextResponse.json({ error: 'Methods payload required' }, { status: 400 })
  }

  const parsed = methodsSchema.safeParse(JSON.parse(rawMethods))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = createServiceClient()
  const methods = parsed.data

  for (const method of methods) {
    const file = formData.get(`qr_${method.id}`)
    let qrPath = method.qr_path ?? null

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_QR_SIZE) {
        return NextResponse.json({ error: `El QR de ${method.title} supera 2 MB` }, { status: 400 })
      }

      if (!ALLOWED_QR_TYPES.has(file.type)) {
        return NextResponse.json({ error: `El QR de ${method.title} debe ser JPG, PNG o WEBP` }, { status: 400 })
      }

      const ext = getExtension(file)
      if (!ext) return NextResponse.json({ error: 'Extension de QR no permitida' }, { status: 400 })

      qrPath = paymentQrPath(method.id as PaymentMethodId, ext)
      await Promise.all(
        ['jpeg', 'jpg', 'png', 'webp']
          .filter((candidate) => candidate !== ext)
          .map((candidate) =>
            supabase.storage
              .from(paymentQrBucket)
              .remove([paymentQrPath(method.id as PaymentMethodId, candidate)])
          )
      )

      const { error: uploadError } = await supabase.storage
        .from(paymentQrBucket)
        .upload(qrPath, file, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { error } = await supabase
      .from('payment_methods')
      .upsert({
        id: method.id,
        label: method.title,
        title: method.title,
        description: method.description ?? null,
        enabled: method.enabled,
        holder: method.holder ?? null,
        phone: method.phone ?? null,
        bank_name: method.bank_name ?? null,
        account_number: method.account_number ?? null,
        cci: method.cci ?? null,
        instructions: method.instructions ?? null,
        qr_path: qrPath,
        sort_order: method.sort_order,
        updated_at: new Date().toISOString(),
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
