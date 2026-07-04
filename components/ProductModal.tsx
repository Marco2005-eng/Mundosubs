'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  const images = (product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : []).slice(0, 4)
  const logoImage = images[0]
  const galleryImages = images.length > 1 ? images.slice(1) : images
  const [selectedImage, setSelectedImage] = useState(0)
  const activeGalleryImage = galleryImages[selectedImage] ?? galleryImages[0]
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    setSelectedImage(0)
  }, [product.id, open])

  useEffect(() => {
    if (!open || galleryImages.length <= 1) return

    const timer = window.setInterval(() => {
      setSelectedImage((current) => (current + 1) % galleryImages.length)
    }, 3500)

    return () => window.clearInterval(timer)
  }, [galleryImages.length, open])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1.5rem)] max-w-[640px] overflow-y-auto rounded-lg p-4 sm:max-h-[92vh] sm:p-6">
        <DialogHeader className="pr-8">
          <div className="flex min-w-0 items-center gap-3">
            {logoImage && (
              <img
                src={logoImage}
                alt=""
                className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 object-contain drop-shadow-sm"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            )}
            <DialogTitle className="min-w-0 leading-tight">{product.name}</DialogTitle>
          </div>
          <div>
            <Badge variant="secondary" className="mt-1">
              {product.category}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {activeGalleryImage && (
            <div className="space-y-3">
              <button 
                type="button"
                className="relative block mx-auto w-full max-w-[320px] sm:max-w-[500px] aspect-[4/3] sm:aspect-video group mt-4 mb-2 cursor-zoom-in focus:outline-none"
                onClick={() => setIsFullscreen(true)}
              >
                {/* Efecto de difuminado (Glow) detrás de la imagen */}
                <img src={activeGalleryImage} alt="" className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-105 translate-y-4 rounded-3xl transition-transform duration-500 group-hover:scale-110" aria-hidden="true" />
                {/* Imagen principal sin borde blanco */}
                <div className="relative w-full h-full flex items-center justify-center rounded-3xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-white/20 bg-black/5">
                  <img src={activeGalleryImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              </button>
              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 justify-center mt-4">
                  {galleryImages.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`h-16 w-16 shrink-0 rounded-xl border sm:h-20 sm:w-20 overflow-hidden transition-all ${selectedImage === index ? 'ring-2 ring-violet-500 scale-105 shadow-md' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {discountPct > 0 && <DiscountBadge pct={discountPct} label={discountLabel} />}

          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-bold text-primary sm:text-3xl">{formatPEN(finalPrice)}</span>
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

        <DialogFooter className="sticky bottom-0 -mx-4 -mb-4 flex-col gap-2 border-t bg-background/95 p-4 backdrop-blur sm:static sm:m-0 sm:flex-row sm:border-0 sm:bg-transparent sm:p-0">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            className="gap-1 bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
            onClick={() => {
              onAddToCart?.(product, discountPct)
              onClose()
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            Agregar al carrito
          </Button>
        </DialogFooter>

        {isFullscreen && (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md cursor-zoom-out"
            onClick={() => setIsFullscreen(false)}
            title="Haz click para cerrar"
          >
            <img 
              src={activeGalleryImage} 
              alt="Vista ampliada" 
              className="w-full h-full object-contain max-w-screen-xl max-h-screen" 
            />
            {/* Botón flotante para cerrar (opcional visual) */}
            <div className="absolute top-4 right-4 bg-white/10 text-white p-2 rounded-full backdrop-blur-sm pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
