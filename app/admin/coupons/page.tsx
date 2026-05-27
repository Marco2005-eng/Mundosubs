'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Ticket } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: '',
    label: '',
    pct: 10,
    maxRedemptions: 5,
    expiresAt: '',
    publishAnnouncement: true,
  })

  async function loadCoupons() {
    const supabase = createClient()
    const { data } = await supabase
      .from('coupons')
      .select('id, code, status, max_redemptions, redeemed_count, expires_at, discounts(label, pct)')
      .order('created_at', { ascending: false })
    setCoupons(data ?? [])
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
    setForm({ code: '', label: '', pct: 10, maxRedemptions: 5, expiresAt: '', publishAnnouncement: true })
    loadCoupons()
  }

  return (
    <div style={{ padding: '40px 5%', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <Link href="/admin" style={{
          display: 'grid',
          placeItems: 'center',
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'var(--bg3)',
          color: 'var(--muted)',
        }}>
          <ArrowLeft style={{ width: 18, height: 18 }} />
        </Link>
        <div>
          <h1 style={{ fontFamily: "'Unbounded', sans-serif", color: 'var(--text)', fontSize: '1.5rem', fontWeight: 800 }}>
            Cupones
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Codigos canjeables al crear un pedido</p>
        </div>
      </div>

      <form onSubmit={submit} style={{
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        borderRadius: 12,
        padding: 20,
        display: 'grid',
        gap: 14,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus style={{ width: 18, height: 18, color: 'var(--accent2)' }} />
          <strong style={{ color: 'var(--text)' }}>Crear cupon</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Field label="Codigo">
            <input className="input-dark" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="MUNDOSUBS10" required />
          </Field>
          <Field label="Nombre interno">
            <input className="input-dark" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Promo mensual" required />
          </Field>
          <Field label="Descuento (%)">
            <input className="input-dark" type="number" value={form.pct} onChange={(e) => setForm({ ...form, pct: Number(e.target.value) })} min={1} max={100} required />
          </Field>
          <Field label="Limite de canjes">
            <input className="input-dark" type="number" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: Number(e.target.value) })} min={1} required />
          </Field>
          <Field label="Vence">
            <input className="input-dark" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </Field>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontSize: '0.86rem' }}>
          <input type="checkbox" checked={form.publishAnnouncement} onChange={(e) => setForm({ ...form, publishAnnouncement: e.target.checked })} />
          Mostrar como novedad en el inicio
        </label>
        <button disabled={loading} style={{
          justifySelf: 'start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 16px',
          borderRadius: 8,
          border: 'none',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          color: 'white',
          fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> : <Ticket style={{ width: 16, height: 16 }} />}
          Crear cupon
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {coupons.map((coupon) => {
          const discount = Array.isArray(coupon.discounts) ? coupon.discounts[0] : coupon.discounts
          return (
            <article key={coupon.id} style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 12, padding: 16 }}>
              <div style={{ color: 'var(--accent2)', fontFamily: "'Unbounded', sans-serif", fontWeight: 900, marginBottom: 6 }}>
                {coupon.code}
              </div>
              <div style={{ color: 'var(--text)', fontWeight: 800 }}>{discount?.label ?? 'Cupon'}</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 6 }}>
                {discount?.pct ?? 0}% OFF - {coupon.redeemed_count}/{coupon.max_redemptions} canjes
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 6, color: 'var(--text)', fontSize: '0.84rem', fontWeight: 700 }}>
      {label}
      {children}
    </label>
  )
}
