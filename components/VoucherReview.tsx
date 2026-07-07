'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface VoucherReviewProps {
  orderId: string
}

export function VoucherReview({ orderId }: VoucherReviewProps) {
  const [note, setNote] = useState('')
  const [access, setAccess] = useState({
    loginUrl: '',
    accountEmail: '',
    accountPassword: '',
    profileName: '',
    profilePin: '',
    loginCode: '',
    notes: '',
  })
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  async function submit(action: 'approve' | 'reject') {
    setLoading(action)
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          action,
          note: note || undefined,
          access: action === 'approve' ? access : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar')
      }
      toast({ 
        title: action === 'approve' ? '¡Pedido aprobado!' : 'Pedido rechazado',
        description: 'Sincronizando la bandeja de comprobantes en tiempo real...',
      })
      router.push('/admin/vouchers')
      router.refresh()
    } catch {
      toast({ variant: 'destructive', title: 'Error al procesar' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4" style={{ borderColor: 'var(--border2)', background: 'var(--bg2)' }}>
        <div className="mb-3">
          <Label>Datos de acceso para el cliente</Label>
          <p className="text-xs text-muted-foreground">
            Estos datos se mostraran solo al cliente dentro de Mi cuenta cuando apruebes el pago.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>URL de acceso</Label>
            <input
              className="input-dark w-full"
              placeholder="https://..."
              value={access.loginUrl}
              onChange={(e) => setAccess({ ...access, loginUrl: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Correo / usuario</Label>
            <input
              className="input-dark w-full"
              placeholder="cuenta@servicio.com"
              value={access.accountEmail}
              onChange={(e) => setAccess({ ...access, accountEmail: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Contrasena</Label>
            <input
              className="input-dark w-full"
              placeholder="Clave de acceso"
              value={access.accountPassword}
              onChange={(e) => setAccess({ ...access, accountPassword: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Perfil</Label>
            <input
              className="input-dark w-full"
              placeholder="Perfil asignado"
              value={access.profileName}
              onChange={(e) => setAccess({ ...access, profileName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>PIN</Label>
            <input
              className="input-dark w-full"
              placeholder="PIN si aplica"
              value={access.profilePin}
              onChange={(e) => setAccess({ ...access, profilePin: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Cód. inicio de sesión</Label>
            <input
              className="input-dark w-full"
              placeholder="Codigo unico por dispositivo"
              value={access.loginCode}
              onChange={(e) => setAccess({ ...access, loginCode: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <Label>Indicaciones</Label>
          <Textarea
            placeholder="Ej: No cambies la contraseña. Usa solo el perfil asignado."
            value={access.notes}
            onChange={(e) => setAccess({ ...access, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Nota al usuario (opcional)</Label>
        <Textarea
          placeholder="Motivo de rechazo o comentario…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => submit('approve')}
          disabled={!!loading}
        >
          {loading === 'approve' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Aprobar
        </Button>

        <Button
          variant="destructive"
          className="flex-1 gap-2"
          onClick={() => submit('reject')}
          disabled={!!loading}
        >
          {loading === 'reject' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Rechazar
        </Button>
      </div>
    </div>
  )
}
