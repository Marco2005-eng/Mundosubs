import { Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DiscountBadgeProps {
  pct: number
  label?: string
}

export function DiscountBadge({ pct, label }: DiscountBadgeProps) {
  if (!pct) return null
  return (
    <Badge className="gap-1 bg-green-600 text-white hover:bg-green-700">
      <Tag className="h-3 w-3" />
      {pct}% OFF{label ? ` · ${label}` : ''}
    </Badge>
  )
}
