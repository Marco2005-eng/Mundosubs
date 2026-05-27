import { createServiceClient } from '@/lib/supabase/server'

export type PaymentMethodId = 'bank_transfer' | 'yape' | 'plin'

export interface PaymentMethod {
  id: PaymentMethodId
  label?: string | null
  title: string
  description: string | null
  enabled: boolean
  holder_name?: string | null
  holder: string | null
  phone: string | null
  bank_name: string | null
  account_number: string | null
  cci: string | null
  instructions: string | null
  qr_path: string | null
  qr_url_path?: string | null
  qr_url?: string | null
  qr_error?: string | null
  sort_order: number
}

const QR_BUCKET = 'payment-qrs'
const QR_EXTENSIONS = ['jpeg', 'jpg', 'png', 'webp']

export async function createSignedPaymentQrUrl(
  methodId: PaymentMethodId,
  storedPath?: string | null
) {
  const supabase = createServiceClient()
  const candidates = [
    storedPath,
    ...QR_EXTENSIONS.map((ext) => paymentQrPath(methodId, ext)),
  ].filter((path): path is string => Boolean(path))

  let lastError: string | null = null

  for (const path of Array.from(new Set(candidates))) {
    const { data, error } = await supabase.storage
      .from(QR_BUCKET)
      .createSignedUrl(path, 3600)

    if (data?.signedUrl) {
      return { path, signedUrl: data.signedUrl, error: null }
    }

    lastError = error?.message ?? lastError
  }

  const { data: files, error: listError } = await supabase.storage
    .from(QR_BUCKET)
    .list(methodId, {
      limit: 20,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (listError) {
    return { path: storedPath ?? null, signedUrl: null, error: listError.message }
  }

  const qrFile = files?.find((file) => /^qr\.(jpe?g|png|webp)$/i.test(file.name))
    ?? files?.find((file) => /\.(jpe?g|png|webp)$/i.test(file.name))

  if (qrFile) {
    const path = `${methodId}/${qrFile.name}`
    const { data, error } = await supabase.storage
      .from(QR_BUCKET)
      .createSignedUrl(path, 3600)

    if (data?.signedUrl) {
      return { path, signedUrl: data.signedUrl, error: null }
    }

    return { path, signedUrl: null, error: error?.message ?? null }
  }

  return { path: storedPath ?? null, signedUrl: null, error: lastError ?? 'Object not found' }
}

export async function getPaymentMethods(options: { enabledOnly?: boolean } = {}) {
  const supabase = createServiceClient()
  let query = supabase
    .from('payment_methods')
    .select('*')
    .order('sort_order', { ascending: true })

  if (options.enabledOnly) query = query.eq('enabled', true)

  const { data, error } = await query
  if (error || !data) return []

  return Promise.all(
    (data as PaymentMethod[]).map(async (method) => {
      const normalizedMethod = normalizePaymentMethod(method)
      const signed = await createSignedPaymentQrUrl(
        normalizedMethod.id,
        normalizedMethod.qr_path ?? normalizedMethod.qr_url_path ?? null
      )

      return {
        ...normalizedMethod,
        qr_path: signed.path,
        qr_url: signed.signedUrl,
        qr_error: signed.error,
      }
    })
  )
}

export function normalizePaymentMethod(method: PaymentMethod): PaymentMethod {
  const labels: Record<PaymentMethodId, { title: string; description: string }> = {
    bank_transfer: {
      title: 'Transferencia bancaria',
      description: 'Cuenta bancaria o CCI para pagos manuales.',
    },
    yape: {
      title: 'Yape',
      description: 'Numero y QR para pagos desde Yape.',
    },
    plin: {
      title: 'Plin',
      description: 'Numero y QR para pagos desde Plin.',
    },
  }

  const meta = labels[method.id]
  return {
    ...method,
    title: method.title && method.title !== method.id ? method.title : meta.title,
    label: method.label && method.label !== method.id ? method.label : meta.title,
    description: method.description ?? meta.description,
    holder: method.holder ?? method.holder_name ?? null,
  }
}

export function paymentQrPath(methodId: PaymentMethodId, ext: string) {
  return `${methodId}/qr.${ext}`
}

export const paymentQrBucket = QR_BUCKET
