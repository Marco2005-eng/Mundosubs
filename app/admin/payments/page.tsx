'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  ImagePlus,
  Landmark,
  Loader2,
  QrCode,
  Save,
  Smartphone,
  Upload,
} from 'lucide-react'

type PaymentMethodId = 'bank_transfer' | 'yape' | 'plin'

interface PaymentMethod {
  id: PaymentMethodId
  title: string
  description: string | null
  enabled: boolean
  holder: string | null
  phone: string | null
  bank_name: string | null
  account_number: string | null
  cci: string | null
  instructions: string | null
  qr_path: string | null
  qr_url?: string | null
  qr_error?: string | null
  sort_order: number
}

const METHOD_META: Record<PaymentMethodId, { icon: any; color: string; bg: string }> = {
  bank_transfer: { icon: Landmark, color: 'var(--accent2)', bg: 'rgba(124,58,237,0.1)' },
  yape: { icon: Smartphone, color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  plin: { icon: QrCode, color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
}

export default function AdminPaymentsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [qrFiles, setQrFiles] = useState<Partial<Record<PaymentMethodId, File>>>({})
  const [qrPreviews, setQrPreviews] = useState<Partial<Record<PaymentMethodId, string>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const visibleCount = useMemo(() => methods.filter((method) => method.enabled).length, [methods])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    fetch('/api/admin/payment-methods', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('No se pudieron cargar los métodos')
        return res.json()
      })
      .then(({ methods }) => {
        if (active) setMethods(methods ?? [])
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        if (!active) return
        setError(err.message === 'Failed to fetch'
          ? 'No se pudo conectar con el servidor local. Recarga la pagina o reinicia npm.cmd run dev.'
          : err.message
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    return () => {
      Object.values(qrPreviews).forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [qrPreviews])

  function updateMethod(id: PaymentMethodId, patch: Partial<PaymentMethod>) {
    setMethods((current) =>
      current.map((method) => (method.id === id ? { ...method, ...patch } : method))
    )
  }

  function handleQrFile(id: PaymentMethodId, file?: File) {
    if (!file) return
    setQrFiles((current) => ({ ...current, [id]: file }))
    setQrPreviews((current) => {
      if (current[id]) URL.revokeObjectURL(current[id]!)
      return { ...current, [id]: URL.createObjectURL(file) }
    })
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const formData = new FormData()
      formData.append('methods', JSON.stringify(methods))
      Object.entries(qrFiles).forEach(([id, file]) => {
        if (file) formData.append(`qr_${id}`, file)
      })

      const res = await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        body: formData,
      })

      if (!res.ok) {
        const result = await res.json().catch(() => null)
        throw new Error(result?.error || 'No se pudo guardar')
      }

      const fresh = await fetch('/api/admin/payment-methods').then((res) => res.json())
      setMethods(fresh.methods ?? methods)
      setQrFiles({})
      setQrPreviews({})
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-payments-page" style={{ padding: '40px 5%', maxWidth: '1180px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--bg3)',
            color: 'var(--muted)',
            textDecoration: 'none'
          }}>
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
          </Link>
          <div>
            <h1 style={{
              fontFamily: "'Unbounded', sans-serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text)'
            }}>
              Métodos de pago
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Configura cuentas, números y QR visibles en checkout
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '11px 18px',
            borderRadius: '8px',
            border: 'none',
            background: saved ? 'var(--green)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: 'white',
            fontWeight: 700,
            cursor: saving || loading ? 'not-allowed' : 'pointer',
            opacity: saving || loading ? 0.75 : 1,
          }}
        >
          {saving ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> : <Save style={{ width: 16, height: 16 }} />}
          {saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>

      {error && (
        <div style={{
          marginBottom: '18px',
          padding: '12px 14px',
          borderRadius: '8px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.24)',
          color: '#ef4444',
          fontSize: '0.88rem'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '16px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Disponibles
          </p>
          <strong style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.6rem', color: 'var(--green)' }}>
            {visibleCount}/{methods.length || 3}
          </strong>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '16px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Estado
          </p>
          <strong style={{ fontSize: '1rem', color: 'var(--text)' }}>
            {loading ? 'Cargando...' : 'Conectado a Supabase'}
          </strong>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
          <Loader2 className="animate-spin" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
          Cargando métodos...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          {methods.map((method) => {
            const meta = METHOD_META[method.id]
            const Icon = meta.icon
            const qrPreview = qrPreviews[method.id] ?? method.qr_url

            return (
              <section key={method.id} style={{
                background: 'var(--card)',
                border: '1px solid var(--border2)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: meta.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon style={{ width: 21, height: 21, color: meta.color }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 700, marginBottom: '4px' }}>
                        {method.title}
                      </h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.45 }}>
                        {method.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateMethod(method.id, { enabled: !method.enabled })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 10px',
                      borderRadius: '999px',
                      border: '1px solid var(--border2)',
                      background: method.enabled ? 'rgba(34,197,94,0.12)' : 'var(--bg3)',
                      color: method.enabled ? 'var(--green)' : 'var(--muted)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {method.enabled ? <Eye style={{ width: 14, height: 14 }} /> : <EyeOff style={{ width: 14, height: 14 }} />}
                    {method.enabled ? 'Visible' : 'Oculto'}
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <label style={{ display: 'grid', gap: '6px', fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>
                    Titular
                    <input
                      value={method.holder ?? ''}
                      onChange={(e) => updateMethod(method.id, { holder: e.target.value })}
                      className="input-dark"
                      placeholder="Nombre del titular"
                    />
                  </label>

                  {method.id === 'bank_transfer' ? (
                    <>
                      <label style={{ display: 'grid', gap: '6px', fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>
                        Banco
                        <input
                          value={method.bank_name ?? ''}
                          onChange={(e) => updateMethod(method.id, { bank_name: e.target.value })}
                          className="input-dark"
                          placeholder="Ej: BCP, Interbank"
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '6px', fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>
                        Numero de cuenta
                        <input
                          value={method.account_number ?? ''}
                          onChange={(e) => updateMethod(method.id, { account_number: e.target.value })}
                          className="input-dark"
                          placeholder="Cuenta bancaria"
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '6px', fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>
                        CCI
                        <input
                          value={method.cci ?? ''}
                          onChange={(e) => updateMethod(method.id, { cci: e.target.value })}
                          className="input-dark"
                          placeholder="Cuenta interbancaria"
                        />
                      </label>
                    </>
                  ) : (
                    <label style={{ display: 'grid', gap: '6px', fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>
                      Numero
                      <input
                        value={method.phone ?? ''}
                        onChange={(e) => updateMethod(method.id, { phone: e.target.value })}
                        className="input-dark"
                        placeholder="999 999 999"
                      />
                    </label>
                  )}

                  <label style={{ display: 'grid', gap: '6px', fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>
                    Instrucciones para checkout
                    <textarea
                      value={method.instructions ?? ''}
                      onChange={(e) => updateMethod(method.id, { instructions: e.target.value })}
                      className="input-dark"
                      rows={3}
                      style={{ resize: 'vertical' }}
                    />
                  </label>
                </div>

                {method.id !== 'bank_transfer' && (
                  <div style={{
                    border: '1px dashed var(--border2)',
                    borderRadius: '10px',
                    padding: '14px',
                    background: 'var(--bg2)',
                    display: 'grid',
                    gap: '12px'
                  }}>
                    <div style={{
                      aspectRatio: '1 / 1',
                      borderRadius: '8px',
                      background: 'var(--card)',
                      border: '1px solid var(--border2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                    {qrPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrPreview} alt={`QR ${method.title}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '18px' }}>
                          <ImagePlus style={{ width: 38, height: 38, margin: '0 auto 8px' }} />
                          <span style={{ fontSize: '0.8rem' }}>Vista previa del QR</span>
                        </div>
                    )}
                  </div>
                  {method.qr_error && !qrPreviews[method.id] && (
                    <p style={{ margin: 0, color: '#ef4444', fontSize: '0.78rem', textAlign: 'center' }}>
                      El QR guardado no existe en Storage. Sube el QR nuevamente y guarda.
                    </p>
                  )}

                  <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg3)',
                      border: '1px solid var(--border2)',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}>
                      <Upload style={{ width: 16, height: 16 }} />
                      Subir QR
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        onChange={(e) => handleQrFile(method.id, e.target.files?.[0])}
                      />
                    </label>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(249,115,22,0.1)',
        border: '1px solid rgba(249,115,22,0.22)',
        borderRadius: '10px',
        color: 'var(--muted)',
        fontSize: '0.86rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <Building2 style={{ width: 18, height: 18, color: 'var(--hot)', flexShrink: 0 }} />
        <p>
          Los métodos visibles aparecerán en checkout. Los QR se guardan en Supabase Storage privado y se muestran con enlaces temporales.
        </p>
      </div>
    </div>
  )
}
