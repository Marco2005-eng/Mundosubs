import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

const BUCKET = 'product-images'
const MAX_IMAGES = 4
const MAX_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function getExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) return fromName
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return null
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const files = formData
    .getAll('files')
    .filter((file): file is File => file instanceof File && file.size > 0)
    .slice(0, MAX_IMAGES)

  if (!files.length) {
    return NextResponse.json({ error: 'Selecciona al menos una imagen' }, { status: 400 })
  }

  const productId = String(formData.get('productId') || 'new')
  const safeProductId = productId.replace(/[^a-zA-Z0-9_-]/g, '')
  const supabase = createServiceClient()
  const urls: string[] = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Cada imagen debe pesar maximo 2 MB' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Usa imagenes JPG, PNG o WEBP' }, { status: 400 })
    }

    const ext = getExtension(file)
    if (!ext) return NextResponse.json({ error: 'Extension de imagen no permitida' }, { status: 400 })

    const path = `${safeProductId || 'new'}/${Date.now()}-${index}-${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    if (data.publicUrl) urls.push(data.publicUrl)
  }

  return NextResponse.json({ urls })
}
