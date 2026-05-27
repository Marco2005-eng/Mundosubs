'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CartDrawerWrapper } from '@/app/CartDrawerWrapper'
import { LogIn, LogOut, Menu, X, Home, User, Settings, Crown, History } from 'lucide-react'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Try to get user from localStorage first
    let storedUser = null
    try {
      const stored = localStorage.getItem('user')
      if (stored) storedUser = JSON.parse(stored)
    } catch (e) {}
    
    if (storedUser) setUser(storedUser)

    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('No session')
        return res.json()
      })
      .then(({ user }) => {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user))
          setUser(user)
        } else {
          localStorage.removeItem('user')
          setUser(null)
        }
      })
      .catch(() => {
        localStorage.removeItem('user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const isAdmin = user?.role === 'admin'
  const isAuthPage = pathname?.startsWith('/auth/') || false

  const handleSignOut = async () => {
    console.log('Cerrando sesión...')
    try { 
      await fetch('/api/auth/logout', { method: 'POST' }) 
    } catch (e) {
      console.error('Error en logout:', e)
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      window.location.href = '/'
    }
  }

  const showHeader = !isAuthPage

  const navItems = [
    { href: '/', label: 'Catálogo', icon: Home },
    ...(user ? [
      { href: '/dashboard', label: 'Mi cuenta', icon: User },
      { href: '/dashboard/history', label: 'Historial', icon: History },
      { href: '/dashboard/profile', label: 'Perfil', icon: Settings },
    ] : []),
    ...(isAdmin ? [
      { href: '/admin', label: 'Admin', icon: Crown },
    ] : []),
  ]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {showHeader && (
        <header className="app-header" style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 5%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Logo */}
          <Link href="/" className="app-logo" style={{
            fontFamily: "'Unbounded', sans-serif",
            fontSize: '1.2rem',
            fontWeight: 900,
            background: 'linear-gradient(90deg, #a855f7, #f97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
            flexShrink: 0
          }}>
            MUNDOSUBS
          </Link>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px'
          }}>
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                style={{
                  color: pathname === item.href || pathname?.startsWith(item.href + '/') ? 'var(--text)' : 'var(--muted)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="desktop-actions" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <CartDrawerWrapper />
            <ThemeToggle />
            {user ? (
              <button onClick={handleSignOut} style={{
                background: 'var(--bg3)',
                border: '1px solid var(--border2)',
                color: 'var(--text)',
                fontSize: '0.85rem',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <LogOut style={{ width: 14, height: 14 }} /> <span className="desktop-only">Salir</span>
              </button>
            ) : (
              <Link href="/auth/login" style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <LogIn style={{ width: 14, height: 14 }} /> <span className="desktop-only">Ingresar</span>
              </Link>
            )}
          </div>

          <div className="mobile-header-actions" style={{
            display: 'none',
            alignItems: 'center',
            gap: '6px',
            marginLeft: 'auto'
          }}>
            <CartDrawerWrapper />
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--text)'
            }}
          >
            {mobileMenuOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: '60px',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            display: 'none'
          }}
        />
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu" style={{
          position: 'fixed',
          top: '60px',
          right: 0,
          width: '280px',
          maxWidth: '80vw',
          height: 'calc(100vh - 60px)',
          background: 'var(--card)',
          borderLeft: '1px solid var(--border2)',
          padding: '20px',
          zIndex: 100,
          display: 'none',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px',
            marginBottom: '16px'
          }}>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: pathname === item.href ? 'var(--accent)' : 'var(--text)',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: pathname === item.href ? 'rgba(124,58,237,0.1)' : 'transparent'
                  }}
                >
                  <Icon style={{ width: 20, height: 20 }} />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div style={{ 
            borderTop: '1px solid var(--border2)', 
            paddingTop: '16px',
            marginTop: 'auto'
          }}>
            {user ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px' 
              }}>
                <div style={{ 
                  padding: '12px 16px',
                  background: 'var(--bg3)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                    {user.full_name || 'Usuario'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {user.email}
                  </div>
                </div>
                <button onClick={handleSignOut} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444',
                  fontSize: '0.9rem',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>
                  <LogOut style={{ width: 18, height: 18 }} /> Cerrar sesión
                </button>
              </div>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '12px 16px',
                borderRadius: '8px',
                textDecoration: 'none'
              }}>
                <LogIn style={{ width: 18, height: 18 }} /> Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      )}

      <main className="app-main" style={{ padding: '30px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav, .desktop-actions, .desktop-only {
            display: none !important;
          }
          .app-header {
            gap: 8px !important;
            padding: 10px 14px !important;
          }
          .app-logo {
            font-size: 1rem !important;
          }
          .mobile-header-actions {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .mobile-menu, .mobile-overlay {
            display: flex !important;
          }
          .app-main {
            padding: 14px 0 28px !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  )
}
