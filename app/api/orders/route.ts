import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { applyDiscount } from '@/lib/utils'
import { getBestDiscount, getEligibleDiscounts } from '@/lib/discounts'

const schema = z.object({
  productId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth().catch(() => null)

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { productId } = body.data
  const serviceSupabase = createServiceClient()

  const { data: product } = await serviceSupabase
    .from('products')
    .select('id, price, active, category')
    .eq('id', productId)
    .single()

  if (!product?.active) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const eligibleDiscounts = await getEligibleDiscounts(user.id)
  const automaticDiscount = getBestDiscount(eligibleDiscounts, product.id, product.category)
  const automaticPct = automaticDiscount?.pct ?? 0
  const selectedDiscount = {
    pct: automaticPct,
    discountId: automaticDiscount?.id ?? null,
  }

  const originalAmount = parseFloat(String(product.price))
  const amount = applyDiscount(originalAmount, selectedDiscount.pct)

  const { data: order, error } = await serviceSupabase
    .from('orders')
    .insert({
      user_id: user.id,
      product_id: productId,
      amount,
      original_amount: originalAmount,
      discount_pct: selectedDiscount.pct,
      discount_id: selectedDiscount.discountId,
      coupon_id: null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orderId: order.id })
}
