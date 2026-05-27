import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

async function getUserId(): Promise<string | null> {
  const user = await requireAuth().catch(() => null)
  return user?.id ?? null
}

export async function GET() {
  const userId = await getUserId()
  
  if (!userId) {
    return NextResponse.json({ items: [] })
  }

  const supabase = createClient()

  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      discount_pct,
      product_id,
      products(
        id,
        name,
        category,
        price,
        duration_days,
        features,
        active
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: cartItems || [] })
}

export async function POST(request: Request) {
  const userId = await getUserId()
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const supabase = createClient()
  const { productId, discountPct = 0, discountId = null } = await request.json()

  // Check if item already in cart
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()

  if (existing) {
    // Update quantity
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + 1, updated_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    // Insert new item
    const { error } = await supabase
      .from('cart_items')
      .insert({
        user_id: userId,
        product_id: productId,
        quantity: 1,
        discount_pct: discountPct,
        discount_id: discountId
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

export async function PUT(request: Request) {
  const userId = await getUserId()
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const supabase = createClient()
  const { itemId, quantity } = await request.json()

  if (quantity <= 0) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const userId = await getUserId()
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')

  if (itemId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    // Clear all cart items
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
