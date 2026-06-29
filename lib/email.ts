import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey && apiKey.startsWith('re_') ? new Resend(apiKey) : null

const FROM = process.env.RESEND_FROM_EMAIL ?? 'MUNDOSUBS <no-reply@mundosubs.net.pe>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log('Email (mock):', { to, subject })
    return
  }

  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('Email error:', err)
  }
}

function button(label: string, href: string) {
  return `<p style="margin:24px 0">
    <a href="${href}" style="background:#6d44c8;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">${label}</a>
  </p>`
}

function layout(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717;max-width:560px;margin:0 auto;padding:24px">
    <h2 style="margin:0 0 16px;color:#111827">${title}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0" />
    <p style="font-size:13px;color:#6b7280">MUNDOSUBS - Suscripciones digitales en soles.</p>
  </div>`
}

export async function sendWelcomeEmail(params: {
  to: string
  userName: string
}) {
  await sendEmail(
    params.to,
    'Bienvenido a MUNDOSUBS',
    layout(
      `Hola ${params.userName}!`,
      `<p>Tu cuenta en MUNDOSUBS ya esta lista.</p>
      <p>Desde ahora puedes comprar tus suscripciones digitales en soles, subir tu comprobante y revisar tus servicios activos desde tu panel.</p>
      ${button('Ver catalogo', APP_URL)}
      <p>Si necesitas ayuda, puedes escribirnos por WhatsApp desde la web.</p>`
    )
  )
}

export async function sendOrderApprovedEmail(params: {
  to: string
  userName: string
  productName: string
  expiresAt: string
  orderId: string
}) {
  await sendEmail(
    params.to,
    'Tu pedido fue aprobado - MUNDOSUBS',
    layout(
      `Hola ${params.userName}!`,
      `<p>Tu pedido de <strong>${params.productName}</strong> ha sido aprobado.</p>
      <p>Tu acceso estara activo hasta el <strong>${params.expiresAt}</strong>.</p>
      <p>Por seguridad, revisa los datos de acceso desde tu panel de suscripciones.</p>
      ${button('Ver mis suscripciones', `${APP_URL}/dashboard`)}
      <p style="font-size:13px;color:#6b7280">Pedido: ${params.orderId}</p>`
    )
  )
}

export async function sendOrderRejectedEmail(params: {
  to: string
  userName: string
  productName: string
  adminNote?: string
  orderId: string
}) {
  await sendEmail(
    params.to,
    'Tu pedido fue rechazado - MUNDOSUBS',
    layout(
      `Hola ${params.userName},`,
      `<p>Tu pedido de <strong>${params.productName}</strong> fue rechazado.</p>
      ${params.adminNote ? `<p><strong>Motivo:</strong> ${params.adminNote}</p>` : ''}
      <p>Si tienes dudas o quieres enviar un nuevo comprobante, contactanos por WhatsApp.</p>
      ${button('Ver pedido', `${APP_URL}/checkout/${params.orderId}`)}`
    )
  )
}

export async function sendDiscountAssignedEmail(params: {
  to: string
  userName: string
  discountPct: number
  expiresAt?: string
}) {
  await sendEmail(
    params.to,
    'Tienes un descuento especial - MUNDOSUBS',
    layout(
      `Hola ${params.userName}!`,
      `<p>Te hemos asignado un descuento de <strong>${params.discountPct}%</strong> en tu proxima compra.</p>
      ${params.expiresAt ? `<p>Valido hasta: <strong>${params.expiresAt}</strong></p>` : '<p>Sin fecha de vencimiento.</p>'}
      ${button('Ir a la tienda', APP_URL)}`
    )
  )
}

export async function sendSubscriptionExpiryEmail(params: {
  to: string
  userName: string
  productName: string
  expiresAt: string
  reminderType: '2_days' | 'expires_today'
}) {
  const subjects = {
    '2_days': `Tu suscripcion a ${params.productName} vence en 2 dias`,
    expires_today: `Tu suscripcion a ${params.productName} vence hoy`,
  }

  const messages = {
    '2_days': `Tu suscripcion vence el <strong>${params.expiresAt}</strong>. Puedes renovarla con tiempo para no perder acceso.`,
    expires_today: `Tu suscripcion vence hoy, <strong>${params.expiresAt}</strong>.`,
  }

  await sendEmail(
    params.to,
    `${subjects[params.reminderType]} - MUNDOSUBS`,
    layout(
      `Hola ${params.userName},`,
      `<p>${messages[params.reminderType]}</p>
      ${button('Renovar servicio', `${APP_URL}/dashboard`)}`
    )
  )
}
