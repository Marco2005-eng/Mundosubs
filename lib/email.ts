import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey && apiKey.startsWith('re_') ? new Resend(apiKey) : null

const FROM = 'MUNDOSUBS <no-reply@mundosubs.pe>'
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

export async function sendOrderApprovedEmail(params: {
  to: string
  userName: string
  productName: string
  expiresAt: string
  orderId: string
}) {
  await sendEmail(
    params.to,
    '¡Tu pedido fue aprobado! - MUNDOSUBS',
    `<h2>¡Hola ${params.userName}!</h2>
    <p>Tu pedido de <strong>${params.productName}</strong> ha sido aprobado.</p>
    <p>Tu acceso estará activo hasta el <strong>${params.expiresAt}</strong>.</p>
    <p><a href="${APP_URL}/dashboard">Ver mis suscripciones</a></p>`
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
    `<h2>Hola ${params.userName},</h2>
    <p>Tu pedido de <strong>${params.productName}</strong> fue rechazado.</p>
    ${params.adminNote ? `<p><strong>Motivo:</strong> ${params.adminNote}</p>` : ''}
    <p>Si tienes dudas, contáctanos por WhatsApp.</p>`
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
    '¡Tienes un descuento especial! - MUNDOSUBS',
    `<h2>¡Hola ${params.userName}!</h2>
    <p>Te hemos asignado un descuento de <strong>${params.discountPct}%</strong> en tu próxima compra.</p>
    ${params.expiresAt ? `<p>Válido hasta: <strong>${params.expiresAt}</strong></p>` : '<p>Sin fecha de vencimiento.</p>'}
    <p><a href="${APP_URL}">Ir a la tienda</a></p>`
  )
}