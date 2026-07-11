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

// Escapes HTML special characters for the Excel format HTML output
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

  const selectedUserId = url.searchParams.get('userId') || ''
  const selectedUserQuery = url.searchParams.get('userQuery') || ''
  const selectedCategory = url.searchParams.get('category') || ''
  const selectedProductId = url.searchParams.get('productId') || ''
  const selectedProductQuery = url.searchParams.get('productQuery') || ''
  const selectedStatus = url.searchParams.get('status') || ''

  const supabase = createServiceClient()

  // 1. Resolve matching users if search query is present and no exact userId is selected
  let matchedUserIds: string[] = []
  let userFilterActive = false
  if (selectedUserId) {
    // Exact user selected
    matchedUserIds = [selectedUserId]
    userFilterActive = true
  } else if (selectedUserQuery) {
    // User search query typed
    userFilterActive = true
    const { data: matchedUsers } = await supabase
      .from('profiles')
      .select('id')
      .or(`email.ilike.%${selectedUserQuery}%,full_name.ilike.%${selectedUserQuery}%`)
    matchedUserIds = (matchedUsers ?? []).map((u: any) => u.id)
  }

  // 2. Resolve matching products if search query is present and no exact productId is selected
  let matchedProductIds: string[] = []
  let productFilterActive = false
  if (selectedProductId) {
    matchedProductIds = [selectedProductId]
    productFilterActive = true
  } else if (selectedProductQuery) {
    productFilterActive = true
    const { data: matchedProducts } = await supabase
      .from('products')
      .select('id')
      .ilike('name', `%${selectedProductQuery}%`)
    matchedProductIds = (matchedProducts ?? []).map((p: any) => p.id)
  }

  // 3. Build DB query
  let selectStr = 'id, amount, original_amount, discount_pct, status, created_at, product_id, user_id, products(name, category)'
  if (selectedCategory) {
    selectStr = 'id, amount, original_amount, discount_pct, status, created_at, product_id, user_id, products!inner(name, category)'
  }

  let query = supabase
    .from('orders')
    .select(selectStr)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())
    .order('created_at', { ascending: false })

  if (userFilterActive) {
    if (matchedUserIds.length > 0) {
      query = query.in('user_id', matchedUserIds)
    } else {
      // If a user filter was active but matched nothing, return empty result
      query = query.eq('user_id', '00000000-0000-0000-0000-000000000000')
    }
  }

  if (productFilterActive) {
    if (matchedProductIds.length > 0) {
      query = query.in('product_id', matchedProductIds)
    } else {
      query = query.eq('product_id', '00000000-0000-0000-0000-000000000000')
    }
  }

  if (selectedStatus) {
    query = query.eq('status', selectedStatus)
  }
  
  if (selectedCategory) {
    query = query.eq('products.category', selectedCategory)
  }

  const { data: rawOrders } = await query
  const orders = rawOrders ?? []

  // Load user profiles to populate email/full_name in export rows
  const profileIds = Array.from(new Set(orders.map((order: any) => order.user_id).filter(Boolean)))
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, email, full_name').in('id', profileIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]))

  const totalAmount = orders
    .filter((o: any) => o.status === 'approved')
    .reduce((sum: number, o: any) => sum + (parseFloat(String(o.amount)) || 0), 0)

  // Rows for report spreadsheet
  const rows = [
    ['ID Pedido', 'Fecha', 'Cliente Email', 'Cliente Nombre', 'Producto', 'Categoría', 'Descuento (%)', 'Monto (PEN)', 'Estado'],
    ...orders.map((order: any) => {
      const profile = profileMap.get(order.user_id)
      return [
        order.id,
        new Date(order.created_at).toLocaleDateString('es-PE'),
        profile?.email || '',
        profile?.full_name || '',
        order.products?.name || 'Servicio',
        order.products?.category || 'General',
        `${order.discount_pct || 0}%`,
        order.amount,
        order.status === 'approved' ? 'Aprobado' : order.status === 'pending' ? 'Pendiente' : 'Rechazado'
      ]
    }),
    ['TOTAL APROBADO', '', '', '', '', '', '', totalAmount, '']
  ]

  const fromStr = from.toISOString().slice(0, 10)
  const toStr = to.toISOString().slice(0, 10)

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
    tr.total-row { font-weight: bold; background: #f1f5f9; }
  </style>
</head>
<body>
  <h2>Reporte Detallado Mundosubs</h2>
  <p>Filtros aplicados: Desde ${fromStr} hasta ${toStr} ${selectedUserQuery ? `- Usuario: ${selectedUserQuery}` : ''} ${selectedCategory ? `- Categoría: ${selectedCategory}` : ''} ${selectedStatus ? `- Estado: ${selectedStatus}` : ''}</p>
  <table>
    ${rows.map((row, index) => `
      <tr${index === rows.length - 1 ? ' class="total-row"' : ''}>
        ${row.map((cell, cellIndex) => index === 0
          ? `<th>${htmlCell(cell)}</th>`
          : `<td${cellIndex === 7 ? ' class="amount"' : ''}>${htmlCell(cell)}</td>`
        ).join('')}
      </tr>
    `).join('')}
  </table>
</body>
</html>`
    const filename = `mundosubs-reporte-detallado-${fromStr}-${toStr}.xls`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`
  const filename = `mundosubs-reporte-detallado-${fromStr}-${toStr}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
