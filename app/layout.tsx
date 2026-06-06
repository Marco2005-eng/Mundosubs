import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk, Unbounded } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from '@/components/ui/toaster'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { AppShell } from '@/app/components/AppShell'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })
const unbounded = Unbounded({ subsets: ['latin'], variable: '--font-unbounded' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mundosubs.net.pe'
const siteName = 'MUNDOSUBS'
const siteDescription =
  'Compra suscripciones digitales, streaming, juegos y software en soles peruanos. Paga con metodos locales y recibe soporte por WhatsApp.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: 'MUNDOSUBS | Suscripciones digitales en soles peruanos',
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'suscripciones digitales Peru',
    'streaming en soles',
    'comprar Netflix Peru',
    'Disney Plus Peru',
    'Spotify Premium Peru',
    'software en soles',
    'pagar con Yape',
    'suscripciones sin tarjeta internacional',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: '/',
    siteName,
    title: 'MUNDOSUBS | Suscripciones digitales en soles peruanos',
    description: siteDescription,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'MUNDOSUBS - Suscripciones digitales en soles peruanos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MUNDOSUBS | Suscripciones digitales en soles peruanos',
    description: siteDescription,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7c3aed',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE" suppressHydrationWarning>
      <body className={`${inter.className} ${unbounded.variable} ${spaceGrotesk.variable}`}>
        <Providers>
          <AppShell>{children}</AppShell>
          <WhatsAppButton />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
