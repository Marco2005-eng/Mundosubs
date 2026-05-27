'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPEN } from '@/lib/utils'

interface OrderRow {
  id: string
  created_at: string
  product_name: string
  category: string
  original_amount: number
  discount_pct: number
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  expires_at?: string | null
}

interface PurchaseHistoryProps {
  orders: OrderRow[]
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  approved: { label: 'Aprobado', variant: 'default' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
}

export function PurchaseHistory({ orders }: PurchaseHistoryProps) {
  if (!orders.length) {
    return <p className="text-center text-sm text-muted-foreground py-8">No hay compras aun.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Precio base</TableHead>
          <TableHead>Descuento</TableHead>
          <TableHead>Total pagado</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Vencimiento</TableHead>
          <TableHead>Accion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const s = STATUS_LABELS[order.status]
          return (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.product_name}</TableCell>
              <TableCell>{order.category}</TableCell>
              <TableCell>{formatPEN(order.original_amount)}</TableCell>
              <TableCell>
                {order.discount_pct > 0 ? (
                  <span className="text-green-600">-{order.discount_pct}%</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="font-semibold">{formatPEN(order.amount)}</TableCell>
              <TableCell>
                <Badge variant={s.variant}>{s.label}</Badge>
              </TableCell>
              <TableCell>
                {order.expires_at
                  ? new Date(order.expires_at).toLocaleDateString('es-PE')
                  : '-'}
              </TableCell>
              <TableCell>
                {order.status === 'pending' ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/checkout/${order.id}`}>
                      Subir comprobante
                    </Link>
                  </Button>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
