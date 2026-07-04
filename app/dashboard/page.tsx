import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscriptionStatus } from '@/components/SubscriptionStatus'
import { DiscountBadge } from '@/components/DiscountBadge'
import { AccessDetailsList } from '@/components/AccessDetailsList'
import { RenewSubscriptionButton } from '@/components/RenewSubscriptionButton'
import { DashboardTabs } from '@/components/DashboardTabs'
import Link from 'next/link'
import { ArrowRight, Plus, History, User, Upload, Clock } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { formatPEN } from '@/lib/utils'

export default async function DashboardPage() {
  const user = await getSession()
  if (!user) redirect('/auth/login')

  // Use service client to bypass RLS for reading subscriptions
  const supabase = createServiceClient()

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*, products(name, category)')
    .eq('user_id', user.id)
    .order('expires_at', { ascending: false })

  if (error) {
    console.error('Error fetching subscriptions:', error)
  }

  const subList = subscriptions ?? []
  const now = new Date()

  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('id, created_at, amount, order_type, products(name, category)')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const { data: accessItems } = await supabase
    .from('subscription_access')
    .select(`
      id,
      login_url,
      account_email,
      account_password,
      profile_name,
      profile_pin,
      login_code,
      notes,
      products(name, category),
      subscriptions(expires_at)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '40px 5%' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '32px' 
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Unbounded', sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '4px'
          }}>
            Mi cuenta
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Bienvenido de vuelta 👋
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/dashboard/profile" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border2)',
            background: 'var(--bg3)',
            color: 'var(--text)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500
          }}>
            <User className="h-4 w-4" /> Perfil
          </Link>
          <Link href="/dashboard/history" className="btn-secondary" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border2)',
            background: 'var(--bg3)',
            color: 'var(--text)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500
          }}>
            <History className="h-4 w-4" /> Historial
          </Link>
        </div>
      </div>

      {/* User Info */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--hot))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Unbounded', sans-serif",
          fontSize: '1.2rem',
          fontWeight: 700,
          color: 'white'
        }}>
          {(user.full_name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 600, color: 'var(--text)' }}>
            {user.full_name || 'Usuario'}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            {user.email}
          </p>
        </div>
      </div>

      <DashboardTabs pendingOrders={pendingOrders || []} accessItems={accessItems || []} subscriptions={subscriptions || []} />
    </div>
  )
}
