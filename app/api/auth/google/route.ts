import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getOrigin(req: Request) {
  const url = new URL(req.url)
  const forwardedHost = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto')

  if (forwardedHost) {
    return `${forwardedProto ?? 'https'}://${forwardedHost}`
  }

  return url.origin
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const next = url.searchParams.get('next') || '/'
  const origin = getOrigin(req)
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  })

  if (error || !data.url) {
    const loginUrl = new URL('/auth/login', origin)
    loginUrl.searchParams.set('error', error?.message || 'google')
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(data.url)
}
