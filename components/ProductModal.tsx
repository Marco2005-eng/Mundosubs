'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DiscountBadge } from '@/components/DiscountBadge'
import { formatPEN, applyDiscount } from '@/lib/utils'
import { CheckCircle, ShoppingCart } from 'lucide-react'
import type { Product } from '@/components/ProductCard'

interface ProductModalProps {
  product: Product
  discountPct?: number
  discountLabel?: string
  open: boolean
  onClose: () => void
  onAddToCart?: (product: Product, discountPct: number) => void
}

export function ProductModal({
  product,
  discountPct = 0,
  discountLabel,
  open,
  onClose,
  onAddToCart,
}: ProductModalProps) {
  const finalPrice = applyDiscount(product.price, discountPct)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {product.image_url && (
              <img
                src={product.image_url}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl border object-contain p-1"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            )}
            <DialogTitle>{product.name}</DialogTitle>
          </div>
          <DialogDescription>
            <Badge variant="secondary" className="mt-1">
              {product.category}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {discountPct > 0 && <DiscountBadge pct={discountPct} label={discountLabel} />}

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{formatPEN(finalPrice)}</span>
            {discountPct > 0 && (
              <span className="text-muted-foreground line-through">{formatPEN(product.price)}</span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{product.duration_days} días de acceso</p>

          {product.features?.length > 0 && (
            <ul className="space-y-1">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            className="gap-1"
            onClick={() => {
              onAddToCart?.(product, discountPct)
              onClose()
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
