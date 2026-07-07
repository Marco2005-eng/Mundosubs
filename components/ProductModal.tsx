'use client'

import { useEffect, useState, useRef } from 'react'
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
import { CheckCircle, ShoppingCart, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
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
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  const [isPaused, setIsPaused] = useState(false)
  const pauseTimeoutRef = useRef<number | null>(null)
  const autoPlayIntervalRef = useRef<number | null>(null)

  // Touch Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Reset errors and loading when selected image changes
  useEffect(() => {
    setIsImageLoading(true)
    setImageError(false)
  }, [selectedImage])

  useEffect(() => {
    setSelectedImage(0)
  }, [product.id, open])

  // Cíclico
  const handlePrev = () => {
    if (galleryImages.length <= 1) return
    setSelectedImage((current) => (current === 0 ? galleryImages.length - 1 : current - 1))
    triggerInteractionPause()
  }

  const handleNext = () => {
    if (galleryImages.length <= 1) return
    setSelectedImage((current) => (current === galleryImages.length - 1 ? 0 : current + 1))
    triggerInteractionPause()
  }

  const triggerInteractionPause = () => {
    setIsPaused(true)
    if (pauseTimeoutRef.current) {
      window.clearTimeout(pauseTimeoutRef.current)
    }
    // Reanudar después de 4 segundos de inactividad
    pauseTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false)
    }, 4000)
  }

  // Auto-play interval
  useEffect(() => {
    if (!open || galleryImages.length <= 1 || isPaused) {
      if (autoPlayIntervalRef.current) {
        window.clearInterval(autoPlayIntervalRef.current)
      }
      return
    }

    autoPlayIntervalRef.current = window.setInterval(() => {
      setSelectedImage((current) => (current + 1) % galleryImages.length)
    }, 5000)

    return () => {
      if (autoPlayIntervalRef.current) {
        window.clearInterval(autoPlayIntervalRef.current)
      }
    }
  }, [galleryImages.length, open, isPaused])

  // Clean timeout
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [])

  // Mobile Swipe Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    triggerInteractionPause()
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const minSwipeDistance = 50
    if (distance > minSwipeDistance) {
      handleNext()
    } else if (distance < -minSwipeDistance) {
      handlePrev()
    }
  }

  // Preload next image index
  const nextImageIndex = (selectedImage + 1) % galleryImages.length
  const nextImageUrl = galleryImages[nextImageIndex]

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
              {/* Contenedor de la Imagen Principal */}
              <div 
                className="relative mx-auto w-full max-w-[320px] sm:max-w-[500px] aspect-[4/3] sm:aspect-video group mt-4 mb-2 overflow-visible"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Glow detrás de la imagen (Efecto difuminado) */}
                {!imageError && (
                  <img 
                    src={activeGalleryImage} 
                    alt="" 
                    className={`absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-105 translate-y-3 rounded-3xl transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-40'}`} 
                    aria-hidden="true" 
                  />
                )}

                {/* Contenedor con borde y sombra */}
                <div 
                  className="relative w-full h-full flex items-center justify-center rounded-3xl overflow-hidden shadow-[0_15px_35px_-8px_rgba(0,0,0,0.4)] border border-white/10 bg-black/10 touch-pan-y"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Skeleton Shimmer Loader */}
                  {isImageLoading && !imageError && (
                    <div className="absolute inset-0 bg-neutral-800 animate-pulse flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Fallback en caso de error */}
                  {imageError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-900 text-neutral-400 p-4 text-center">
                      <ImageIcon className="h-10 w-10 text-neutral-500" />
                      <span className="text-xs">No se pudo cargar la imagen</span>
                    </div>
                  ) : (
                    <img 
                      src={activeGalleryImage} 
                      alt="" 
                      className={`w-full h-full object-cover cursor-zoom-in transition-all duration-350 ease-in-out ${isImageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} 
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => {
                        setIsImageLoading(false)
                        setImageError(true)
                      }}
                      onClick={() => setIsFullscreen(true)}
                    />
                  )}

                  {/* Flechas de Navegación Lateral (Ocultas en desktop si no hay hover) */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePrev()
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/10 hover:bg-black/80 active:scale-95 transition-all md:opacity-0 md:group-hover:opacity-100 focus:outline-none z-10"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNext()
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/10 hover:bg-black/80 active:scale-95 transition-all md:opacity-0 md:group-hover:opacity-100 focus:outline-none z-10"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                        aria-label="Siguiente imagen"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}

                  {/* Dots Superpuestos en la Parte Inferior */}
                  {galleryImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/5 z-10">
                      {galleryImages.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImage(index)
                            triggerInteractionPause()
                          }}
                          className={`rounded-full transition-all duration-300 focus:outline-none ${selectedImage === index ? 'w-4 h-2 bg-violet-400' : 'w-2 h-2 bg-white/50 hover:bg-white'}`}
                          style={{ minWidth: '8px', minHeight: '8px' }}
                          aria-label={`Ir a imagen ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Precarga de todas las imágenes de la galería */}
              {galleryImages.map((url, index) => (
                <img key={`preload-modal-${index}`} src={url} alt="" className="hidden" aria-hidden="true" />
              ))}

              {/* Galería de Miniaturas (Thumbnails) */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 justify-start sm:justify-center mt-3 snap-x snap-mandatory scroll-smooth scrollbar-thin select-none">
                  {galleryImages.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => {
                        setSelectedImage(index)
                        triggerInteractionPause()
                      }}
                      className={`h-16 w-16 shrink-0 rounded-xl border sm:h-20 sm:w-20 overflow-hidden transition-all duration-200 snap-center ${selectedImage === index ? 'ring-2 ring-violet-500 scale-105 shadow-md border-transparent' : 'opacity-65 hover:opacity-100 hover:scale-102'}`}
                    >
                      <img 
                        src={url} 
                        alt="" 
                        className="h-full w-full object-cover" 
                        loading="lazy" 
                        referrerPolicy="no-referrer" 
                      />
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

          {product.description && (
            <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/40 whitespace-pre-wrap leading-relaxed">
              {product.description}
            </p>
          )}

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
