const ALLOWED_EMAIL_TLDS = new Set(['com', 'pe', 'edu'])

export function hasAllowedEmailDomain(email: string) {
  const normalized = email.trim().toLowerCase()
  const domain = normalized.split('@')[1]
  if (!domain || !domain.includes('.')) return false

  const tld = domain.split('.').filter(Boolean).at(-1)
  return Boolean(tld && ALLOWED_EMAIL_TLDS.has(tld))
}

export const allowedEmailDomainMessage = 'Usa un correo con dominio .com, .pe o .edu'
