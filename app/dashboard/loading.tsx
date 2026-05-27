import { Card, CardContent } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <div className="h-10 w-32 animate-pulse rounded bg-muted" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}