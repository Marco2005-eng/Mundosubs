'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Gamepad2, Music2, Palette, Sparkles, Tv } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const SLIDES = [
  {
    badge: 'Oferta del mes',
    title: 'Netflix desde S/12 sin tarjeta internacional',
    copy: 'Paga con Yape, Plin o transferencia bancaria. Activación rápida con soporte directo por WhatsApp.',
    accent: 'violet',
    Icon: Tv,
    primary: 'Ver suscripciones',
    secondary: 'Cómo funciona',
    secondaryHref: '#como-funciona',
  },
  {
    badge: 'Música sin anuncios',
    title: 'Spotify Premium por S/9.90 al mes',
    copy: 'Escucha sin límites, descarga música offline y disfruta desde cualquier dispositivo.',
    accent: 'cyan',
    Icon: Music2,
    primary: 'Ver oferta',
    secondary: 'Promos activas',
    secondaryHref: '#promos',
  },
  {
    badge: 'Gaming',
    title: 'Xbox Game Pass Ultimate disponible',
    copy: 'Cientos de juegos, EA Play incluido y planes para consola o PC en soles.',
    accent: 'green',
    Icon: Gamepad2,
    primary: 'Ver juegos',
    secondary: 'Ir al catálogo',
    secondaryHref: '#catalog',
  },
  {
    badge: 'Software creativo',
    title: 'Adobe Creative Cloud para trabajar y crear',
    copy: 'Herramientas digitales para diseno, productividad y licencias sin pagos internacionales.',
    accent: 'blue',
    Icon: Palette,
    primary: 'Ver software',
    secondary: 'Explorar categorías',
    secondaryHref: '#categorias',
  },
]

export function StorefrontHeroSlider({ userLoggedIn }: { userLoggedIn: boolean }) {
  const [current, setCurrent] = useState(0)
  const slide = SLIDES[current]
  const Icon = slide.Icon

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % SLIDES.length)
    }, 5200)
    return () => window.clearInterval(timer)
  }, [])

  const progressKey = useMemo(() => `slide-${current}`, [current])

  function goTo(index: number) {
    setCurrent((index + SLIDES.length) % SLIDES.length)
  }

  return (
    <section className={`storefront-hero-slider hero-${slide.accent}`} aria-label="Promociones destacadas">
      <div className="hero-slide-copy">
        <span className="hero-slide-badge">
          <Sparkles aria-hidden="true" />
          {slide.badge}
        </span>
        <h1>{slide.title}</h1>
        <p>{slide.copy}</p>
        <div className="hero-actions">
          <a href="#catalog" className="hero-primary">{slide.primary}</a>
          {userLoggedIn ? (
            <a href={slide.secondaryHref} className="hero-secondary">{slide.secondary}</a>
          ) : (
            <Link href="/auth/register" className="hero-secondary">Crear cuenta</Link>
          )}
        </div>
      </div>

      <div className="hero-slide-visual" aria-hidden="true">
        <div className="hero-icon-ring">
          <Icon />
        </div>
      </div>

      <button type="button" className="hero-arrow hero-arrow-prev" onClick={() => goTo(current - 1)} aria-label="Promocion anterior">
        <ChevronLeft aria-hidden="true" />
      </button>
      <button type="button" className="hero-arrow hero-arrow-next" onClick={() => goTo(current + 1)} aria-label="Promocion siguiente">
        <ChevronRight aria-hidden="true" />
      </button>

      <div className="hero-dots" aria-label="Cambiar promocion">
        {SLIDES.map((item, index) => (
          <button
            key={item.badge}
            type="button"
            className={index === current ? 'active' : ''}
            onClick={() => goTo(index)}
            aria-label={`Ver ${item.badge}`}
          />
        ))}
      </div>
      <span key={progressKey} className="hero-progress" />
    </section>
  )
}
