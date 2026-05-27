import { createServiceClient } from '@/lib/supabase/server'

export interface CouponValidationResult {
  ok: boolean
  error?: string
  couponId?: string
  discountId?: string
  label?: string
  pct?: number
}

export async function validateCouponForProduct(input: {
  code?: string | null
  userId: string
  productId: string
  category: string
}): Promise<CouponValidationResult> {
  const code = input.code?.trim().toUpperCase()
  if (!code) return { ok: false, error: 'Codigo requerido' }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select(`
      id,
      code,
      status,
      user_id,
      max_redemptions,
      redeemed_count,
      starts_at,
      expires_at,
      discount_id,
      discounts(id, label, pct, active, product_id, category, type)
    `)
    .eq('code', code)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!coupon) return { ok: false, error: 'Cupon no encontrado' }
  if (coupon.status !== 'active') return { ok: false, error: 'Cupon no activo' }
  if (coupon.user_id && coupon.user_id !== input.userId) {
    return { ok: false, error: 'Este cupon pertenece a otro usuario' }
  }
  if (coupon.starts_at && coupon.starts_at > now) return { ok: false, error: 'Cupon aun no disponible' }
  if (coupon.expires_at && coupon.expires_at <= now) return { ok: false, error: 'Cupon vencido' }

  const discount = Array.isArray((coupon as any).discounts)
    ? (coupon as any).discounts[0]
    : (coupon as any).discounts

  if (!discount?.active) return { ok: false, error: 'Descuento del cupon inactivo' }
  if (discount.product_id && discount.product_id !== input.productId) {
    return { ok: false, error: 'Este cupon no aplica a este producto' }
  }
  if (discount.category && discount.category !== input.category) {
    return { ok: false, error: 'Este cupon no aplica a esta categoria' }
  }

  const [{ count: pendingOrApproved }, { count: usedByUser }] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .in('status', ['pending', 'approved']),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', input.userId)
      .in('status', ['pending', 'approved']),
  ])

  const reservedCount = Math.max(Number(coupon.redeemed_count ?? 0), pendingOrApproved ?? 0)
  if (reservedCount >= Number(coupon.max_redemptions ?? 1)) {
    return { ok: false, error: 'Cupon agotado' }
  }
  if ((usedByUser ?? 0) > 0) {
    return { ok: false, error: 'Ya usaste este cupon' }
  }

  return {
    ok: true,
    couponId: coupon.id,
    discountId: discount.id,
    label: discount.label,
    pct: Number(discount.pct),
  }
}
