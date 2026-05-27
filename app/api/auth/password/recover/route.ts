import { createClient } from '@/lib/supabase/server'
import { allowedEmailDomainMessage, hasAllowedEmailDomain } from '@/lib/email-validation'
import { NextResponse } from 'next/server'
import { z } from 'zod'

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
    const supabase = createClient()
    const origin = getOrigin(req)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No se pudo enviar el correo de recuperacion' },
      { status: 400 }
    )
  }
}
