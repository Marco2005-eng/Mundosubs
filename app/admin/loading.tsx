import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminLoading() {
  return (
    <div className="container py-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}