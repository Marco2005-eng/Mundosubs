'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface Discount {
  id: string
  label: string
  pct: number
}

export function AssignDiscountForm({ userId, discounts }: { userId: string; discounts: Discount[] }) {
  const [discountId, setDiscountId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!discountId) return
    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}/discount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discountId, expiresAt: expiresAt || null, note: note || null }),
    })
    setLoading(false)
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Error al asignar descuento' })
      return
    }
    toast({ title: 'Descuento asignado correctamente' })
    setDiscountId('')
    setExpiresAt('')
    setNote('')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Descuento</Label>
        <Select value={discountId} onValueChange={setDiscountId}>
          <SelectTrigger><SelectValue placeholder="Seleccionar descuento…" /></SelectTrigger>
          <SelectContent>
            {discounts.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.label} ({d.pct}%)</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Vencimiento (opcional)</Label>
        <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label>Nota (opcional)</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Motivo…" />
      </div>

      <Button type="submit" disabled={loading || !discountId} size="sm">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Asignar
      </Button>
    </form>
  )
}
