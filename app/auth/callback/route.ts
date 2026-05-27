import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { syncPublicUserProfile } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/login?error=callback', request.url))
    }

    const user = data.user
    if (user?.email) {
      const metadata = user.user_metadata ?? {}
      await syncPublicUserProfile({
        id: user.id,
        email: user.email,
        fullName: (metadata.full_name as string | undefined) ?? (metadata.name as string | undefined) ?? '',
        role: metadata.role === 'admin' ? 'admin' : undefined,
      }).catch((syncError) => console.warn('Google callback profile sync failed:', syncError))

      const providers = user.app_metadata?.providers as string[] | undefined
      const isGoogleUser = user.app_metadata?.provider === 'google' || providers?.includes('google')
      const passwordAlreadySet = metadata.password_set === true
      const isPasswordRecovery = next.startsWith('/auth/reset-password')

      if (isGoogleUser && !passwordAlreadySet && !isPasswordRecovery) {
        const setPasswordUrl = new URL('/auth/set-password', request.url)
        setPasswordUrl.searchParams.set('next', next)
        return NextResponse.redirect(setPasswordUrl)
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
