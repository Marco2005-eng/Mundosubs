import { requireAdmin, syncPublicUserProfile } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['cliente', 'admin']).default('cliente'),
})

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible en produccion' }, { status: 404 })
  }

  const admin = await requireAdmin().catch(() => null)
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { email, password, name, role } = schema.parse(await request.json())
  const supabase = createAdminClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      role,
      full_name: name,
    },
  })

  if (error || !data.user?.email) {
    return NextResponse.json({ error: error?.message ?? 'No se pudo crear usuario' }, { status: 400 })
  }

  await syncPublicUserProfile({
    id: data.user.id,
    email: data.user.email,
    fullName: name,
    role,
  })

  return NextResponse.json({ user: data.user })
}
