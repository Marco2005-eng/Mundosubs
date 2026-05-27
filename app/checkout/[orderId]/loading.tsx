import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CheckoutLoading() {
  return (
    <div className="container py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="animate-pulse h-6 w-48 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse h-4 w-full rounded bg-muted" />
          <div className="animate-pulse h-4 w-3/4 rounded bg-muted" />
          <div className="animate-pulse h-32 w-full rounded bg-muted" />
          <div className="animate-pulse h-10 w-full rounded bg-muted" />
        </CardContent>
      </Card>
    </div>
  )
}