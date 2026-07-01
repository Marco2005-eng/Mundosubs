import { createAdminClient } from '@/lib/supabase/server'
import { allowedEmailDomainMessage, hasAllowedEmailDomain } from '@/lib/email-validation'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendPasswordRecoveryEmail } from '@/lib/email'

const schema = z.object({
  email: z.string().email().refine(hasAllowedEmailDomain, allowedEmailDomainMessage),
})

function getOrigin(req: Request) {
  const url = new URL(req.url)
  const forwardedHost = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto')

  if (forwardedHost) return `${forwardedProto ?? 'https'}://${forwardedHost}`
  return process.env.NEXT_PUBLIC_APP_URL ?? url.origin
}

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json())
    const supabaseAdmin = createAdminClient()
    const origin = getOrigin(req)
    const targetEmail = email.trim().toLowerCase()

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: targetEmail,
      options: {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data?.properties?.action_link) {
      await sendPasswordRecoveryEmail({
        to: targetEmail,
        resetLink: data.properties.action_link
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No se pudo enviar el correo de recuperacion' },
      { status: 400 }
    )
  }
}
