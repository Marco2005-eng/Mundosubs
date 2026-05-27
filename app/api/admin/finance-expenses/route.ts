import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

const expenseSchema = z.object({
  label: z.string().min(2, 'Ingresa una descripcion'),
  category: z.enum(['service_purchase', 'operations', 'marketing', 'refund', 'other']),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  occurred_at: z.string().min(1),
  vendor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const deleteSchema = z.object({
  id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = expenseSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('finance_expenses').insert({
    ...parsed.data,
    vendor: parsed.data.vendor || null,
    notes: parsed.data.notes || null,
    created_by: admin.id,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = deleteSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('finance_expenses')
    .delete()
    .eq('id', parsed.data.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
