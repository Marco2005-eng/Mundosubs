'use client'

import { MessageCircle } from 'lucide-react'
import { buildWhatsAppLink } from '@/lib/whatsapp'

export function WhatsAppButton() {
  return (
    <a
      href={buildWhatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110"
      aria-label="Soporte por WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  )
}
