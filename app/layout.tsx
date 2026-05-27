import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Unbounded, Space_Grotesk } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AppShell } from '@/app/components/AppShell'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })
const unbounded = Unbounded({ subsets: ['latin'], variable: '--font-unbounded' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })

export const metadata: Metadata = {
  title: 'MUNDOSUBS — Suscripciones digitales en soles',
  description:
    'Compra streaming, juegos y licencias en soles peruanos sin tarjeta internacional.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
          <WhatsAppButton />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
