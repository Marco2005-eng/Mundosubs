import { requireAuth, syncPublicUserProfile } from '@/lib/auth'
import { createAdminClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  full_name: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export async function GET() {
  try {
    const sessionUser = await requireAuth()
    const supabase = createServiceClient()
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, address, role, created_at')
      .eq('id', sessionUser.id)
      .limit(1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const user = users?.[0] ?? {
      id: sessionUser.id,
      email: sessionUser.email,
      full_name: sessionUser.full_name,
      phone: '',
      address: '',
      role: sessionUser.role,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No autenticado' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const sessionUser = await requireAuth()
    const body = await req.json()
    const { full_name, fullName, phone, address } = schema.parse(body)
    const resolvedName = full_name ?? fullName

    const supabase = createServiceClient()
    const updateData: Record<string, string> = { updated_at: new Date().toISOString() }
    if (resolvedName !== undefined) updateData.full_name = resolvedName
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address

    const { data: updatedUsers, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', sessionUser.id)
      .select('id, email, full_name, phone, address, role, created_at')
      .limit(1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let updatedUser = updatedUsers?.[0]

    if (!updatedUser) {
      await syncPublicUserProfile({
        id: sessionUser.id,
        email: sessionUser.email,
        fullName: resolvedName ?? sessionUser.full_name,
        role: sessionUser.role,
      })

      const { data: createdUsers, error: retryError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', sessionUser.id)
        .select('id, email, full_name, phone, address, role, created_at')
        .limit(1)

      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 })
      }

      updatedUser = createdUsers?.[0]
    }

    if (!updatedUser) {
      return NextResponse.json({ error: 'No se pudo actualizar el perfil' }, { status: 500 })
    }

    const adminSupabase = createAdminClient()
    if (resolvedName !== undefined) {
      await adminSupabase.auth.admin.updateUserById(sessionUser.id, {
        user_metadata: {
          full_name: resolvedName,
          role: updatedUser.role,
        },
      })
    }

    await supabase.from('profiles').upsert({
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      role: updatedUser.role,
      phone: updatedUser.phone,
      address: updatedUser.address,
      updated_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.warn('Optional profile contact sync skipped:', error.message)
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: error.message || 'Error del servidor' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
