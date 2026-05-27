'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCallback } from 'react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  limitOptions?: number[]
}

export function PaginationControls({
  currentPage,
  totalPages,
  baseUrl,
  limitOptions = [5, 10, 20]
}: PaginationControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentLimit = parseInt(searchParams.get('limit') || '10')

  const goToPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`${baseUrl}?${params.toString()}`)
  }, [baseUrl, router, searchParams])

  const changeLimit = useCallback((limit: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('limit', limit)
    params.set('page', '1')
    router.push(`${baseUrl}?${params.toString()}`)
  }, [baseUrl, router, searchParams])

  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 py-4" style={{ borderTop: '1px solid var(--border2)' }}>
      <div className="flex items-center gap-3">
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Mostrar</span>
        <Select value={currentLimit.toString()} onValueChange={changeLimit}>
          <SelectTrigger style={{ width: '80px', height: '36px' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((limit) => (
              <SelectItem key={limit} value={limit.toString()}>
                {limit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>por página</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid var(--border2)',
            background: currentPage === 1 ? 'var(--bg3)' : 'var(--card)',
            color: currentPage === 1 ? 'var(--muted)' : 'var(--text)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          <ChevronLeft style={{ width: '18px', height: '18px' }} />
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, idx) => (
            typeof page === 'number' ? (
              <button
                key={idx}
                onClick={() => goToPage(page)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '36px',
                  height: '36px',
                  padding: '0 8px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: page === currentPage ? 'var(--accent)' : 'transparent',
                  background: page === currentPage ? 'var(--accent)' : 'transparent',
                  color: page === currentPage ? 'white' : 'var(--text)',
                  fontSize: '0.85rem',
                  fontWeight: page === currentPage ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {page}
              </button>
            ) : (
              <span key={idx} style={{ color: 'var(--muted)', padding: '0 4px' }}>{page}</span>
            )
          ))}
        </div>

        <div className="sm:hidden flex items-center gap-2" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          <span>Página {currentPage} de {totalPages}</span>
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid var(--border2)',
            background: currentPage === totalPages ? 'var(--bg3)' : 'var(--card)',
            color: currentPage === totalPages ? 'var(--muted)' : 'var(--text)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          <ChevronRight style={{ width: '18px', height: '18px' }} />
        </button>
      </div>
    </div>
  )
}