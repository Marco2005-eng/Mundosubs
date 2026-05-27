import { createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { CheckoutPaymentFlow } from '@/components/CheckoutPaymentFlow'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatPEN } from '@/lib/utils'
import { getPaymentMethods } from '@/lib/payment-methods'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { buildOrderWhatsAppLink } from '@/lib/whatsapp'

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const user = await getSession()
  if (!user) redirect('/auth/login')
  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, products(name, duration_days)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()
  if (order.status !== 'pending') redirect('/dashboard')
  const paymentMethods = await getPaymentMethods({ enabledOnly: true })

  return (
    <div className="checkout-page container max-w-lg py-12">
      <Link
        href="/"
        className="checkout-back-link mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a la tienda
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Subir comprobante de pago</CardTitle>
          <CardDescription>
            Pedido #{order.id.slice(0, 8)} · {(order as any).products?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md bg-muted p-4 text-sm space-y-1">
            <p>
              <span className="font-medium">Total a pagar:</span>{' '}
              <span className="text-primary font-bold">{formatPEN(order.amount)}</span>
            </p>
            {order.discount_pct > 0 && (
              <p className="text-green-600">Incluye {order.discount_pct}% de descuento</p>
            )}
            <p className="text-muted-foreground text-xs">
              Realiza la transferencia y sube el comprobante a continuacion.
            </p>
          </div>

          <CheckoutPaymentFlow
            methods={paymentMethods}
            totalLabel={formatPEN(order.amount)}
            orderId={orderId}
            userId={user.id}
            initialDiscountPct={Number(order.discount_pct ?? 0)}
          />

          <p className="text-xs text-center text-muted-foreground">
            Tienes dudas?{' '}
            <a
              href={buildOrderWhatsAppLink(orderId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Contactanos por WhatsApp
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
