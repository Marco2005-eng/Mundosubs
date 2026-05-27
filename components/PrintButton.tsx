'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-primary print-hide"
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
    >
      <Printer style={{ width: 16, height: 16 }} />
      Imprimir / guardar PDF
    </button>
  )
}
