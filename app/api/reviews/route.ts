import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: reviews, error } = await supabase
    .from('resena_user_public')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reviews })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { rating, comment } = await req.json()

    if (
      typeof rating !== 'number' ||
      rating < 1 ||
      rating > 5 ||
      !comment ||
      typeof comment !== 'string' ||
      comment.trim().length === 0
    ) {
      return NextResponse.json({ error: 'Datos de reseña inválidos' }, { status: 400 })
    }

    // Obtener información adicional del perfil del usuario para sincronizar
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Cliente de MUNDOSUBS'
    const userEmail = profile?.email || user.email || ''
    const userAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null

    const { data: review, error: insertError } = await supabase
      .from('resena_user_public')
      .insert({
        user_id: user.id,
        user_name: userName,
        user_email: userEmail,
        user_avatar: userAvatar,
        rating,
        comment: comment.trim(),
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ review })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}
