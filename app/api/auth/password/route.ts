import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

export async function PUT(req: Request) {
  try {
    const user = await requireAuth()
    const { currentPassword, newPassword } = schema.parse(await req.json())
    const supabase = createClient()

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (verifyError) {
      return NextResponse.json({ error: 'La contrasena actual es incorrecta' }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: error.message || 'Error del servidor' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
