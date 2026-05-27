import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface SubscriptionStatusProps {
  expiresAt: string | null
}

export function SubscriptionStatus({ expiresAt }: SubscriptionStatusProps) {
  if (!expiresAt) return <Badge variant="secondary">Sin suscripción</Badge>

  const expired = new Date(expiresAt) < new Date()
  if (expired) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" /> Vencida
      </Badge>
    )
  }

  return (
    <Badge className="gap-1 bg-green-600 text-white hover:bg-green-700">
      <CheckCircle className="h-3 w-3" /> Activa hasta {new Date(expiresAt).toLocaleDateString('es-PE')}
    </Badge>
  )
}
