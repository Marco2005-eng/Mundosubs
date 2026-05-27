import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

const schema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
  type: z.enum(['loyalty', 'manual']),
  pct: z.number().positive().max(100),
  min_purchases: z.number().int().min(0).nullable().optional(),
  product_id: z.string().uuid().nullable().optional(),
  category: z.string().nullable().optional(),
  active: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  if (!(await requireAdmin().catch(() => null))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { id, ...data } = body.data
  const serviceSupabase = createServiceClient()
  const { data: discount, error } = await serviceSupabase
    .from('discounts')
    .insert(data)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: discount.id })
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin().catch(() => null))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
  if (!body.data.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { id, ...data } = body.data
  const serviceSupabase = createServiceClient()
  const { error } = await serviceSupabase.from('discounts').update(data).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
