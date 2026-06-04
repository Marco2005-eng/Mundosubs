'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const isDark = stored ? stored === 'dark' : false
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      title={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      style={{
        width: '38px',
        height: '38px',
        borderRadius: '8px',
        border: '1px solid var(--border2)',
        background: 'var(--bg3)',
        color: 'var(--text)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flex: '0 0 auto',
      }}
    >
      {dark ? <Sun style={{ width: 18, height: 18 }} /> : <Moon style={{ width: 18, height: 18 }} />}
    </button>
  )
}
