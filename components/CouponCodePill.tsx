'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CouponCodePill({ code, dark = false }: { code: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  if (dark) {
    // Version for dark gradient background (hero banner)
    return (
      <button
        type="button"
        onClick={handleCopy}
        title="Clic para copiar"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          maxWidth: '100%',
          padding: '9px 16px', borderRadius: 12, cursor: 'pointer',
          background: copied ? 'rgba(134,239,172,0.2)' : 'rgba(255,255,255,0.15)',
          border: `1px solid ${copied ? 'rgba(134,239,172,0.4)' : 'rgba(255,255,255,0.25)'}`,
          color: '#fff', transition: 'all 0.2s',
        }}
      >
        {copied
          ? <Check style={{ width: 15, height: 15, color: '#86efac', flexShrink: 0 }} />
          : <Copy style={{ width: 15, height: 15, opacity: 0.8, flexShrink: 0 }} />}
        <span style={{
          fontFamily: 'monospace, sans-serif', fontWeight: 900,
          fontSize: '0.95rem', letterSpacing: '1.5px',
          color: copied ? '#86efac' : '#fff',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {code}
        </span>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3px',
          color: copied ? '#86efac' : 'rgba(255,255,255,0.65)',
          borderLeft: '1px solid rgba(255,255,255,0.25)', paddingLeft: 10,
        }}>
          {copied ? '¡Copiado!' : 'Copiar'}
        </span>
      </button>
    )
  }

  // Version for light/card background
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Clic para copiar"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 9,
        maxWidth: '100%',
        padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
        background: copied ? 'rgba(22,163,74,0.08)' : 'rgba(124,58,237,0.07)',
        border: `1px solid ${copied ? 'rgba(22,163,74,0.25)' : 'rgba(124,58,237,0.2)'}`,
        transition: 'all 0.2s',
      }}
    >
      {copied
        ? <Check style={{ width: 13, height: 13, color: 'var(--green)', flexShrink: 0 }} />
        : <Copy style={{ width: 13, height: 13, color: 'var(--accent2)', flexShrink: 0 }} />}
      <span style={{
        fontFamily: 'monospace, sans-serif', fontWeight: 900,
        fontSize: '0.85rem', letterSpacing: '1px',
        color: copied ? 'var(--green)' : 'var(--accent2)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {code}
      </span>
      <span style={{
        fontSize: '0.68rem', fontWeight: 700,
        color: copied ? 'var(--green)' : 'var(--muted)',
        borderLeft: '1px solid var(--border2)', paddingLeft: 9,
      }}>
        {copied ? '¡Copiado!' : 'Copiar'}
      </span>
    </button>
  )
}
