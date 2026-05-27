import { requireAdmin, syncPublicUserProfile } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

export async function POST(request: Request) {
  const currentAdmin = await requireAdmin().catch(() => null)
  if (!currentAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { email, password, name } = schema.parse(await request.json())
    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: 'admin',
      },
    })

    if (error || !data.user?.email) {
      return NextResponse.json({ error: error?.message ?? 'No se pudo crear el admin' }, { status: 400 })
    }

    await syncPublicUserProfile({
      id: data.user.id,
      email: data.user.email,
      fullName: name,
      role: 'admin',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
