import { createClient } from '@/lib/supabase/server'

export interface ResolvedDiscount {
  id: string
  label: string
  pct: number
  type: 'loyalty' | 'manual'
  productId: string | null
  category: string | null
  userDiscountId?: string
}

export async function getEligibleDiscounts(userId: string): Promise<ResolvedDiscount[]> {
  const supabase = createClient()

  const [
    { count: approvedCount },
    { data: manualRows },
    { data: loyaltyRows },
    { data: usedOrders }
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved'),

    supabase
      .from('user_discounts')
      .select('id, discount_id, discounts(id, label, pct, type, product_id, category)')
      .eq('user_id', userId)
      .is('used_at', null)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString()),

    supabase
      .from('discounts')
      .select('id, label, pct, type, product_id, category, min_purchases')
      .eq('type', 'loyalty')
      .eq('active', true),

    supabase
      .from('orders')
      .select('discount_id')
      .eq('user_id', userId)
      .neq('status', 'rejected')
      .not('discount_id', 'is', null),
  ])

  const usedDiscountIds = new Set<string>()
  for (const o of usedOrders ?? []) {
    if (o.discount_id) {
      usedDiscountIds.add(o.discount_id)
    }
  }

  const results: ResolvedDiscount[] = []

  for (const row of manualRows ?? []) {
    const d = (row as any).discounts
    if (!d) continue
    if (usedDiscountIds.has(d.id)) continue
    results.push({
      id: d.id,
      label: d.label,
      pct: d.pct,
      type: 'manual',
      productId: d.product_id,
      category: d.category,
      userDiscountId: row.id,
    })
  }

  const approved = approvedCount ?? 0
  for (const d of loyaltyRows ?? []) {
    if ((d.min_purchases ?? 0) <= approved) {
      results.push({
        id: d.id,
        label: d.label,
        pct: d.pct,
        type: 'loyalty',
        productId: d.product_id,
        category: d.category,
      })
    }
  }

  return results
}

export function getBestDiscount(
  discounts: ResolvedDiscount[],
  productId: string,
  category: string
): ResolvedDiscount | null {
  const applicable = discounts.filter(
    (d) =>
      (d.productId === null || d.productId === productId) &&
      (d.category === null || d.category === category)
  )
  if (!applicable.length) return null
  return applicable.reduce((best, d) => (d.pct > best.pct ? d : best))
}
