'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DiscountBadge } from '@/components/DiscountBadge'
import { ProductModal } from '@/components/ProductModal'
import { formatPEN, applyDiscount } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'

export interface Product {
  id: string
  name: string
  category: string
  price: number
  duration_days: number
  features: string[]
  image_url?: string | null
  active: boolean
}

interface ProductCardProps {
  product: Product
  discountPct?: number
  discountLabel?: string
  onAddToCart?: (product: Product, discountPct: number) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  streaming: 'Streaming',
  game: 'Juegos',
  license: 'Licencia',
  software: 'Software',
  music: 'Música',
}

export function ProductCard({ product, discountPct = 0, discountLabel, onAddToCart }: ProductCardProps) {
  const [open, setOpen] = useState(false)
  const finalPrice = applyDiscount(product.price, discountPct)

  return (
    <>
      <Card className="ds-card flex flex-col transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg border object-contain p-1"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              )}
              <CardTitle className="text-base">{product.name}</CardTitle>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {CATEGORY_LABELS[product.category] ?? product.category}
            </Badge>
          </div>
          {discountPct > 0 && <DiscountBadge pct={discountPct} label={discountLabel} />}
        </CardHeader>

        <CardContent className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{formatPEN(finalPrice)}</span>
            {discountPct > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPEN(product.price)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{product.duration_days} días de acceso</p>
        </CardContent>

        <CardFooter className="gap-2">
          <Button variant="outline" size="sm" className="flex-1 ds-btn-outline" onClick={() => setOpen(true)}>
            Ver detalle
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1 ds-btn ds-btn-primary"
            onClick={() => onAddToCart?.(product, discountPct)}
          >
            <ShoppingCart className="h-4 w-4" />
            Agregar
          </Button>
        </CardFooter>
      </Card>

      <ProductModal
        product={product}
        discountPct={discountPct}
        discountLabel={discountLabel}
        open={open}
        onClose={() => setOpen(false)}
        onAddToCart={onAddToCart}
      />
    </>
  )
}
