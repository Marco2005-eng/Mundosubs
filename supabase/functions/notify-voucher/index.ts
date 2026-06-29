import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'admin@mundosubs.net.pe'
const APP_URL = Deno.env.get('APP_URL') ?? 'https://mundosubs.net.pe'
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'MUNDOSUBS <no-reply@mundosubs.net.pe>'

serve(async (req) => {
  const { record } = await req.json()
  const orderId = record?.order_id

  if (!orderId) return new Response('no order_id', { status: 400 })

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: 'Nuevo comprobante recibido',
      html: `<p>Se subio un nuevo comprobante.</p>
             <p><a href="${APP_URL}/admin/vouchers/${orderId}">Revisar pedido</a></p>`,
    }),
  })

  return new Response('ok')
})

