'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink, Facebook, Mail, MessageCircle, Music2 } from 'lucide-react'

type FooterSettings = {
  business_name: string
  contact_email: string
  whatsapp_number: string
  facebook_url: string
  tiktok_url: string
  footer_tagline: string
}

const DEFAULT_SETTINGS: FooterSettings = {
  business_name: 'MUNDOSUBS',
  contact_email: '',
  whatsapp_number: '',
  facebook_url: '',
  tiktok_url: '',
  footer_tagline: 'Suscripciones digitales en soles, sin tarjeta internacional.',
}

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS)

export function SiteFooter() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('settings')
      .select('key, value')
      .in('key', SETTING_KEYS)
      .then(({ data }) => {
        if (!data) return
        const next = Object.fromEntries(data.map((item) => [item.key, item.value || '']))
        setSettings((prev) => ({ ...prev, ...next }))
      })
  }, [])

  const whatsappUrl = useMemo(() => {
    const number = settings.whatsapp_number.replace(/\D/g, '')
    if (!number) return ''
    return `https://wa.me/${number}?text=${encodeURIComponent('Hola, quiero información sobre MUNDOSUBS.')}`
  }, [settings.whatsapp_number])

  const links = [
    settings.facebook_url && { label: 'Facebook', href: settings.facebook_url, icon: Facebook },
    settings.tiktok_url && { label: 'TikTok', href: settings.tiktok_url, icon: Music2 },
    settings.contact_email && { label: 'Gmail', href: `mailto:${settings.contact_email}`, icon: Mail },
    whatsappUrl && { label: 'WhatsApp', href: whatsappUrl, icon: MessageCircle },
  ].filter(Boolean) as Array<{ label: string; href: string; icon: typeof Mail }>

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Link href="/" className="site-footer-logo">
            {settings.business_name || 'MUNDOSUBS'}
          </Link>
          <p>{settings.footer_tagline}</p>
        </div>

        <div className="site-footer-section">
          <h2>Contacto</h2>
          <div className="site-footer-links">
            {links.length ? (
              links.map((item) => {
                const Icon = item.icon
                return (
                  <a key={item.label} href={item.href} target={item.href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                    {!item.href.startsWith('mailto:') && <ExternalLink aria-hidden="true" />}
                  </a>
                )
              })
            ) : (
              <span className="site-footer-muted">Agrega tus canales desde Configuración.</span>
            )}
          </div>
        </div>

        <div className="site-footer-section">
          <h2>Empresa</h2>
          <div className="site-footer-links">
            <Link href="/nosotros">Quiénes somos</Link>
            <a href="/#catalog">Catálogo</a>
            <Link href="/auth/login">Mi cuenta</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
