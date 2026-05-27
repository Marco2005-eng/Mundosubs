import { createAdminClient, createClient, createServiceClient } from '@/lib/supabase/server'

export interface User {
  id: string
  email: string
  full_name: string
  role: string
}

function normalizeRole(...roles: Array<string | null | undefined>) {
  return roles.some((role) => role === 'admin') ? 'admin' : 'cliente'
}

export async function syncPublicUserProfile(input: {
  id: string
  email: string
  fullName?: string | null
  role?: string | null
}) {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const fullName = input.fullName ?? ''

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', input.id)
    .maybeSingle()

  const role = normalizeRole(input.role, existingProfile?.role)

  await supabase
    .from('profiles')
    .upsert({
      id: input.id,
      email: input.email.toLowerCase(),
      full_name: fullName || existingProfile?.full_name || '',
      role,
      updated_at: now,
    }, { onConflict: 'id' })
    .then(({ error }) => {
      if (error) console.warn('Profile sync skipped:', error.message)
    })
}

export async function getSession(): Promise<User | null> {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.email) return null

  const serviceSupabase = createServiceClient()
  const { data: publicUser } = await serviceSupabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  const metadata = user.user_metadata ?? {}
  const role = normalizeRole(metadata.role as string | undefined, publicUser?.role)
  const fullName = publicUser?.full_name ?? (metadata.full_name as string | undefined) ?? ''

  if (!publicUser) {
    await syncPublicUserProfile({
      id: user.id,
      email: user.email,
      fullName,
      role,
    }).catch((syncError) => console.warn('User profile sync failed:', syncError))
  }

  return {
    id: user.id,
    email: publicUser?.email ?? user.email,
    full_name: fullName,
    role,
  }
}

export async function requireAuth() {
  const user = await getSession()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin() {
  const user = await getSession()
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return user
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}
