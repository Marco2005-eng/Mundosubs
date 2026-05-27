export function buildWhatsAppLink(message?: string): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  const text = encodeURIComponent(message ?? 'Hola, necesito ayuda con MUNDOSUBS.')
  return `https://wa.me/${number}?text=${text}`
}

export function normalizeWhatsAppNumber(phone?: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('51')) return digits
  if (digits.length === 9) return `51${digits}`
  return digits
}

export function buildUserWhatsAppLink(phone?: string | null, message?: string): string | null {
  const number = normalizeWhatsAppNumber(phone)
  if (!number) return null
  const text = encodeURIComponent(message ?? 'Hola, te escribimos de MUNDOSUBS.')
  return `https://wa.me/${number}?text=${text}`
}

export function buildOrderWhatsAppLink(orderId: string): string {
  return buildWhatsAppLink(`Hola, tengo una consulta sobre mi pedido #${orderId}.`)
}

export function buildSubscriptionWhatsAppLink(productName: string): string {
  return buildWhatsAppLink(`Hola, quiero consultar sobre mi suscripción a ${productName}.`)
}
