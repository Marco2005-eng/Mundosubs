import { syncPublicUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { allowedEmailDomainMessage, hasAllowedEmailDomain } from '@/lib/email-validation'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email().refine(hasAllowedEmailDomain, allowedEmailDomainMessage),
  password: z.string().min(6),
  fullName: z.string().min(2),
})

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = schema.parse(await req.json())
    const normalizedEmail = email.toLowerCase()
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'cliente',
        },
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user?.email) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      )
    }

    const user = {
      id: data.user.id,
      email: data.user.email,
      full_name: fullName,
      role: 'cliente',
    }

    await syncPublicUserProfile({
      id: user.id,
      email: user.email,
      fullName,
      role: user.role,
    }).catch((syncError) => console.warn('Register profile sync failed:', syncError))

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: error.message || 'Error del servidor' },
      { status: 500 }
    )
  }
}
