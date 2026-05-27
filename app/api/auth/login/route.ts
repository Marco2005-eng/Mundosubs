import { syncPublicUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const { email, password } = schema.parse(await req.json())
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    })

    if (error || !data.user?.email) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    const metadata = data.user.user_metadata ?? {}
    const user = {
      id: data.user.id,
      email: data.user.email,
      full_name: (metadata.full_name as string | undefined) ?? '',
      role: metadata.role === 'admin' ? 'admin' : 'cliente',
    }

    await syncPublicUserProfile({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: metadata.role === 'admin' ? 'admin' : undefined,
    }).catch((syncError) => console.warn('Login profile sync failed:', syncError))

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
