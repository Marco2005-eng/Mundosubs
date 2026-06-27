import { requireAuth } from '@/lib/auth'
import { getBestDiscount, getEligibleDiscounts } from '@/lib/discounts'
import { createServiceClient } from '@/lib/supabase/server'
import { applyDiscount } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: { subscriptionId: string } }
) {
  const user = await requireAuth().catch(() => null)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('id, user_id, product_id, expires_at, products(id, price, active, category)')
    .eq('id', params.subscriptionId)
    .eq('user_id', user.id)
    .single()

  if (subscriptionError || !subscription) {
    return NextResponse.json({ error: 'Suscripcion no encontrada' }, { status: 404 })
  }

  const product = Array.isArray((subscription as any).products)
    ? (subscription as any).products[0]
    : (subscription as any).products

  if (!product?.active) {
    return NextResponse.json({ error: 'Este producto ya no está disponible' }, { status: 400 })
  }

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', user.id)
    .eq('renewed_subscription_id', subscription.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingOrder?.id) {
    return NextResponse.json({ orderId: existingOrder.id, reused: true })
  }

  const eligibleDiscounts = await getEligibleDiscounts(user.id)
  const automaticDiscount = getBestDiscount(eligibleDiscounts, product.id, product.category)
  const originalAmount = Number(product.price)
  const discountPct = automaticDiscount?.pct ?? 0
  const amount = applyDiscount(originalAmount, discountPct)

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      product_id: product.id,
      amount,
      original_amount: originalAmount,
      discount_pct: discountPct,
      discount_id: automaticDiscount?.id ?? null,
      coupon_id: null,
      status: 'pending',
      order_type: 'renewal',
      renewed_subscription_id: subscription.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orderId: order.id })
}
