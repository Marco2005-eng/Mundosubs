import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, HeartHandshake, ShieldCheck, WalletCards } from 'lucide-react'
import { AboutCarousel } from '@/components/AboutCarousel'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Nosotros',
  description:
    'Conoce la historia de MUNDOSUBS, una tienda peruana de suscripciones digitales en soles con pagos locales y soporte por WhatsApp.',
  alternates: {
    canonical: '/nosotros',
  },
  openGraph: {
    title: 'Nosotros | MUNDOSUBS',
    description:
      'Conoce la historia de MUNDOSUBS y cómo ayudamos a comprar suscripciones digitales en soles peruanos.',
    url: '/nosotros',
  },
}

export default async function AboutPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['about_title', 'about_summary', 'about_history', 'about_images', 'business_name'])
    .then((result) => result.error ? { data: [] } : result)

  const settings = Object.fromEntries((data ?? []).map((item) => [item.key, item.value ?? ''])) as Record<string, string>
  const images = (settings.about_images ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  return (
    <div className="about-page">
      <Link href="/" className="about-page-back">
        <ArrowLeft aria-hidden="true" />
        Volver al catálogo
      </Link>

      <section className="about-page-hero">
        <span>Sobre {settings.business_name || 'MUNDOSUBS'}</span>
        <h1>{settings.about_title || 'Quiénes somos'}</h1>
        <p>
          {settings.about_summary || 'Somos una tienda peruana de suscripciones digitales pensada para comprar en soles y recibir soporte directo.'}
        </p>
      </section>

      <AboutCarousel
        title={settings.about_title || 'Quiénes somos'}
        summary={settings.about_summary || ''}
        history={settings.about_history || ''}
        images={images}
      />

      <section className="about-values">
        <article>
          <WalletCards aria-hidden="true" />
          <h2>Pagos simples</h2>
          <p>Compras en soles mediante métodos locales, sin depender de una tarjeta internacional.</p>
        </article>
        <article>
          <ShieldCheck aria-hidden="true" />
          <h2>Revisión manual</h2>
          <p>Cada comprobante es revisado antes de activar o renovar un servicio.</p>
        </article>
        <article>
          <HeartHandshake aria-hidden="true" />
          <h2>Soporte cercano</h2>
          <p>Atención directa por WhatsApp para resolver dudas antes y después de la compra.</p>
        </article>
      </section>
    </div>
  )
}
