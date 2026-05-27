import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(6, 'Minimo 6 caracteres'),
})

export async function PUT(req: Request) {
  try {
    const { password } = schema.parse(await req.json())
    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'El enlace expiro o no es valido' }, { status: 401 })
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No se pudo actualizar la contrasena' },
      { status: 400 }
    )
  }
}
