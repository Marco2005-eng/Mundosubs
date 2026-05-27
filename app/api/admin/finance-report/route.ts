import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function endOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

function csvCell(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function htmlCell(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const url = new URL(req.url)
  const format = url.searchParams.get('format') || 'csv'
  const from = parseDate(url.searchParams.get('from'), new Date(now.getFullYear(), now.getMonth(), 1))
  const to = endOfDay(parseDate(url.searchParams.get('to'), now))
  const supabase = createServiceClient()

  const [{ data: orders }, { data: expenses }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, amount, created_at, user_id, products(name, category)')
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

  const orderRows = orders ?? []
  const profileIds = Array.from(new Set(orderRows.map((order: any) => order.user_id).filter(Boolean)))
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, email, full_name').in('id', profileIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]))

  const rows = [
    ['tipo', 'fecha', 'detalle', 'categoria', 'cliente_proveedor', 'monto'],
    ...orderRows.map((order: any) => {
      const profile = profileMap.get(order.user_id)
      return [
      'ingreso',
      new Date(order.created_at).toLocaleDateString('es-PE'),
      order.products?.name || `Pedido ${order.id}`,
      order.products?.category || '',
      profile?.full_name || profile?.email || '',
      order.amount,
      ]
    }),
    ...(expenses ?? []).map((expense: any) => [
      'egreso',
      new Date(expense.occurred_at).toLocaleDateString('es-PE'),
      expense.label,
      expense.category,
      expense.vendor || '',
      expense.amount,
    ]),
  ]

  if (format === 'xls') {
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
    th { background: #5c35b0; color: #ffffff; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; }
    td.amount { mso-number-format:"0.00"; }
  </style>
</head>
<body>
  <table>
    ${rows.map((row, index) => `
      <tr>
        ${row.map((cell, cellIndex) => index === 0
          ? `<th>${htmlCell(cell)}</th>`
          : `<td${cellIndex === 5 ? ' class="amount"' : ''}>${htmlCell(cell)}</td>`
        ).join('')}
      </tr>
    `).join('')}
  </table>
</body>
</html>`
    const filename = `mundosubs-finanzas-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.xls`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`
  const filename = `mundosubs-finanzas-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
