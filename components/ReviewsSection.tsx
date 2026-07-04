'use client'

import { useEffect, useState } from 'react'
import { Star, MessageSquarePlus, Sparkles, Loader2 } from 'lucide-react'
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

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch (e) {}

    fetchReviews()
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

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0'

  return (
    <section className="store-section reviews-container" style={{ marginTop: '48px' }}>
      <div className="section-heading flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span>Experiencias MUNDOSUBS</span>
          <h2>Opiniones de la comunidad</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Calificación promedio: <strong className="text-violet-600 dark:text-violet-400">{averageRating} ★</strong> ({reviews.length} opiniones)
          </p>
        </div>
        {user ? (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2 font-semibold"
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
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl bg-muted/10 mt-6">
          <Sparkles className="h-8 w-8 mx-auto text-violet-500/50 mb-3" />
          <p className="text-sm text-muted-foreground">Sé el primero en dejar una reseña para nuestra web.</p>
        </div>
      ) : (
        <div className="mt-8 reviews-container">
          {reviews.length < 3 ? (
            /* Layout estático centrado para pocas reseñas */
            <div className="flex flex-wrap justify-center gap-6">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="flex flex-col justify-between p-5 rounded-2xl border border-border/50 bg-card hover:shadow-md transition-shadow"
                  style={{ width: '310px' }}
                >
                  <div className="space-y-3">
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
            </div>
          ) : (
            /* Marquee infinito para 3 o más reseñas */
            <div className="reviews-marquee-container">
              <div className="reviews-marquee-track">
                {[...reviews, ...reviews].map((review, idx) => (
                  <article
                    key={`${review.id}-${idx}`}
                    className="flex flex-col justify-between p-5 rounded-2xl border border-border/50 bg-card hover:shadow-md transition-shadow"
                    style={{ width: '310px', flexShrink: 0 }}
                  >
                    <div className="space-y-3">
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
              </div>
            </div>
          )}

          <style>{`
            .reviews-container {
              min-width: 0;
              max-width: 100%;
              overflow: hidden;
            }
            .reviews-marquee-container {
              overflow: hidden;
              width: 100%;
              max-width: 100%;
              position: relative;
              padding: 12px 0;
              mask-image: linear-gradient(to right, transparent, white 8%, white 92%, transparent);
              -webkit-mask-image: linear-gradient(to right, transparent, white 8%, white 92%, transparent);
            }
            .reviews-marquee-track {
              display: flex;
              gap: 20px;
              width: max-content;
              animation: reviews-scroll 40s linear infinite;
            }
            .reviews-marquee-track:hover {
              animation-play-state: paused;
            }
            @keyframes reviews-scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
          `}</style>
        </div>
      )}
    </section>
  )
}
