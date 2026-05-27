'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Plus, Trash2, Gift, Calendar, FileText, Check, X } from 'lucide-react'

interface Discount {
  id: string
  label: string
  pct: number
}

interface UserDiscount {
  id: string
  discount_id: string
  expires_at: string | null
  used_at: string | null
  note: string | null
  discounts: {
    label: string
    pct: number
  }
}

export function DiscountManager({ 
  userId, 
  availableDiscounts, 
  userDiscounts,
  onRefresh 
}: { 
  userId: string
  availableDiscounts: Discount[]
  userDiscounts: UserDiscount[]
  onRefresh?: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [discountId, setDiscountId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const { toast } = useToast()

  const activeDiscounts = userDiscounts.filter(d => !d.used_at && (!d.expires_at || new Date(d.expires_at) > new Date()))
  const usedDiscounts = userDiscounts.filter(d => d.used_at)
  const expiredDiscounts = userDiscounts.filter(d => !d.used_at && d.expires_at && new Date(d.expires_at) <= new Date())

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!discountId) return
    setLoading(true)
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          discountId, 
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null, 
          note: note || null 
        }),
      })
      
      if (!res.ok) {
        throw new Error('Error al asignar')
      }
      
      toast({ title: 'Descuento asignado correctamente', variant: 'default' })
      setDiscountId('')
      setExpiresAt('')
      setNote('')
      setShowForm(false)
      onRefresh?.()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al asignar descuento' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border2)',
      borderRadius: '12px',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Gift style={{ width: '20px', height: '20px', color: 'var(--hot)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>
            Descuentos del usuario
          </h3>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          style={{
            background: showForm ? 'var(--bg3)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
            border: showForm ? '1px solid var(--border2)' : 'none'
          }}
        >
          {showForm ? <X style={{ width: 16, height: 16 }} /> : <Plus style={{ width: 16, height: 16 }} />}
          <span style={{ marginLeft: '6px' }}>{showForm ? 'Cancelar' : 'Asignar'}</span>
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={onSubmit} style={{
          background: 'var(--bg3)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <Label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>Descuento</Label>
              <Select value={discountId} onValueChange={setDiscountId}>
                <SelectTrigger style={{ height: '40px' }}>
                  <SelectValue placeholder="Seleccionar…" />
                </SelectTrigger>
                <SelectContent>
                  {availableDiscounts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span style={{ fontWeight: 500 }}>{d.label}</span>
                      <span style={{ color: 'var(--green)', marginLeft: '8px' }}>{d.pct}%</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>Vencimiento (opcional)</Label>
              <Input 
                type="date" 
                value={expiresAt} 
                onChange={(e) => setExpiresAt(e.target.value)}
                style={{ height: '40px' }}
              />
            </div>
          </div>
          
          <div>
            <Label style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>Nota (opcional)</Label>
            <Textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              placeholder="Motivo de la asignación..."
              rows={2}
              style={{ resize: 'none' }}
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading || !discountId}
            style={{ alignSelf: 'flex-start' }}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Asignar descuento
          </Button>
        </form>
      )}

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: activeDiscounts.length > 0 ? 'rgba(34,197,94,0.1)' : 'var(--bg3)',
          border: '1px solid',
          borderColor: activeDiscounts.length > 0 ? 'rgba(34,197,94,0.3)' : 'var(--border2)',
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)' }}>{activeDiscounts.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Activos</div>
        </div>
        <div style={{
          background: usedDiscounts.length > 0 ? 'rgba(100,116,139,0.1)' : 'var(--bg3)',
          border: '1px solid',
          borderColor: usedDiscounts.length > 0 ? 'rgba(100,116,139,0.3)' : 'var(--border2)',
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--muted)' }}>{usedDiscounts.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Usados</div>
        </div>
        <div style={{
          background: expiredDiscounts.length > 0 ? 'rgba(239,68,68,0.1)' : 'var(--bg3)',
          border: '1px solid',
          borderColor: expiredDiscounts.length > 0 ? 'rgba(239,68,68,0.3)' : 'var(--border2)',
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{expiredDiscounts.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Vencidos</div>
        </div>
      </div>

      {/* Lista de descuentos */}
      {userDiscounts.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
          No hay descuentos asignados
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {userDiscounts.map((d) => {
            const isActive = !d.used_at && (!d.expires_at || new Date(d.expires_at) > new Date())
            const isExpired = !d.used_at && d.expires_at && new Date(d.expires_at) <= new Date()
            
            return (
              <div key={d.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--bg3)',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isActive ? 'rgba(34,197,94,0.3)' : isExpired ? 'rgba(239,68,68,0.3)' : 'var(--border2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(34,197,94,0.15)' : isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isActive ? (
                      <Check style={{ width: '18px', height: '18px', color: 'var(--green)' }} />
                    ) : isExpired ? (
                      <X style={{ width: '18px', height: '18px', color: '#ef4444' }} />
                    ) : (
                      <FileText style={{ width: '18px', height: '18px', color: 'var(--muted)' }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                      {d.discounts?.label || 'Descuento'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 500 }}>
                      {d.discounts?.pct}% de descuento
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {d.expires_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      <Calendar style={{ width: '12px', height: '12px' }} />
                      {new Date(d.expires_at).toLocaleDateString('es-PE')}
                    </div>
                  )}
                  {isActive && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(34,197,94,0.15)',
                      color: 'var(--green)',
                      fontWeight: 500
                    }}>
                      Activo
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {userDiscounts.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '12px', textAlign: 'center' }}>
          Total: {userDiscounts.length} descuento(s) asignado(s)
        </p>
      )}
    </div>
  )
}