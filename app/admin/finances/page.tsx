import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Banknote, BarChart3, Download, ReceiptText, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { formatPEN } from '@/lib/utils'
import { AdminFinanceExpenseForm } from '@/components/AdminFinanceExpenseForm'

type SearchParams = {
  period?: string
  from?: string
  to?: string
}

type SeriesPoint = {
  key: string
  label: string
  income: number
  expense: number
  profit: number
}

const EXPENSE_LABELS: Record<string, string> = {
  service_purchase: 'Compra de servicios',
  operations: 'Operacion',
  marketing: 'Marketing',
  refund: 'Devoluciones',
  other: 'Otros',
}

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date)
  copy.setMonth(copy.getMonth() + months)
  return copy
}

function getRange(params: SearchParams) {
  const now = new Date()
  const period = params.period || 'month'

  if (period === 'custom' && params.from && params.to) {
    return {
      period,
      from: startOfDay(new Date(`${params.from}T00:00:00`)),
      to: endOfDay(new Date(`${params.to}T00:00:00`)),
    }
  }

  if (period === 'week') {
    const from = startOfDay(addDays(now, -6))
    return { period, from, to: endOfDay(now) }
  }

  if (period === 'year') {
    const from = new Date(now.getFullYear(), 0, 1)
    return { period, from: startOfDay(from), to: endOfDay(now) }
  }

  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return { period: 'month', from: startOfDay(from), to: endOfDay(now) }
}

function numberValue(value: unknown) {
  return Number.parseFloat(String(value ?? 0)) || 0
}

function shouldGroupByMonth(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / 86400000) > 62
}

function bucketKey(date: Date, monthly: boolean) {
  if (monthly) return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  return toInputDate(date)
}

function bucketLabel(date: Date, monthly: boolean) {
  if (monthly) return date.toLocaleDateString('es-PE', { month: 'short' })
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

function buildSeries(from: Date, to: Date, orders: any[], expenses: any[]): SeriesPoint[] {
  const monthly = shouldGroupByMonth(from, to)
  const buckets = new Map<string, SeriesPoint>()
  let cursor = monthly ? new Date(from.getFullYear(), from.getMonth(), 1) : startOfDay(from)

  while (cursor <= to) {
    const key = bucketKey(cursor, monthly)
    buckets.set(key, { key, label: bucketLabel(cursor, monthly), income: 0, expense: 0, profit: 0 })
    cursor = monthly ? addMonths(cursor, 1) : addDays(cursor, 1)
  }

  for (const order of orders) {
    const key = bucketKey(new Date(order.created_at), monthly)
    const point = buckets.get(key)
    if (point) point.income += numberValue(order.amount)
  }

  for (const expense of expenses) {
    const key = bucketKey(new Date(expense.occurred_at), monthly)
    const point = buckets.get(key)
    if (point) point.expense += numberValue(expense.amount)
  }

  return Array.from(buckets.values()).map((point) => ({
    ...point,
    profit: point.income - point.expense,
  }))
}

function topBy<T extends { key: string; label: string; amount: number; count: number }>(items: T[], limit = 6) {
  return items.sort((a, b) => b.amount - a.amount).slice(0, limit)
}

export default async function AdminFinancesPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) redirect('/')

  const supabase = createServiceClient()
  const range = getRange(searchParams)
  const fromIso = range.from.toISOString()
  const toIso = range.to.toISOString()

  const [{ data: approvedOrders }, { data: pendingOrders }, expensesResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, amount, original_amount, discount_pct, created_at, product_id, user_id, products(name, category)')
      .eq('status', 'approved')
      .gte('created_at', fromIso)
      .lte('created_at', toIso)
      .order('created_at', { ascending: true }),
    supabase
      .from('orders')
      .select('id, amount, created_at')
      .eq('status', 'pending')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('finance_expenses')
      .select('*')
      .gte('occurred_at', fromIso)
      .lte('occurred_at', toIso)
      .order('occurred_at', { ascending: false }),
  ])

  const expensesError = expensesResult.error
  const expenses = expensesError ? [] : (expensesResult.data ?? [])
  const approvedRows = approvedOrders ?? []
  const profileIds = Array.from(new Set(approvedRows.map((order: any) => order.user_id).filter(Boolean)))
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, email, full_name').in('id', profileIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]))
  const orders = approvedRows.map((order: any) => ({
    ...order,
    users: profileMap.get(order.user_id) ?? null,
  }))
  const pending = pendingOrders ?? []

  const totalIncome = orders.reduce((sum, order: any) => sum + numberValue(order.amount), 0)
  const totalExpenses = expenses.reduce((sum, expense: any) => sum + numberValue(expense.amount), 0)
  const profit = totalIncome - totalExpenses
  const averageTicket = orders.length ? totalIncome / orders.length : 0
  const pendingAmount = pending.reduce((sum, order: any) => sum + numberValue(order.amount), 0)
  const discountAmount = orders.reduce((sum, order: any) => sum + Math.max(0, numberValue(order.original_amount) - numberValue(order.amount)), 0)
  const series = buildSeries(range.from, range.to, orders, expenses)

  const productMap = new Map<string, { key: string; label: string; amount: number; count: number }>()
  const userMap = new Map<string, { key: string; label: string; amount: number; count: number }>()
  const expenseMap = new Map<string, { key: string; label: string; amount: number; count: number }>()

  for (const order of orders as any[]) {
    const productKey = order.product_id || 'product'
    const product = productMap.get(productKey) ?? { key: productKey, label: order.products?.name || 'Servicio', amount: 0, count: 0 }
    product.amount += numberValue(order.amount)
    product.count += 1
    productMap.set(productKey, product)

    const userKey = order.user_id || 'user'
    const user = userMap.get(userKey) ?? { key: userKey, label: order.users?.full_name || order.users?.email || 'Cliente', amount: 0, count: 0 }
    user.amount += numberValue(order.amount)
    user.count += 1
    userMap.set(userKey, user)
  }

  for (const expense of expenses as any[]) {
    const key = expense.category || 'other'
    const item = expenseMap.get(key) ?? { key, label: EXPENSE_LABELS[key] ?? key, amount: 0, count: 0 }
    item.amount += numberValue(expense.amount)
    item.count += 1
    expenseMap.set(key, item)
  }

  const rangeLabel = `${range.from.toLocaleDateString('es-PE')} - ${range.to.toLocaleDateString('es-PE')}`
  const setupMissing = Boolean(expensesError)
  const exportParams = new URLSearchParams({
    from: toInputDate(range.from),
    to: toInputDate(range.to),
  })
  const excelParams = new URLSearchParams({
    from: toInputDate(range.from),
    to: toInputDate(range.to),
    format: 'xls',
  })

  return (
    <div style={{ padding: '40px 5%', maxWidth: '1260px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/admin" style={backStyle}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div>
            <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.55rem', fontWeight: 800, color: 'var(--text)' }}>
              Finanzas
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>
              Reporte {rangeLabel}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Link href={`/api/admin/finance-report?${excelParams.toString()}`} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--muted)',
          border: '1px solid var(--border2)',
          background: 'var(--bg3)',
          borderRadius: '8px',
          padding: '9px 12px',
          fontSize: '0.82rem',
          fontWeight: 700,
          textDecoration: 'none'
        }}>
          <Download style={{ width: 16, height: 16 }} />
          Exportar Excel
        </Link>
        <Link href={`/api/admin/finance-report?${exportParams.toString()}`} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--muted)',
          border: '1px solid var(--border2)',
          background: 'var(--bg3)',
          borderRadius: '8px',
          padding: '9px 12px',
          fontSize: '0.82rem',
          fontWeight: 700,
          textDecoration: 'none'
        }}>
          CSV
        </Link>
        <Link href={`/admin/finances/print?${exportParams.toString()}`} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text)',
          border: '1px solid var(--border2)',
          background: 'var(--bg3)',
          borderRadius: '8px',
          padding: '9px 12px',
          fontSize: '0.82rem',
          fontWeight: 700,
          textDecoration: 'none'
        }}>
          PDF
        </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {[
          { value: 'week', label: 'Semanal' },
          { value: 'month', label: 'Mensual' },
          { value: 'year', label: 'Anual' },
        ].map((item) => (
          <Link key={item.value} href={`/admin/finances?period=${item.value}`} style={filterStyle(range.period === item.value)}>
            {item.label}
          </Link>
        ))}
        <form style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="hidden" name="period" value="custom" />
          <input name="from" type="date" defaultValue={toInputDate(range.from)} className="input-dark" style={{ minHeight: 38 }} />
          <input name="to" type="date" defaultValue={toInputDate(range.to)} className="input-dark" style={{ minHeight: 38 }} />
          <button className="btn-secondary" style={{ minHeight: 38 }}>Generar</button>
        </form>
      </div>

      {setupMissing && (
        <div style={{
          padding: '14px 16px',
          border: '1px solid rgba(249,115,22,0.25)',
          background: 'rgba(249,115,22,0.08)',
          borderRadius: '10px',
          color: 'var(--hot)',
          marginBottom: '18px',
          fontSize: '0.86rem',
          fontWeight: 700
        }}>
          Ejecuta primero supabase/setup-finances.sql en Supabase para activar el registro de egresos.
        </div>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '18px' }}>
        <StatCard label="Ingresos aprobados" value={formatPEN(totalIncome)} icon={TrendingUp} color="var(--green)" bg="rgba(34,197,94,0.1)" />
        <StatCard label="Egresos" value={formatPEN(totalExpenses)} icon={TrendingDown} color="#ef4444" bg="rgba(239,68,68,0.1)" />
        <StatCard label="Utilidad neta" value={formatPEN(profit)} icon={Wallet} color={profit >= 0 ? 'var(--green)' : '#ef4444'} bg={profit >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'} />
        <StatCard label="Ventas aprobadas" value={String(orders.length)} icon={ReceiptText} color="var(--accent2)" bg="rgba(124,58,237,0.1)" />
        <StatCard label="Ticket promedio" value={formatPEN(averageTicket)} icon={Banknote} color="var(--hot)" bg="rgba(249,115,22,0.1)" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.5fr) minmax(260px, 0.8fr)', gap: '16px', marginBottom: '16px' }} className="finance-main-grid">
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
            <div>
              <h2 style={panelTitleStyle}>Ingresos vs egresos</h2>
              <p style={panelTextStyle}>Linea verde: ingresos. Linea roja: egresos. Linea morada: utilidad.</p>
            </div>
            <BarChart3 style={{ width: 22, height: 22, color: 'var(--accent2)' }} />
          </div>
          <FinanceLineChart points={series} />
        </div>

        <div style={panelStyle}>
          <h2 style={panelTitleStyle}>Resumen operativo</h2>
          <MetricRow label="Pendiente por validar" value={formatPEN(pendingAmount)} />
          <MetricRow label="Pedidos pendientes" value={String(pending.length)} />
          <MetricRow label="Descuentos otorgados" value={formatPEN(discountAmount)} />
          <MetricRow label="Margen del periodo" value={totalIncome ? `${Math.round((profit / totalIncome) * 100)}%` : '0%'} />
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px', marginBottom: '16px' }}>
        <Ranking title="Servicios más vendidos" items={topBy(Array.from(productMap.values()))} />
        <Ranking title="Clientes con más compras" items={topBy(Array.from(userMap.values()))} />
        <Ranking title="Egresos por categoría" items={topBy(Array.from(expenseMap.values()))} negative />
      </section>

      {!setupMissing && <AdminFinanceExpenseForm expenses={expenses as any[]} />}
    </div>
  )
}

const backStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  background: 'var(--bg3)',
  color: 'var(--muted)',
  textDecoration: 'none',
}

const panelStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border2)',
  borderRadius: '12px',
  padding: '18px',
  minWidth: 0,
}

const panelTitleStyle = {
  color: 'var(--text)',
  fontSize: '1rem',
  fontWeight: 800,
}

const panelTextStyle = {
  color: 'var(--muted)',
  fontSize: '0.8rem',
}

function filterStyle(active: boolean) {
  return {
    padding: '9px 14px',
    minHeight: 38,
    borderRadius: '999px',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border2)'}`,
    background: active ? 'rgba(124,58,237,0.15)' : 'var(--bg3)',
    color: active ? 'var(--accent2)' : 'var(--muted)',
    textDecoration: 'none',
    fontSize: '0.82rem',
    fontWeight: 800,
  }
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: string; icon: any; color: string; bg: string }) {
  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <span style={{ color: 'var(--muted)', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase' }}>{label}</span>
        <span style={{ width: 34, height: 34, borderRadius: '8px', background: bg, color, display: 'grid', placeItems: 'center' }}>
          <Icon style={{ width: 17, height: 17 }} />
        </span>
      </div>
      <strong style={{ fontFamily: "'Unbounded', sans-serif", color, fontSize: '1.25rem' }}>{value}</strong>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border2)' }}>
      <span style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>{label}</span>
      <strong style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{value}</strong>
    </div>
  )
}

function Ranking({ title, items, negative = false }: { title: string; items: { key: string; label: string; amount: number; count: number }[]; negative?: boolean }) {
  const max = Math.max(...items.map((item) => item.amount), 1)

  return (
    <div style={panelStyle}>
      <h2 style={{ ...panelTitleStyle, marginBottom: '12px' }}>{title}</h2>
      {!items.length ? (
        <p style={panelTextStyle}>Sin datos en este periodo.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {items.map((item) => (
            <div key={item.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text)', fontSize: '0.86rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                <strong style={{ color: negative ? '#ef4444' : 'var(--green)', fontSize: '0.86rem' }}>{formatPEN(item.amount)}</strong>
              </div>
              <div style={{ height: 7, background: 'var(--bg3)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(4, (item.amount / max) * 100)}%`, height: '100%', background: negative ? '#ef4444' : 'var(--accent2)' }} />
              </div>
              <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{item.count} movimiento{item.count === 1 ? '' : 's'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FinanceLineChart({ points }: { points: SeriesPoint[] }) {
  const width = 760
  const height = 260
  const padding = 34
  const values = points.flatMap((point) => [point.income, point.expense, point.profit])
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1

  const line = (field: keyof Pick<SeriesPoint, 'income' | 'expense' | 'profit'>) =>
    points
      .map((point, index) => {
        const x = padding + (points.length === 1 ? 0 : (index / (points.length - 1)) * (width - padding * 2))
        const y = padding + ((max - point[field]) / span) * (height - padding * 2)
        return `${x},${y}`
      })
      .join(' ')

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 520, height: 'auto' }} role="img" aria-label="Grafico financiero">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border2)" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--border2)" />
        <polyline points={line('income')} fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={line('expense')} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={line('profit')} fill="none" stroke="var(--accent2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => {
          const x = padding + (points.length === 1 ? 0 : (index / (points.length - 1)) * (width - padding * 2))
          return (
            <text key={point.key} x={x} y={height - 8} fill="var(--muted)" fontSize="10" textAnchor="middle">
              {index % Math.ceil(points.length / 6 || 1) === 0 ? point.label : ''}
            </text>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', color: 'var(--muted)', fontSize: '0.78rem' }}>
        <Legend color="var(--green)" label="Ingresos" />
        <Legend color="#ef4444" label="Egresos" />
        <Legend color="var(--accent2)" label="Utilidad" />
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: color }} />
      {label}
    </span>
  )
}
