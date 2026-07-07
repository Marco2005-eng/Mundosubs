'use client'

import { useEffect, useState, useRef } from 'react'
import { Star, MessageSquarePlus, Sparkles, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface Review {
  id: string
  user_name: string
  user_email: string
  user_avatar: string | null
  rating: number
  comment: string
  created_at: string
}

function maskEmail(email: string) {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visibleLocal = local.slice(0, Math.min(3, Math.max(1, Math.floor(local.length / 2))))
  const maskedLocal = visibleLocal + '*'.repeat(Math.max(3, local.length - visibleLocal.length))
  const [domainName, tld] = domain.split('.')
  if (!tld) return `${maskedLocal}@${domain}`
  const visibleDomain = domainName.slice(0, Math.min(2, Math.max(1, Math.floor(domainName.length / 2))))
  const maskedDomain = visibleDomain + '*'.repeat(Math.max(3, domainName.length - visibleDomain.length))
  return `${maskedLocal}@${maskedDomain}.${tld}`
}

function formatReviewDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'hoy'
    if (diffDays === 1) return 'ayer'
    if (diffDays < 7) return `hace ${diffDays} días`
    
    return date.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch (e) {
    return ''
  }
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  
  // Sort and Filter States
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent')
  const [filterRating, setFilterRating] = useState<string>('all')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const autoPlayTimeoutRef = useRef<number | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Calculate filtered and sorted reviews
  const filteredReviews = [...reviews]
    .filter((r) => {
      if (filterRating === 'all') return true
      if (filterRating === '5') return r.rating === 5
      if (filterRating === '4') return r.rating === 4
      if (filterRating === '3') return r.rating <= 3
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortBy === 'recent' ? dateB - dateA : dateA - dateB
    })

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0'

  const handleScroll = () => {
    if (!containerRef.current) return
    const container = containerRef.current
    const scrollLeft = container.scrollLeft
    const card = container.querySelector('article')
    if (card) {
      const cardWidth = card.getBoundingClientRect().width
      const gap = 16 // gap-4 is 16px
      const index = Math.round(scrollLeft / (cardWidth + gap)) % filteredReviews.length
      setActiveIndex(index)
    }
  }

  const scrollToIndex = (index: number) => {
    if (!containerRef.current || filteredReviews.length === 0) return
    const container = containerRef.current
    const card = container.querySelector('article')
    if (card) {
      const cardWidth = card.getBoundingClientRect().width
      const gap = 16
      const targetScroll = index * (cardWidth + gap)
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
      setActiveIndex(index)
    }
  }

  const handlePrev = () => {
    triggerInteractionPause()
    const newIndex = (activeIndex - 1 + filteredReviews.length) % filteredReviews.length
    scrollToIndex(newIndex)
  }

  const handleNext = () => {
    triggerInteractionPause()
    const newIndex = (activeIndex + 1) % filteredReviews.length
    scrollToIndex(newIndex)
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch (e) {}

    fetchReviews()
  }, [])

  // Autoplay Effect (Continuous smooth scrolling like a marquee)
  useEffect(() => {
    if (filteredReviews.length === 0 || isPaused) return

    let animationId: number
    const container = containerRef.current
    if (!container) return

    let accumulatedScroll = container.scrollLeft
    const speed = 1.2 // Pixeles por frame para un deslizamiento continuo y suave (más dinámico)

    const scroll = () => {
      if (container) {
        const card = container.querySelector('article')
        const cardWidth = card ? card.getBoundingClientRect().width : 310
        const gap = 16
        const singleSetWidth = (cardWidth + gap) * filteredReviews.length

        accumulatedScroll += speed
        
        // Reinicio cíclico sin cortes una vez que se desplaza el ancho de un conjunto de reseñas
        if (accumulatedScroll >= singleSetWidth) {
          accumulatedScroll = 0
        }
        
        container.scrollLeft = Math.floor(accumulatedScroll)
      }
      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(animationId)
  }, [filteredReviews.length, isPaused])

  const triggerInteractionPause = () => {
    setIsPaused(true)
    if (autoPlayTimeoutRef.current) {
      window.clearTimeout(autoPlayTimeoutRef.current)
    }
    autoPlayTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false)
    }, 5000)
  }

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimeoutRef.current) {
        window.clearTimeout(autoPlayTimeoutRef.current)
      }
    }
  }, [])

  async function fetchReviews() {
    try {
      const res = await fetch('/api/reviews')
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews ?? [])
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      })

      if (res.ok) {
        toast({ title: '¡Gracias!', description: 'Tu reseña ha sido publicada exitosamente.' })
        setComment('')
        setRating(5)
        setShowForm(false)
        fetchReviews()
      } else {
        const data = await res.json()
        toast({ variant: 'destructive', title: 'Error', description: data.error || 'No se pudo publicar la reseña.' })
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un problema de conexión.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="store-section reviews-container animate-fade-in" style={{ marginTop: '48px' }}>
      <div className="section-heading flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span>Experiencias MUNDOSUBS</span>
          <h2>Opiniones de la comunidad</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Calificación promedio: <strong className="text-violet-600 dark:text-violet-400">{averageRating} ★</strong> ({reviews.length} opiniones)
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2 font-semibold text-xs py-1.5 px-3 h-auto"
            >
              <MessageSquarePlus className="h-4 w-4" />
              {showForm ? 'Cancelar reseña' : 'Dejar mi opinión'}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/50">
              Inicia sesión para dejar una reseña sobre MUNDOSUBS
            </p>
          )}
        </div>
      </div>

      {showForm && user && (
        <form onSubmit={handleSubmit} className="mt-6 p-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 space-y-4 max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Tu puntuación:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoverRating ?? rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="comment-textarea" className="text-sm font-medium text-foreground">Tu comentario:</label>
            <textarea
              id="comment-textarea"
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué tal ha sido tu experiencia comprando tus suscripciones?"
              className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Publicar reseña
          </Button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl bg-muted/10 mt-6">
          <Sparkles className="h-8 w-8 mx-auto text-violet-500/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {reviews.length === 0 
              ? 'Sé el primero en dejar una reseña para nuestra web.'
              : 'No se encontraron reseñas con los filtros seleccionados.'}
          </p>
        </div>
      ) : (
        <div className="mt-8 relative group/slider">
          {/* Botones de Navegación Lateral (Ocultos en mobile, hover en desktop) */}
          {filteredReviews.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-[-16px] top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-black/60 text-white border border-white/10 hover:bg-black/90 active:scale-95 transition-all opacity-0 group-hover/slider:opacity-100 focus:outline-none z-10 shadow-lg cursor-pointer"
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label="Reseña anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="absolute right-[-16px] top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-black/60 text-white border border-white/10 hover:bg-black/90 active:scale-95 transition-all opacity-0 group-hover/slider:opacity-100 focus:outline-none z-10 shadow-lg cursor-pointer"
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label="Siguiente reseña"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Carrusel de Deslizamiento Suave */}
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth select-none scrollbar-none"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Peek inicial vacío para centrar la primera tarjeta */}
            <div className="w-[10px] sm:w-[20px] shrink-0" aria-hidden="true" />

            {[...filteredReviews, ...filteredReviews].map((review, idx) => (
              <article
                key={`${review.id}-${idx}`}
                onClick={() => {
                  triggerInteractionPause()
                  scrollToIndex(idx % filteredReviews.length)
                }}
                className={`flex flex-col justify-between p-5 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 snap-center shrink-0 cursor-pointer ${
                  (activeIndex === idx % filteredReviews.length) ? 'border-violet-500/40 scale-102 shadow-md' : 'border-border/50 opacity-70 hover:opacity-100'
                }`}
                style={{ width: '310px', scrollSnapAlign: 'center' }}
              >
                <div className="space-y-3">
                  {/* Calificación y Fecha */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                    {review.created_at && (
                      <span 
                        className="text-[11px] text-muted-foreground"
                        title={new Date(review.created_at).toLocaleString('es-PE')}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {formatReviewDate(review.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed italic whitespace-normal">
                    "{review.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 mt-4 border-t border-border/40">
                  {review.user_avatar ? (
                    <img
                      src={review.user_avatar}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover border border-violet-500/20"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-violet-600/10 text-violet-600 border border-violet-500/20 flex items-center justify-center font-bold text-sm uppercase">
                      {review.user_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate">{review.user_name}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{maskEmail(review.user_email)}</p>
                  </div>
                </div>
              </article>
            ))}

            {/* Peek final vacío para centrar la última tarjeta */}
            <div className="w-[10px] sm:w-[20px] shrink-0" aria-hidden="true" />
          </div>

          {/* Dots Indicadores Inferiores */}
          {filteredReviews.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-4">
              {filteredReviews.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    triggerInteractionPause()
                    scrollToIndex(index)
                  }}
                  className={`rounded-full transition-all duration-300 focus:outline-none ${
                    activeIndex === index 
                      ? 'w-4 h-2 bg-violet-500' 
                      : 'w-2 h-2 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600'
                  }`}
                  style={{ minWidth: '8px', minHeight: '8px' }}
                  aria-label={`Ver reseña ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Contador de posición */}
          {filteredReviews.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {activeIndex + 1} de {filteredReviews.length} opiniones
            </p>
          )}

          <style>{`
            .reviews-container {
              min-width: 0;
              max-width: 100%;
              overflow: hidden;
            }
            /* Hide scrollbar for Chrome, Safari and Opera */
            .scrollbar-none::-webkit-scrollbar {
              display: none;
            }
            /* Hide scrollbar for IE, Edge and Firefox */
            .scrollbar-none {
              -ms-overflow-style: none;  /* IE and Edge */
              scrollbar-width: none;  /* Firefox */
            }
          `}</style>
        </div>
      )}
    </section>
  )
}
