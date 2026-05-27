import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { sendDiscountAssignedEmail } from '@/lib/email'
import { requireAdmin } from '@/lib/auth'

const schema = z.object({
  discountId: z.string().uuid(),
  expiresAt: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  notifyUser: z.boolean().default(false),
})

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const adminUser = await requireAdmin().catch(() => null)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { discountId, expiresAt, note, notifyUser } = body.data
  const serviceSupabase = createServiceClient()

  const { error } = await serviceSupabase.from('user_discounts').insert({
    user_id: params.userId,
    discount_id: discountId,
    assigned_by: adminUser.id,
    expires_at: expiresAt ?? null,
    note: note ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (notifyUser) {
    const [{ data: targetUser }, { data: discount }] = await Promise.all([
      serviceSupabase.from('profiles').select('email, full_name').eq('id', params.userId).single(),
      serviceSupabase.from('discounts').select('pct').eq('id', discountId).single(),
    ])
    if (targetUser && discount) {
      await sendDiscountAssignedEmail({
        to: targetUser.email,
        userName: targetUser.full_name ?? 'Cliente',
        discountPct: discount.pct,
        expiresAt: expiresAt
          ? new Date(expiresAt).toLocaleDateString('es-PE')
          : undefined,
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
