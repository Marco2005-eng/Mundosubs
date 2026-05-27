import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user } = await updateSession(request)

  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/')

  if (isPublicRoute) {
    return supabaseResponse
  }

  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')

  if (!isProtectedRoute) {
    return supabaseResponse
  }

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
