import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendOrderApprovedEmail, sendOrderRejectedEmail } from '@/lib/email'
import { requireAdmin } from '@/lib/auth'

const schema = z.object({
  orderId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  note: z.string().optional(),
  access: z.object({
    loginUrl: z.string().optional(),
    accountEmail: z.string().optional(),
    accountPassword: z.string().optional(),
    profileName: z.string().optional(),
    profilePin: z.string().optional(),
    loginCode: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
})

export async function POST(req: NextRequest) {
  try {
    let adminUser
    try {
      adminUser = await requireAdmin()
    } catch (e: any) {
      console.error('Auth error:', e?.message || e)
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = schema.safeParse(await req.json())
    if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

    const { orderId, action, note, access } = body.data
    
    // Create service client without cookies for API routes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serviceSupabase = createSupabaseClient(supabaseUrl, supabaseKey)

    console.log('Review request:', { orderId, action, adminUserId: adminUser?.id })

    const { data: order, error: orderError } = await serviceSupabase
      .from('orders')
      .select('*, products(name, duration_days), user_id, discount_id, coupon_id')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const now = new Date().toISOString()

    if (action === 'approve') {
      const { error: updateError } = await serviceSupabase
        .from('orders')
        .update({ status: 'approved', reviewed_at: now, admin_note: note ?? null })
        .eq('id', orderId)

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

      const durationDays = (order as any).products?.duration_days ?? 30
      const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString()

      const { data: subscription, error: subscriptionError } = await serviceSupabase.from('subscriptions').insert({
        user_id: order.user_id,
        product_id: order.product_id,
        order_id: orderId,
        starts_at: now,
        expires_at: expiresAt,
      }).select('id').single()

      if (subscriptionError) {
        return NextResponse.json({ error: subscriptionError.message }, { status: 500 })
      }

      if (access && Object.values(access).some(Boolean)) {
        const { error: accessError } = await serviceSupabase
          .from('subscription_access')
          .upsert({
            user_id: order.user_id,
            order_id: orderId,
            subscription_id: subscription?.id ?? null,
            product_id: order.product_id,
            login_url: access.loginUrl || null,
            account_email: access.accountEmail || null,
            account_password: access.accountPassword || null,
            profile_name: access.profileName || null,
            profile_pin: access.profilePin || null,
            login_code: access.loginCode || null,
            notes: access.notes || null,
            updated_at: now,
          }, { onConflict: 'order_id' })

        if (accessError) return NextResponse.json({ error: accessError.message }, { status: 500 })
      }

      if (order.discount_id) {
        await serviceSupabase
          .from('user_discounts')
          .update({ used_at: now })
          .eq('discount_id', order.discount_id)
          .eq('user_id', order.user_id)
          .is('used_at', null)
      }

      if (order.coupon_id) {
        await serviceSupabase
          .from('coupon_redemptions')
          .insert({
            coupon_id: order.coupon_id,
            order_id: orderId,
            user_id: order.user_id,
          })
          .then(({ error }) => {
            if (error) console.error('Coupon redemption error:', error)
          })

        const { data: couponRow } = await serviceSupabase
          .from('coupons')
          .select('redeemed_count')
          .eq('id', order.coupon_id)
          .single()

        await serviceSupabase
          .from('coupons')
          .update({ redeemed_count: Number(couponRow?.redeemed_count ?? 0) + 1 })
          .eq('id', order.coupon_id)
          .then(({ error }) => {
            if (error) console.error('Coupon count update error:', error)
          })
      }

      const { data: targetUser } = await serviceSupabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', order.user_id)
        .single()
      
      if (targetUser?.email) {
        await sendOrderApprovedEmail({
          to: targetUser.email,
          userName: targetUser.full_name ?? 'Cliente',
          productName: (order as any).products?.name ?? 'producto',
          expiresAt: new Date(expiresAt).toLocaleDateString('es-PE'),
          orderId,
        }).catch((err) => console.error('Email error:', err))
      }
    } else {
      const { error: updateError } = await serviceSupabase
        .from('orders')
        .update({ status: 'rejected', reviewed_at: now, admin_note: note ?? null })
        .eq('id', orderId)

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

      const { data: targetUser } = await serviceSupabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', order.user_id)
        .single()

      if (targetUser?.email) {
        await sendOrderRejectedEmail({
          to: targetUser.email,
          userName: targetUser.full_name ?? 'Cliente',
          productName: (order as any).products?.name ?? 'producto',
          adminNote: note,
          orderId,
        }).catch((err) => console.error('Email error:', err))
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Unexpected error in review:', error)
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
