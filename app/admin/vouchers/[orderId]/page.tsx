import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { getSignedVoucherUrl } from '@/lib/storage'
import { VoucherReview } from '@/components/VoucherReview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatPEN } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

function getVoucher(order: any) {
  if (Array.isArray(order.vouchers)) return order.vouchers[0] ?? null
  return order.vouchers ?? null
}

export default async function VoucherDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const admin = await requireAdmin().catch(() => null)
  if (!admin) notFound()

  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, amount, original_amount, discount_pct, status, created_at,
      products(name, duration_days),
      vouchers(file_url, bank, operation_number, uploaded_at),
      user_id
    `)
    .eq('id', orderId)
    .single()

  if (!order || order.status !== 'pending') notFound()

  const voucher = getVoucher(order)
  const signedUrl = voucher?.file_url ? await getSignedVoucherUrl(voucher.file_url) : null
  const isImage = signedUrl && !voucher.file_url.endsWith('.pdf')

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/vouchers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Revisar comprobante</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Detalle del pedido</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">ID:</span> {order.id}</p>
            <p><span className="font-medium">Producto:</span> {(order as any).products?.name}</p>
            <p><span className="font-medium">Monto:</span> {formatPEN(order.amount)}</p>
            {order.discount_pct > 0 && (
              <p className="text-green-600">Descuento aplicado: {order.discount_pct}%</p>
            )}
            {voucher && (
              <>
                <p><span className="font-medium">Banco:</span> {voucher.bank}</p>
                <p><span className="font-medium">N° Operación:</span> {voucher.operation_number}</p>
              </>
            )}
          </CardContent>
        </Card>

        {signedUrl && (
          <Card>
            <CardHeader><CardTitle>Comprobante</CardTitle></CardHeader>
            <CardContent>
              {isImage ? (
                <Image
                  src={signedUrl}
                  alt="Comprobante"
                  width={600}
                  height={400}
                  className="rounded-md object-contain w-full"
                />
              ) : (
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Ver PDF del comprobante
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {voucher && !signedUrl && (
          <Card>
            <CardHeader><CardTitle>Comprobante</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              El comprobante existe, pero no se pudo generar la URL firmada. Verifica que el bucket
              privado <span className="font-medium">vouchers</span> exista y que el archivo siga en Storage.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Acción</CardTitle></CardHeader>
          <CardContent>
            <VoucherReview orderId={orderId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
