import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { voucherStoragePath } from '@/lib/storage'

const schema = z.object({
  orderId: z.string().uuid(),
  operationNumber: z.string().min(1),
  bank: z.string().min(1),
})

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

function getExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(fromName)) return fromName

  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'application/pdf') return 'pdf'

  return null
}

export async function POST(req: NextRequest) {
  const user = await requireAuth().catch(() => null)

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const serviceSupabase = createAdminClient()

  const formData = await req.formData()
  const file = formData.get('file')
  const body = schema.safeParse({
    orderId: formData.get('orderId'),
    operationNumber: formData.get('operationNumber'),
    bank: formData.get('bank'),
  })

  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Comprobante requerido' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'El comprobante no debe superar 5 MB' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG, WEBP o PDF' }, { status: 400 })
  }

  const ext = getExtension(file)
  if (!ext) {
    return NextResponse.json({ error: 'Extensión de archivo no permitida' }, { status: 400 })
  }

  const { orderId, operationNumber, bank } = body.data

  const { data: order } = await serviceSupabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order || order.status !== 'pending') {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const fileUrl = voucherStoragePath(user.id, orderId, ext)
  const { error: uploadError } = await serviceSupabase.storage
    .from('vouchers')
    .upload(fileUrl, file, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  await serviceSupabase.from('vouchers').delete().eq('order_id', orderId)

  const { error } = await serviceSupabase.from('vouchers').insert({
    order_id: orderId,
    file_url: fileUrl,
    operation_number: operationNumber,
    bank,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
