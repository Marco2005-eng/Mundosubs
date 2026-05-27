'use client'

import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
      <h2 className="text-2xl font-bold">Algo salió mal</h2>
      <p className="text-muted-foreground">
        {error.message || 'Ha ocurrido un error inesperado.'}
      </p>
      <Button onClick={reset}>Intentar de nuevo</Button>
    </div>
  )
}