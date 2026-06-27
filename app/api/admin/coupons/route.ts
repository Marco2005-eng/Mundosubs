import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  code: z.string().trim().min(3).max(64),
  label: z.string().trim().min(1),
  pct: z.number().positive().max(100),
  maxRedemptions: z.number().int().positive().default(1),
  startsAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  publishAnnouncement: z.boolean().default(false),
})

export async function POST(req: Request) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const data = body.data
  const supabase = createServiceClient()
  const code = data.code.toUpperCase()

  const { data: discount, error: discountError } = await supabase
    .from('discounts')
    .insert({
      label: data.label,
      type: 'coupon',
      pct: data.pct,
      active: true,
      starts_at: data.startsAt ?? null,
      expires_at: data.expiresAt ?? null,
    })
    .select('id')
    .single()

  if (discountError) return NextResponse.json({ error: discountError.message }, { status: 500 })

  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .insert({
      discount_id: discount.id,
      code,
      status: 'active',
      max_redemptions: data.maxRedemptions,
      starts_at: data.startsAt ?? null,
      expires_at: data.expiresAt ?? null,
    })
    .select('id')
    .single()

  if (couponError) return NextResponse.json({ error: couponError.message }, { status: 500 })

  if (data.publishAnnouncement) {
    await supabase
      .from('announcements')
      .insert({
        title: `${code}: ${data.pct}% de descuento`,
        body: `Usa el código ${code} antes de pagar. Disponible hasta agotar ${data.maxRedemptions} canje${data.maxRedemptions === 1 ? '' : 's'}.`,
        type: 'promo',
        coupon_id: coupon.id,
        active: true,
        starts_at: data.startsAt ?? null,
        expires_at: data.expiresAt ?? null,
      })
      .then(({ error }) => {
        if (error) console.warn('Announcement creation skipped:', error.message)
      })
  }

  return NextResponse.json({ id: coupon.id })
}
