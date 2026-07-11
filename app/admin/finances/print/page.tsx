import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatPEN } from '@/lib/utils'
import { PrintButton } from '@/components/PrintButton'

type SearchParams = {
  from?: string
  to?: string
  category?: string
}

type Point = {
  key: string
  label: string
  income: number
  expense: number
  profit: number
}

function parseDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? fallback : date
}

function endOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function numberValue(value: unknown) {
  return Number.parseFloat(String(value ?? 0)) || 0
}

function buildDailySeries(from: Date, to: Date, orders: any[], expenses: any[]) {
  const buckets = new Map<string, Point>()
  let cursor = new Date(from)

  while (cursor <= to) {
    const key = toInputDate(cursor)
    buckets.set(key, {
      key,
      label: cursor.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
      income: 0,
      expense: 0,
      profit: 0,
    })
    cursor = addDays(cursor, 1)
  }

  for (const order of orders) {
    const point = buckets.get(toInputDate(new Date(order.created_at)))
    if (point) point.income += numberValue(order.amount)
  }

  for (const expense of expenses) {
    const point = buckets.get(toInputDate(new Date(expense.occurred_at)))
    if (point) point.expense += numberValue(expense.amount)
  }

  return Array.from(buckets.values()).map((point) => ({ ...point, profit: point.income - point.expense }))
}

export default async function FinancePrintPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) redirect('/')

  const now = new Date()
  const from = parseDate(searchParams.from, new Date(now.getFullYear(), now.getMonth(), 1))
  const to = endOfDay(parseDate(searchParams.to, now))
  const selectedCategory = searchParams.category || ''
  const supabase = createServiceClient()

  const [{ data: orders }, { data: expenses }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, amount, original_amount, discount_pct, created_at, user_id, products(name, category)')
      .eq('status', 'approved')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('finance_expenses')
      .select('label, category, amount, occurred_at, vendor')
      .gte('occurred_at', from.toISOString())
      .lte('occurred_at', to.toISOString())
      .order('occurred_at', { ascending: true }),
  ])

  let orderRows = orders ?? []
  let expenseRows = expenses ?? []
  if (selectedCategory) {
    orderRows = orderRows.filter((order: any) => order.products?.category === selectedCategory)
    expenseRows = []
  }

  const profileIds = Array.from(new Set(orderRows.map((order: any) => order.user_id).filter(Boolean)))
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, email, full_name').in('id', profileIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]))
  const incomeRows = orderRows.map((order: any) => ({
    ...order,
    users: profileMap.get(order.user_id) ?? null,
  }))
  const totalIncome = incomeRows.reduce((sum: number, order: any) => sum + numberValue(order.amount), 0)
  const totalExpenses = expenseRows.reduce((sum: number, expense: any) => sum + numberValue(expense.amount), 0)
  const profit = totalIncome - totalExpenses
  const points = buildDailySeries(from, to, incomeRows, expenseRows)

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', padding: '32px 5%', color: '#0f172a' }}>
      <div className="print-hide" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Link href="/admin/finances" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#334155', textDecoration: 'none', fontWeight: 700 }}>
          <ArrowLeft style={{ width: 18, height: 18 }} />
          Volver a finanzas
        </Link>
        <PrintButton />
      </div>

      <section style={{ background: '#ffffff', border: '1px solid #dbe3ef', borderRadius: '10px', padding: '28px', maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', borderBottom: '2px solid #e2e8f0', paddingBottom: '18px', marginBottom: '22px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>Reporte financiero MUNDOSUBS</h1>
            <p style={{ color: '#64748b', marginTop: 6 }}>
              {from.toLocaleDateString('es-PE')} - {to.toLocaleDateString('es-PE')}
            </p>
          </div>
          <div style={{ textAlign: 'right', color: '#64748b', fontSize: '0.82rem' }}>
            Generado por admin<br />
            {new Date().toLocaleString('es-PE')}
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '22px' }}>
          <PrintStat label="Ingresos" value={formatPEN(totalIncome)} color="#16a34a" />
          <PrintStat label="Egresos" value={formatPEN(totalExpenses)} color="#dc2626" />
          <PrintStat label="Utilidad neta" value={formatPEN(profit)} color={profit >= 0 ? '#16a34a' : '#dc2626'} />
        </div>

        <h2 style={headingStyle}>Grafico del periodo</h2>
        <PrintChart points={points} />

        <h2 style={headingStyle}>Ingresos aprobados</h2>
        <ReportTable
          headers={['Fecha', 'Servicio', 'Categoria', 'Cliente', 'Monto']}
          rows={incomeRows.map((order: any) => [
            new Date(order.created_at).toLocaleDateString('es-PE'),
            order.products?.name || 'Servicio',
            order.products?.category || '',
            order.users?.full_name || order.users?.email || '',
            formatPEN(order.amount),
          ])}
        />

        <h2 style={headingStyle}>Egresos registrados</h2>
        <ReportTable
          headers={['Fecha', 'Detalle', 'Categoria', 'Proveedor', 'Monto']}
          rows={expenseRows.map((expense: any) => [
            new Date(expense.occurred_at).toLocaleDateString('es-PE'),
            expense.label,
            expense.category,
            expense.vendor || '',
            formatPEN(expense.amount),
          ])}
        />
      </section>
    </main>
  )
}

const headingStyle = {
  fontSize: '1rem',
  fontWeight: 900,
  margin: '24px 0 10px',
}

function PrintStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
      <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
      <strong style={{ color, fontSize: '1.1rem' }}>{value}</strong>
    </div>
  )
}

function ReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '12px' }}>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} style={thStyle}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {!rows.length ? (
          <tr><td colSpan={headers.length} style={tdStyle}>Sin datos en este periodo.</td></tr>
        ) : rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} style={tdStyle}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const thStyle = {
  background: '#ede9fe',
  color: '#312e81',
  border: '1px solid #ddd6fe',
  padding: '8px',
  textAlign: 'left' as const,
}

const tdStyle = {
  border: '1px solid #e2e8f0',
  padding: '8px',
}

function PrintChart({ points }: { points: Point[] }) {
  const width = 900
  const height = 260
  const padding = 34
  const values = points.flatMap((point) => [point.income, point.expense, point.profit])
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1

  const line = (field: keyof Pick<Point, 'income' | 'expense' | 'profit'>) =>
    points.map((point, index) => {
      const x = padding + (points.length === 1 ? 0 : (index / (points.length - 1)) * (width - padding * 2))
      const y = padding + ((max - point[field]) / span) * (height - padding * 2)
      return `${x},${y}`
    }).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" />
      <polyline points={line('income')} fill="none" stroke="#16a34a" strokeWidth="3" />
      <polyline points={line('expense')} fill="none" stroke="#dc2626" strokeWidth="3" />
      <polyline points={line('profit')} fill="none" stroke="#7c3aed" strokeWidth="3" />
      <text x="48" y="24" fill="#16a34a" fontSize="12">Ingresos</text>
      <text x="128" y="24" fill="#dc2626" fontSize="12">Egresos</text>
      <text x="204" y="24" fill="#7c3aed" fontSize="12">Utilidad</text>
    </svg>
  )
}
