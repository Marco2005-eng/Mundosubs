'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Images } from 'lucide-react'

type AboutCarouselProps = {
  title: string
  summary: string
  history: string
  images: string[]
}

export function AboutCarousel({ title, summary, history, images }: AboutCarouselProps) {
  const validImages = useMemo(
    () => images.map((item) => item.trim()).filter(Boolean),
    [images]
  )
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (validImages.length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % validImages.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [validImages.length])

  const hasImages = validImages.length > 0

  function move(direction: number) {
    if (!validImages.length) return
    setIndex((current) => (current + direction + validImages.length) % validImages.length)
  }

  return (
    <section id="nosotros" className="about-section">
      <div className="about-copy">
        <span className="about-eyebrow">Nosotros</span>
        <h2>{title || 'Quienes somos'}</h2>
        <p>{summary || 'Somos una tienda peruana de suscripciones digitales pensada para comprar en soles y recibir soporte directo.'}</p>
        {history && <div className="about-history">{history}</div>}
      </div>

      <div className="about-carousel" aria-label="Galeria de MUNDOSUBS">
        {hasImages ? (
          <img src={validImages[index]} alt={`${title || 'MUNDOSUBS'} ${index + 1}`} loading="lazy" />
        ) : (
          <div className="about-placeholder">
            <Images aria-hidden="true" />
            <span>Agrega imagenes desde Configuracion</span>
          </div>
        )}

        {validImages.length > 1 && (
          <>
            <button type="button" className="about-carousel-btn about-carousel-prev" onClick={() => move(-1)} aria-label="Imagen anterior">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className="about-carousel-btn about-carousel-next" onClick={() => move(1)} aria-label="Imagen siguiente">
              <ChevronRight aria-hidden="true" />
            </button>
            <div className="about-carousel-dots">
              {validImages.map((_, itemIndex) => (
                <button
                  key={itemIndex}
                  type="button"
                  className={itemIndex === index ? 'active' : ''}
                  onClick={() => setIndex(itemIndex)}
                  aria-label={`Ver imagen ${itemIndex + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
