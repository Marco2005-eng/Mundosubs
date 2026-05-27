import { ProductCard } from '@/components/ProductCard'

export default function StorefrontLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
          <div className="mb-4 h-4 w-3/4 rounded bg-muted" />
          <div className="mb-2 h-8 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="mt-4 flex gap-2">
            <div className="h-8 flex-1 rounded bg-muted" />
            <div className="h-8 flex-1 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}