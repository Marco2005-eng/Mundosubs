import { requireAuth } from '@/lib/auth'
import { validateCouponForProduct } from '@/lib/coupons'
import { createServiceClient } from '@/lib/supabase/server'
import { applyDiscount, formatPEN } from '@/lib/utils'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  code: z.string().trim().min(1).max(64),
})

export async function POST(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const supabase = createServiceClient()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, product_id, original_amount, status, products(id, category)')
    .eq('id', params.orderId)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  if (order.status !== 'pending') return NextResponse.json({ error: 'El pedido ya no se puede modificar' }, { status: 400 })

  const product = Array.isArray((order as any).products) ? (order as any).products[0] : (order as any).products
  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const coupon = await validateCouponForProduct({
    code: body.data.code,
    userId: user.id,
    productId: order.product_id,
    category: product.category,
  })

  if (!coupon.ok) {
    return NextResponse.json({ error: coupon.error || 'Cupon no valido' }, { status: 400 })
  }

  const originalAmount = Number(order.original_amount)
  const amount = applyDiscount(originalAmount, coupon.pct ?? 0)

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      amount,
      discount_pct: coupon.pct ?? 0,
      discount_id: coupon.discountId ?? null,
      coupon_id: coupon.couponId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    coupon: {
      code: body.data.code.toUpperCase(),
      label: coupon.label,
      pct: coupon.pct,
    },
    order: {
      amount,
      amountLabel: formatPEN(amount),
      discountPct: coupon.pct ?? 0,
    },
  })
}
