import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  category: z.enum(['streaming', 'game', 'license', 'software', 'music']),
  price: z.number().positive(),
  duration_days: z.number().int().positive(),
  features: z.array(z.string()),
  image_url: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().url().nullable().optional()
  ),
  image_urls: z.array(z.string().url()).max(4).optional().default([]),
  active: z.boolean(),
  description: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  if (!(await requireAdmin().catch(() => null))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const serviceSupabase = createServiceClient()
  const { id, ...data } = body.data
  const imageUrls = data.image_urls.slice(0, 4)
  const { data: product, error } = await serviceSupabase
    .from('products')
    .insert({
      ...data,
      image_urls: imageUrls,
      image_url: data.image_url ?? imageUrls[0] ?? null,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: product.id })
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin().catch(() => null))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const serviceSupabase = createServiceClient()
  const { data: product, error } = await serviceSupabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ product })
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin().catch(() => null))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
  if (!body.data.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const serviceSupabase = createServiceClient()
  const { id, ...data } = body.data
  const imageUrls = data.image_urls.slice(0, 4)
  const { error } = await serviceSupabase
    .from('products')
    .update({
      ...data,
      image_urls: imageUrls,
      image_url: data.image_url ?? imageUrls[0] ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin().catch(() => null))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const serviceSupabase = createServiceClient()
  const { error } = await serviceSupabase
    .from('products')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
