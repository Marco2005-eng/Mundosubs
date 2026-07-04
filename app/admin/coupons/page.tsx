'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Plus, Ticket, CheckCircle, XCircle,
  Clock, BarChart2, Megaphone, RefreshCw, Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Coupon = {
  id: string
  code: string
  status: string
  max_redemptions: number
  redeemed_count: number
  expires_at: string | null
  starts_at: string | null
  discounts: { label: string; pct: number } | { label: string; pct: number }[] | null
  announcements?: { id: string; active: boolean }[] | null
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    code: '',
    label: '',
    pct: 10,
    maxRedemptions: 50,
    expiresAt: '',
    publishAnnouncement: true,
  })

  async function loadCoupons() {
    setFetching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('coupons')
      .select('id, code, status, max_redemptions, redeemed_count, expires_at, starts_at, discounts(label, pct), announcements(id, active)')
      .order('created_at', { ascending: false })
    setCoupons(data ?? [])
    setFetching(false)
  }

  useEffect(() => { loadCoupons() }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        code: form.code.trim().toUpperCase(),
        startsAt: null,
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      }),
    })
    setLoading(false)
    if (!res.ok) return
    setForm({ code: '', label: '', pct: 10, maxRedemptions: 50, expiresAt: '', publishAnnouncement: true })
    setShowForm(false)
    loadCoupons()
  }

  async function toggleStatus(coupon: Coupon) {
    const supabase = createClient()
    const next = coupon.status === 'active' ? 'disabled' : 'active'
    
    // Solo cambiar el estado visual localmente
    setCoupons((prev) => prev.map(c => c.id === coupon.id ? { ...c, status: next } : c))
    
    await supabase.from('coupons').update({ status: next }).eq('id', coupon.id)
    loadCoupons()
  }

  const activeCoupons   = coupons.filter((c) => c.status === 'active')
  const inactiveCoupons = coupons.filter((c) => c.status !== 'active')

  return (
    <div style={{ padding: '36px 5%', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin" style={{
            display: 'grid', placeItems: 'center', width: 36, height: 36,
            borderRadius: 8, background: 'var(--bg3)', color: 'var(--muted)', textDecoration: 'none',
          }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div>
            <h1 style={{ fontFamily: "'Unbounded', sans-serif", color: 'var(--text)', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
              Cupones
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '2px 0 0' }}>
              {activeCoupons.length} activos · {coupons.length} total
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', borderRadius: 9,
            background: showForm ? 'var(--bg3)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: showForm ? 'var(--text)' : 'white',
            border: showForm ? '1px solid var(--border2)' : 'none',
            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancelar' : <><Plus style={{ width: 16, height: 16 }} /> Nuevo cupón</>}
        </button>
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <form onSubmit={submit} style={{
          background: 'var(--card)', border: '1px solid var(--border2)',
          borderRadius: 14, padding: 24, marginBottom: 24, display: 'grid', gap: 16,
        }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
            Crear nuevo cupón
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            <Field label="Código">
              <input
                className="input-dark"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="MUNDOSUBS10"
                required
              />
            </Field>
            <Field label="Nombre interno">
              <input
                className="input-dark"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Promo bienvenida"
                required
              />
            </Field>
            <Field label="Descuento (%)">
              <input
                className="input-dark"
                type="number"
                value={form.pct}
                onChange={(e) => setForm({ ...form, pct: Number(e.target.value) })}
                min={1} max={100} required
              />
            </Field>
            <Field label="Límite de usos">
              <input
                className="input-dark"
                type="number"
                value={form.maxRedemptions}
                onChange={(e) => setForm({ ...form, maxRedemptions: Number(e.target.value) })}
                min={1} required
              />
            </Field>
            <Field label="Vence (opcional)">
              <input
                className="input-dark"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </Field>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.publishAnnouncement}
              onChange={(e) => setForm({ ...form, publishAnnouncement: e.target.checked })}
            />
            <Megaphone style={{ width: 14, height: 14, color: 'var(--accent2)' }} />
            Publicar como novedad en el inicio del sitio
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 9, border: 'none',
              background: 'var(--green)', color: 'white', fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? <><Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> Creando…</>
              : <><Ticket style={{ width: 16, height: 16 }} /> Crear cupón</>}
          </button>
        </form>
      )}

      {/* ── Stats bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Activos', value: activeCoupons.length, color: 'var(--green)' },
          { label: 'Total usos', value: coupons.reduce((s, c) => s + c.redeemed_count, 0), color: 'var(--accent2)' },
          { label: 'Inactivos', value: inactiveCoupons.length, color: 'var(--muted)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--card)', border: '1px solid var(--border2)',
            borderRadius: 12, padding: '14px 18px',
          }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
            <strong style={{ fontSize: '1.6rem', color, fontFamily: "'Unbounded', sans-serif" }}>{value}</strong>
          </div>
        ))}
      </div>

      {/* ── Coupons list ── */}
      {fetching ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: 'var(--muted)' }} />
        </div>
      ) : !coupons.length ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border2)',
          borderRadius: 14, padding: 60, textAlign: 'center',
        }}>
          <Ticket style={{ width: 40, height: 40, opacity: 0.2, marginBottom: 12 }} />
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>No hay cupones creados aún</p>
          <button
            onClick={() => setShowForm(true)}
            style={{ color: 'var(--accent2)', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {coupons.map((coupon) => {
            const discount = Array.isArray(coupon.discounts) ? coupon.discounts[0] : coupon.discounts
            const pct = discount?.pct ?? 0
            const isActive = coupon.status === 'active'
            const isFull = coupon.redeemed_count >= coupon.max_redemptions
            const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false
            const effective = isActive && !isFull && !isExpired
            const progress = Math.round((coupon.redeemed_count / coupon.max_redemptions) * 100)

            return (
              <div key={coupon.id} style={{
                background: 'var(--card)', border: '1px solid var(--border2)',
                borderRadius: 14, padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 16, alignItems: 'center',
                opacity: effective ? 1 : 0.6,
              }}>
                {/* Code badge */}
                <div style={{
                  background: effective ? 'rgba(124,58,237,0.12)' : 'var(--bg2)',
                  border: `1px solid ${effective ? 'rgba(124,58,237,0.25)' : 'var(--border2)'}`,
                  borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 100,
                }}>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Código</p>
                  <strong style={{
                    fontFamily: "'Unbounded', sans-serif", fontSize: '0.9rem',
                    color: effective ? 'var(--accent2)' : 'var(--muted)', letterSpacing: '1px',
                  }}>
                    {coupon.code}
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 900, color: effective ? 'var(--green)' : 'var(--muted)' }}>
                    {pct}% OFF
                  </p>
                </div>

                {/* Details */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{discount?.label ?? 'Cupón'}</strong>
                    <StatusBadge active={isActive} full={isFull} expired={isExpired} />
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 3 }}>
                      <span>{coupon.redeemed_count} de {coupon.max_redemptions} usos</span>
                      <span>{progress}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: 'var(--bg2)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${Math.min(progress, 100)}%`,
                        background: isFull ? '#ef4444' : progress > 70 ? '#f97316' : 'var(--green)',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>

                  {coupon.expires_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', color: 'var(--muted)' }}>
                      <Clock style={{ width: 12, height: 12 }} />
                      Vence: {new Date(coupon.expires_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  {isExpired ? (
                    <button
                      disabled
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 7, cursor: 'not-allowed',
                        border: '1px solid var(--border2)', background: 'var(--bg2)',
                        color: 'var(--muted)',
                        fontSize: '0.76rem', fontWeight: 700,
                        opacity: 0.5,
                      }}
                    >
                      <XCircle style={{ width: 13, height: 13 }} /> Vencido
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleStatus(coupon)}
                      title={isActive ? 'Desactivar' : 'Activar'}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                        border: '1px solid var(--border2)', background: 'var(--bg2)',
                        color: isActive ? '#ef4444' : 'var(--green)',
                        fontSize: '0.76rem', fontWeight: 700,
                      }}
                    >
                      {isActive
                        ? <><XCircle style={{ width: 13, height: 13 }} /> Pausar</>
                        : <><CheckCircle style={{ width: 13, height: 13 }} /> Activar</>}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ active, full, expired }: { active: boolean; full: boolean; expired: boolean }) {
  if (!active)  return <Badge color="#64748b">Pausado</Badge>
  if (expired)  return <Badge color="#ef4444">Vencido</Badge>
  if (full)     return <Badge color="#f97316">Agotado</Badge>
  return <Badge color="var(--green)">Activo</Badge>
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: `${color}1a`, color, border: `1px solid ${color}33`,
    }}>
      {children}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 5, color: 'var(--text)', fontSize: '0.83rem', fontWeight: 700 }}>
      {label}
      {children}
    </label>
  )
}
