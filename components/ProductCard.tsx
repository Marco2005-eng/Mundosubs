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
  image_urls?: string[] | null
  active: boolean
  description?: string | null
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
  const [isHovered, setIsHovered] = useState(false)
  const finalPrice = applyDiscount(product.price, discountPct)
  const images = (product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : []).slice(0, 4)
  const primaryImage = images[0]

  return (
    <>
      <Card 
        onMouseEnter={() => setIsHovered(true)}
        className="ds-card flex flex-col transition-all hover:shadow-lg overflow-hidden border-border/50 bg-card"
      >
        {/* Banner Superior con Logo y Difuminado */}
        <div className="relative h-32 w-full flex items-center justify-center overflow-hidden bg-muted/20">
          
          {/* Difuminado de fondo usando la imagen (Glow de fondo) */}
          {primaryImage && (
            <div className="absolute inset-0 z-0">
              <img 
                src={primaryImage} 
                alt="" 
                className="w-full h-full object-cover blur-2xl opacity-50 scale-125" 
                aria-hidden="true" 
              />
              {/* Gradiente para suavizar la transición hacia abajo */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/90" />
            </div>
          )}

          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-foreground/80 hover:bg-foreground/90 text-background border-0 text-[10px] tracking-widest uppercase font-bold backdrop-blur-md">
              {product.category}
            </Badge>
          </div>

          {/* Icono principal sin caja blanca */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-xl transform transition-transform group-hover:scale-110"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-4xl font-bold text-muted-foreground/50">{product.name.charAt(0)}</span>
            )}
          </div>
        </div>

        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg font-bold font-['Space_Grotesk'] leading-tight truncate">{product.name}</CardTitle>
            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
              {product.features?.[0] || 'La mejor plataforma de entretenimiento y servicios digitales.'}
            </p>
          </div>
          {discountPct > 0 && (
            <div className="mt-2">
              <DiscountBadge pct={discountPct} label={discountLabel} />
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 px-5 pt-3 pb-2">
          <Badge variant="outline" className="text-[10px] text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20 px-2 py-0.5 rounded-full font-semibold">
            {product.duration_days} días
          </Badge>
        </CardContent>

        <CardFooter className="px-5 pb-5 pt-0 mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col">
              {discountPct > 0 ? (
                <>
                  <span className="text-[11px] text-muted-foreground line-through decoration-red-500/50">{formatPEN(product.price)}</span>
                  <span className="text-lg font-black text-foreground leading-none">{formatPEN(finalPrice)}</span>
                </>
              ) : (
                <span className="text-lg font-black text-foreground leading-none">{formatPEN(product.price)}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full mt-1">
            <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs font-semibold" onClick={() => setOpen(true)}>
              Ver detalle
            </Button>
            <Button
              size="sm"
              className="flex-[1.5] rounded-xl px-3 text-xs font-bold shadow-[0_4px_14px_0_rgba(124,58,237,0.39)] bg-violet-600 hover:bg-violet-700 text-white transition-all gap-1.5"
              onClick={() => onAddToCart?.(product, discountPct)}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Agregar
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Precarga de imágenes al hacer hover sobre la tarjeta */}
      {isHovered && images.map((url, idx) => (
        <img key={`preload-hover-${idx}`} src={url} alt="" className="hidden" aria-hidden="true" />
      ))}

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
