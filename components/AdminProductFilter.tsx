'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState } from 'react'

export function AdminProductFilter({ 
  initialQ, 
  initialCategory 
}: { 
  initialQ?: string
  initialCategory?: string 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(initialQ || '')

  const handleFilter = (searchQuery: string, catQuery: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    else params.delete('q')
    
    if (catQuery && catQuery !== 'all') params.set('category', catQuery)
    else params.delete('category')
    
    params.set('page', '1') // reset to page 1 on filter change
    router.push(`/admin/products?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', width: '100%', maxWidth: '650px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
        <Search style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0.4,
          width: '18px',
          height: '18px'
        }} />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleFilter(q, initialCategory || 'all')
            }
          }}
          className="input-dark"
          style={{ width: '100%', paddingLeft: '40px', height: '42px' }}
        />
      </div>
      <select
        value={initialCategory || 'all'}
        onChange={(e) => handleFilter(q, e.target.value)}
        className="input-dark text-sm"
        style={{ padding: '0 12px', borderRadius: '8px', cursor: 'pointer', height: '42px', minWidth: '180px' }}
      >
        <option value="all">Todas las categorías</option>
        <option value="streaming">Streaming</option>
        <option value="game">Juegos</option>
        <option value="license">Licencias</option>
        <option value="software">Software</option>
        <option value="music">Música</option>
      </select>
    </div>
  )
}
