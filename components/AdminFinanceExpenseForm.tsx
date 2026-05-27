'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatPEN } from '@/lib/utils'

type Expense = {
  id: string
  label: string
  category: string
  amount: number | string
  occurred_at: string
  vendor?: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  service_purchase: 'Compra de servicio',
  operations: 'Operacion',
  marketing: 'Marketing',
  refund: 'Devolucion',
  other: 'Otro',
}

export function AdminFinanceExpenseForm({ expenses }: { expenses: Expense[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(formData: FormData) {
    setLoading(true)
    setError('')

    const payload = {
      label: String(formData.get('label') || ''),
      category: String(formData.get('category') || 'service_purchase'),
      amount: Number(formData.get('amount') || 0),
      occurred_at: String(formData.get('occurred_at') || new Date().toISOString().slice(0, 10)),
      vendor: String(formData.get('vendor') || ''),
      notes: String(formData.get('notes') || ''),
    }

    const res = await fetch('/api/admin/finance-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(typeof data.error === 'string' ? data.error : 'No se pudo guardar el egreso')
      return false
    }

    router.refresh()
    return true
  }

  async function remove(id: string) {
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/finance-expenses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(typeof data.error === 'string' ? data.error : 'No se pudo eliminar el egreso')
      return
    }

    router.refresh()
  }

  return (
    <section className="finance-expense-grid">
      <form onSubmit={(event) => {
        event.preventDefault()
        const form = event.currentTarget
        submit(new FormData(form)).then((ok) => {
          if (ok) form.reset()
        })
      }} className="finance-panel finance-expense-form">
        <div>
          <h2 className="finance-panel-title">Registrar egreso</h2>
          <p className="finance-panel-text">Compra de cuentas, marketing, devoluciones u otros costos.</p>
        </div>

        <label className="finance-field">
          Descripcion
          <input name="label" className="input-dark" placeholder="Ej: Compra Netflix familiar" required />
        </label>

        <div className="finance-form-row">
          <label className="finance-field">
            Categoria
            <select name="category" className="input-dark" defaultValue="service_purchase">
              <option value="service_purchase">Compra de servicio</option>
              <option value="operations">Operacion</option>
              <option value="marketing">Marketing</option>
              <option value="refund">Devolucion</option>
              <option value="other">Otro</option>
            </select>
          </label>

          <label className="finance-field">
            Monto
            <input name="amount" className="input-dark" type="number" min="0.01" step="0.01" placeholder="0.00" required />
          </label>
        </div>

        <div className="finance-form-row">
          <label className="finance-field">
            Fecha
            <input name="occurred_at" className="input-dark" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          </label>

          <label className="finance-field">
            Proveedor
            <input name="vendor" className="input-dark" placeholder="Opcional" />
          </label>
        </div>

        <label className="finance-field">
          Nota
          <textarea name="notes" className="input-dark" rows={3} placeholder="Detalle interno opcional" />
        </label>

        {error && <p style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary finance-submit">
          <Plus style={{ width: 16, height: 16 }} />
          {loading ? 'Guardando...' : 'Agregar egreso'}
        </button>
      </form>

      <div className="finance-panel finance-expense-list">
        <h2 className="finance-panel-title">Egresos del periodo</h2>
        {!expenses.length ? (
          <div className="finance-empty-state">
            Aun no hay egresos registrados en este rango.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {expenses.map((expense) => (
              <div key={expense.id} className="finance-expense-item">
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'var(--text)', fontWeight: 800, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {expense.label}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.76rem' }}>
                    {CATEGORY_LABELS[expense.category] ?? expense.category} - {new Date(expense.occurred_at).toLocaleDateString('es-PE')}
                    {expense.vendor ? ` - ${expense.vendor}` : ''}
                  </div>
                </div>
                <strong style={{ color: '#ef4444', fontSize: '0.9rem' }}>{formatPEN(expense.amount)}</strong>
                <button
                  type="button"
                  onClick={() => remove(expense.id)}
                  disabled={loading}
                  title="Eliminar egreso"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.25)',
                    background: 'rgba(239,68,68,0.08)',
                    color: '#ef4444',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <Trash2 style={{ width: 15, height: 15 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
