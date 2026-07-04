'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload, Clock, Plus } from 'lucide-react'
import { formatPEN } from '@/lib/utils'
import { SubscriptionStatus } from '@/components/SubscriptionStatus'
import { RenewSubscriptionButton } from '@/components/RenewSubscriptionButton'
import { AccessDetailsList } from '@/components/AccessDetailsList'

export function DashboardTabs({ pendingOrders, accessItems, subscriptions }: { pendingOrders: any[], accessItems: any[], subscriptions: any[] }) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'suscripciones' | 'credenciales'>('resumen')
  const now = new Date()

  return (
    <div className="mt-8">
      {/* Tab Navigation */}
      <div className="flex border-b border-border mb-8 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'resumen'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('suscripciones')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'suscripciones'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Suscripciones & Pagos
        </button>
        <button
          onClick={() => setActiveTab('credenciales')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'credenciales'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Mis Credenciales
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'resumen' && (
          <div className="space-y-8">
            <p className="text-muted-foreground text-sm">Vista rápida de tu cuenta.</p>
            {pendingOrders?.length > 0 && (
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-orange-500 font-semibold mb-2">¡Tienes {pendingOrders.length} pago(s) pendiente(s)!</p>
                <p className="text-sm text-orange-400/80">Recuerda subir tu comprobante en la pestaña de <b>Suscripciones & Pagos</b> para evitar perder tu servicio.</p>
              </div>
            )}
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold text-lg mb-1">Suscripciones</h3>
                <p className="text-3xl font-black text-accent">{subscriptions?.length || 0}</p>
                <p className="text-muted-foreground text-sm mt-1">Servicios activos en tu cuenta</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold text-lg mb-1">Credenciales</h3>
                <p className="text-3xl font-black text-accent">{accessItems?.length || 0}</p>
                <p className="text-muted-foreground text-sm mt-1">Cuentas con acceso asignado</p>
              </div>
            </div>
            
            <div className="mt-4">
              <Link href="/#catalog" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                <Plus className="mr-2 h-4 w-4" /> Agregar más servicios
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'suscripciones' && (
          <div className="space-y-10">
            {/* Pending Orders */}
            {pendingOrders?.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                    Pagos pendientes
                  </h2>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {pendingOrders.map((order: any) => (
                    <div key={order.id} style={{ background: 'var(--card)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(249,115,22,0.12)', display: 'grid', placeItems: 'center', color: 'var(--hot)' }}>
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.95rem' }}>
                            {order.order_type === 'renewal' ? 'Renovacion' : 'Pedido'}: {order.products?.name || 'Pedido pendiente'}
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                            {formatPEN(order.amount)} · Pedido #{order.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                      <Link href={`/checkout/${order.id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: 'white', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
                        <Upload className="h-4 w-4" />
                        Subir comprobante
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Subscriptions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                  Mis suscripciones activas
                </h2>
                <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
              </div>
              {!subscriptions?.length ? (
                <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📦</div>
                  <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>No tienes suscripciones activas.</p>
                  <Link href="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Plus className="h-4 w-4" /> Explorar servicios
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {subscriptions.map((sub) => {
                    const expiresAt = new Date(sub.expires_at)
                    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000)
                    const isExpired = daysLeft < 0
                    const isExpiringSoon = daysLeft >= 0 && daysLeft <= 5

                    return (
                      <div key={sub.id} style={{ background: 'var(--card)', border: isExpired ? '1px solid rgba(239,68,68,0.32)' : isExpiringSoon ? '1px solid rgba(249,115,22,0.36)' : '1px solid var(--border2)', borderRadius: '12px', padding: '20px', transition: 'all 0.2s', display: 'grid', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', background: 'rgba(124,58,237,0.15)', color: 'var(--accent2)' }}>
                            {sub.products?.category}
                          </span>
                          <SubscriptionStatus expiresAt={sub.expires_at} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{sub.products?.name}</h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{sub.products?.category}</p>
                        </div>
                        <div style={{ borderRadius: '10px', background: isExpired ? 'rgba(239,68,68,0.08)' : isExpiringSoon ? 'rgba(249,115,22,0.09)' : 'var(--bg2)', border: '1px solid var(--border2)', padding: '10px 12px', display: 'grid', gap: '4px' }}>
                          <span style={{ color: 'var(--text)', fontSize: '0.8rem', fontWeight: 800 }}>
                            {isExpired ? 'Suscripcion vencida' : isExpiringSoon ? `Vence en ${daysLeft === 0 ? 'hoy' : `${daysLeft} dia${daysLeft === 1 ? '' : 's'}`}` : `Activa hasta ${expiresAt.toLocaleDateString('es-PE')}`}
                          </span>
                          <span style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>
                            {isExpired ? 'Puedes reactivarla creando un nuevo pago.' : 'Si renuevas antes de vencer, conservas los días restantes.'}
                          </span>
                        </div>
                        <RenewSubscriptionButton subscriptionId={sub.id} label={isExpired ? 'Reactivar' : 'Renovar'} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'credenciales' && (
          <div className="space-y-8">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                Accesos de mis servicios
              </h2>
              <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
            </div>
            {accessItems?.length > 0 ? (
              <AccessDetailsList items={accessItems} />
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
                Aún no tienes credenciales asignadas.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
