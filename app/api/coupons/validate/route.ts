import { requireAuth } from '@/lib/auth'
import { validateCouponForProduct } from '@/lib/coupons'
import { createServiceClient } from '@/lib/supabase/server'
import { applyDiscount, formatPEN } from '@/lib/utils'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  productId: z.string().uuid(),
  code: z.string().trim().min(1).max(64),
})

export async function POST(req: Request) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const supabase = createServiceClient()
  const { data: product } = await supabase
    .from('products')
    .select('id, price, category, active')
    .eq('id', body.data.productId)
    .single()

  if (!product?.active) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const coupon = await validateCouponForProduct({
    code: body.data.code,
    userId: user.id,
    productId: product.id,
    category: product.category,
  })

  if (!coupon.ok) {
    return NextResponse.json({ error: coupon.error || 'Cupon no valido' }, { status: 400 })
  }

  const originalAmount = Number(product.price)
  const amount = applyDiscount(originalAmount, coupon.pct ?? 0)

  return NextResponse.json({
    coupon: {
      id: coupon.couponId,
      label: coupon.label,
      pct: coupon.pct,
      originalAmount,
      amount,
      amountLabel: formatPEN(amount),
    },
  })
}
