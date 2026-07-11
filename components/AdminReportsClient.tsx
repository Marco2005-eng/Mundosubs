'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, ReceiptText, Tag, TrendingUp, Users, Wallet, X, Check } from 'lucide-react'
import { formatPEN } from '@/lib/utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Product {
  id: string
  name: string
  category: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
}

interface Order {
  id: string
  amount: string
  original_amount: string
  discount_pct: number
  status: string
  created_at: string
  product_id: string
  user_id: string
  products: {
    name: string
    category: string
  } | null
}

interface AdminReportsClientProps {
  initialOrders: Order[]
  initialProducts: Product[]
  initialUsers: UserProfile[]
}

export function AdminReportsClient({ initialOrders, initialProducts, initialUsers }: AdminReportsClientProps) {
  // Date ranges
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1)
  const [fromDateStr, setFromDateStr] = useState(defaultFrom.toISOString().slice(0, 10))
  const [toDateStr, setToDateStr] = useState(now.toISOString().slice(0, 10))

  // Filters
  const [userQuery, setUserQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Autocomplete refs and visibility states
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [showProductAutocomplete, setShowProductAutocomplete] = useState(false)
  
  const autocompleteRef = useRef<HTMLDivElement>(null)
  const productAutocompleteRef = useRef<HTMLDivElement>(null)

  // Close autocompletes on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false)
      }
      if (productAutocompleteRef.current && !productAutocompleteRef.current.contains(event.target as Node)) {
        setShowProductAutocomplete(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Create user map for fast lookup
  const userMap = useMemo(() => {
    return new Map(initialUsers.map((u) => [u.id, u]))
  }, [initialUsers])

  // Filtered users for autocomplete list
  const filteredUsersList = useMemo(() => {
    if (!userQuery.trim()) return []
    const q = userQuery.toLowerCase()
    return initialUsers.filter((u) => 
      u.email.toLowerCase().includes(q) || 
      (u.full_name && u.full_name.toLowerCase().includes(q))
    ).slice(0, 8)
  }, [initialUsers, userQuery])

  // Filtered products for autocomplete list
  const filteredProductsList = useMemo(() => {
    if (!productQuery.trim()) return []
    const q = productQuery.toLowerCase()
    return initialProducts.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8)
  }, [initialProducts, productQuery])

  // Reset page when filters change
  const resetPagination = () => setCurrentPage(1)

  // Live filter logic
  const filteredOrders = useMemo(() => {
    const start = new Date(`${fromDateStr}T00:00:00`).getTime()
    const end = new Date(`${toDateStr}T23:59:59.999`).getTime()

    return initialOrders.filter((order) => {
      const orderTime = new Date(order.created_at).getTime()
      if (orderTime < start || orderTime > end) return false

      if (selectedStatus && order.status !== selectedStatus) return false
      if (selectedCategory && order.products?.category !== selectedCategory) return false

      // Product filter
      if (selectedProductId) {
        if (order.product_id !== selectedProductId) return false
      } else if (productQuery.trim()) {
        const prodName = order.products?.name || ''
        if (!prodName.toLowerCase().includes(productQuery.toLowerCase())) return false
      }

      // User filter
      if (selectedUserId) {
        if (order.user_id !== selectedUserId) return false
      } else if (userQuery.trim()) {
        const user = userMap.get(order.user_id)
        if (!user) return false
        const q = userQuery.toLowerCase()
        const matchEmail = user.email.toLowerCase().includes(q)
        const matchName = user.full_name && user.full_name.toLowerCase().includes(q)
        if (!matchEmail && !matchName) return false
      }

      return true
    })
  }, [initialOrders, fromDateStr, toDateStr, selectedStatus, selectedProductId, productQuery, selectedCategory, selectedUserId, userQuery, userMap])

  // Metrics
  const totalAmount = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'approved')
      .reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0)
  }, [filteredOrders])

  const pendingAmount = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'pending')
      .reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0)
  }, [filteredOrders])

  const discountAmount = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'approved')
      .reduce((sum, o) => {
        const amt = parseFloat(o.amount) || 0
        const orig = parseFloat(o.original_amount) || amt
        return sum + Math.max(0, orig - amt)
      }, 0)
  }, [filteredOrders])

  const totalOrdersCount = filteredOrders.length
  const approvedOrdersCount = filteredOrders.filter((o) => o.status === 'approved').length

  // Top 5 ranking
  const rankingList = useMemo(() => {
    const productRankingMap = new Map<string, { name: string; amount: number; count: number }>()
    for (const o of filteredOrders) {
      if (o.status !== 'approved') continue
      const key = o.product_id || 'unknown'
      const name = o.products?.name || 'Servicio'
      const item = productRankingMap.get(key) ?? { name, amount: 0, count: 0 }
      item.amount += parseFloat(o.amount) || 0
      item.count += 1
      productRankingMap.set(key, item)
    }
    return Array.from(productRankingMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [filteredOrders])

  // Paginated slice
  const paginatedOrders = useMemo(() => {
    const fromIndex = (currentPage - 1) * limit
    const toIndex = fromIndex + limit
    return filteredOrders.slice(fromIndex, toIndex)
  }, [filteredOrders, currentPage, limit])

  const totalPages = Math.ceil(filteredOrders.length / limit) || 1

  // Export params for Excel/CSV
  const reportParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('from', fromDateStr)
    params.set('to', toDateStr)
    if (selectedUserId) params.set('userId', selectedUserId)
    else if (userQuery.trim()) params.set('userQuery', userQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedProductId) params.set('productId', selectedProductId)
    else if (productQuery.trim()) params.set('productQuery', productQuery)
    if (selectedStatus) params.set('status', selectedStatus)
    return params.toString()
  }, [fromDateStr, toDateStr, selectedUserId, userQuery, selectedCategory, selectedProductId, productQuery, selectedStatus])

  // Direct Vector PDF Generation and Download
  const downloadPDF = () => {
    const doc = new jsPDF()

    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(92, 53, 176) // #5c35b0 purple
    doc.text('REPORTE DETALLADO DE VENTAS - MUNDOSUBS', 14, 20)

    // Subtitle / Info
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139) // Slate gray
    const subtitle = `Periodo: ${new Date(`${fromDateStr}T00:00:00`).toLocaleDateString('es-PE')} - ${new Date(`${toDateStr}T00:00:00`).toLocaleDateString('es-PE')}`
    
    const filters = [
      selectedCategory ? `Categoría: ${selectedCategory.toUpperCase()}` : '',
      selectedStatus ? `Estado: ${selectedStatus.toUpperCase()}` : '',
      selectedUserId ? `Cliente: ${userMap.get(selectedUserId)?.email}` : userQuery.trim() ? `Cliente: ${userQuery}` : '',
      selectedProductId ? `Producto: ${initialProducts.find(p => p.id === selectedProductId)?.name}` : productQuery.trim() ? `Producto: ${productQuery}` : ''
    ].filter(Boolean).join(' | ')
    
    doc.text(subtitle, 14, 26)
    if (filters) {
      doc.text(`Filtros aplicados: ${filters}`, 14, 31)
    }

    // Draw KPI Summary
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, 36, 182, 18, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('TOTAL FACTURADO', 18, 42)
    doc.text('FACT. PENDIENTE', 64, 42)
    doc.text('DESC. OTORGADOS', 110, 42)
    doc.text('TOTAL PEDIDOS', 156, 42)

    doc.setFontSize(10)
    doc.setTextColor(22, 163, 74) // Green
    doc.text(formatPEN(totalAmount), 18, 49)
    doc.setTextColor(249, 115, 22) // Orange
    doc.text(formatPEN(pendingAmount), 64, 49)
    doc.setTextColor(168, 85, 247) // Purple
    doc.text(formatPEN(discountAmount), 110, 49)
    doc.setTextColor(15, 23, 42) // Black
    doc.text(`${approvedOrdersCount} / ${totalOrdersCount}`, 156, 49)

    // Table Data mapping
    const tableBody = filteredOrders.map((order) => {
      const user = userMap.get(order.user_id)
      return [
        new Date(order.created_at).toLocaleDateString('es-PE'),
        user?.full_name ? `${user.full_name} (${user.email})` : user?.email || '',
        order.products?.name || 'Servicio',
        order.products?.category || 'General',
        order.discount_pct > 0 ? `${order.discount_pct}%` : '0%',
        formatPEN(parseFloat(order.amount)),
        order.status === 'approved' ? 'Aprobado' : order.status === 'pending' ? 'Pendiente' : 'Rechazado'
      ]
    })

    // Subtotal Row
    tableBody.push([
      'TOTAL FACTURADO',
      '',
      '',
      '',
      '',
      formatPEN(totalAmount),
      ''
    ])

    // Draw Table
    autoTable(doc, {
      startY: 58,
      head: [['Fecha', 'Cliente', 'Producto', 'Categoría', 'Descuento', 'Monto', 'Estado']],
      body: tableBody,
      headStyles: {
        fillColor: [92, 53, 176],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      columnStyles: {
        5: { fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        // Style subtotal row at bottom
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [241, 245, 249]
          if (data.column.index === 5) {
            data.cell.styles.textColor = [22, 163, 74]
          }
        }
      },
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3
      }
    })

    // Save/Download PDF
    const fromStr = fromDateStr.replace(/-/g, '')
    const toStr = toDateStr.replace(/-/g, '')
    doc.save(`mundosubs-reporte-${fromStr}-${toStr}.pdf`)
  }

  return (
    <div style={{ padding: '40px 5%', maxWidth: '1260px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/admin" style={backStyle}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <div>
            <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: '1.55rem', fontWeight: 800, color: 'var(--text)' }}>
              Reportes Detallados
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>
              Reportes interactivos en tiempo real con autocompletado avanzado
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href={`/api/admin/reports?format=xls&${reportParams}`} style={exportBtnStyle}>
            <Download style={{ width: 16, height: 16 }} />
            Exportar Excel
          </a>
          <a href={`/api/admin/reports?${reportParams}`} style={exportBtnStyle}>
            CSV
          </a>
          <button onClick={downloadPDF} style={{ ...exportBtnStyle, color: 'var(--text)', border: '1px solid var(--border2)', background: 'var(--bg3)', cursor: 'pointer' }}>
            PDF
          </button>
        </div>
      </div>

      {/* Interactive Filters Panel */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '18px', fontFamily: "'Unbounded', sans-serif" }}>
          Panel de Filtros Interactivos (Actualización Instantánea)
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={labelStyle}>Desde</label>
            <input 
              type="date" 
              value={fromDateStr} 
              onChange={(e) => { setFromDateStr(e.target.value); resetPagination(); }} 
              className="input-dark" 
              style={{ width: '100%', minHeight: 38 }} 
            />
          </div>

          <div>
            <label style={labelStyle}>Hasta</label>
            <input 
              type="date" 
              value={toDateStr} 
              onChange={(e) => { setToDateStr(e.target.value); resetPagination(); }} 
              className="input-dark" 
              style={{ width: '100%', minHeight: 38 }} 
            />
          </div>

          <div style={{ position: 'relative' }} ref={autocompleteRef}>
            <label style={labelStyle}>Buscar Cliente</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Nombre o email..."
                value={userQuery}
                onChange={(e) => {
                  setUserQuery(e.target.value);
                  setSelectedUserId('');
                  setShowAutocomplete(true);
                  resetPagination();
                }}
                onFocus={() => setShowAutocomplete(true)}
                className="input-dark"
                style={{ width: '100%', minHeight: 38, paddingRight: selectedUserId ? '30px' : '10px' }}
              />
              {selectedUserId && (
                <X 
                  onClick={() => {
                    setSelectedUserId('');
                    setUserQuery('');
                  }} 
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: 'var(--muted)',
                    cursor: 'pointer'
                  }} 
                />
              )}
            </div>
            {showAutocomplete && filteredUsersList.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--card)',
                border: '1px solid var(--border2)',
                borderRadius: '8px',
                marginTop: '4px',
                zIndex: 100,
                maxHeight: '200px',
                overflowY: 'auto',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
              }}>
                {filteredUsersList.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setUserQuery(u.full_name ? `${u.full_name} (${u.email})` : u.email);
                      setShowAutocomplete(false);
                      resetPagination();
                    }}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border2)',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--text)'
                    }}
                    className="autocomplete-item"
                  >
                    <span>{u.full_name ? `${u.full_name} - ${u.email}` : u.email}</span>
                    {selectedUserId === u.id && <Check style={{ width: 14, height: 14, color: 'var(--green)' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Categoría</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => { setSelectedCategory(e.target.value); resetPagination(); }} 
              className="input-dark" 
              style={{ width: '100%', minHeight: 38 }}
            >
              <option value="">Todas las categorías</option>
              {initialProducts.reduce((cats: string[], p) => {
                if (p.category && !cats.includes(p.category)) cats.push(p.category);
                return cats;
              }, []).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative' }} ref={productAutocompleteRef}>
            <label style={labelStyle}>Buscar Producto</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Nombre del producto..."
                value={productQuery}
                onChange={(e) => {
                  setProductQuery(e.target.value);
                  setSelectedProductId('');
                  setShowProductAutocomplete(true);
                  resetPagination();
                }}
                onFocus={() => setShowProductAutocomplete(true)}
                className="input-dark"
                style={{ width: '100%', minHeight: 38, paddingRight: selectedProductId ? '30px' : '10px' }}
              />
              {selectedProductId && (
                <X 
                  onClick={() => {
                    setSelectedProductId('');
                    setProductQuery('');
                  }} 
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%',
                    width: '16px',
                    height: '16px',
                    color: 'var(--muted)',
                    cursor: 'pointer'
                  }} 
                />
              )}
            </div>
            {showProductAutocomplete && filteredProductsList.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--card)',
                border: '1px solid var(--border2)',
                borderRadius: '8px',
                marginTop: '4px',
                zIndex: 100,
                maxHeight: '200px',
                overflowY: 'auto',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
              }}>
                {filteredProductsList.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setProductQuery(p.name);
                      setShowProductAutocomplete(false);
                      resetPagination();
                    }}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border2)',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--text)'
                    }}
                    className="autocomplete-item"
                  >
                    <span>{p.name} ({p.category})</span>
                    {selectedProductId === p.id && <Check style={{ width: 14, height: 14, color: 'var(--green)' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Estado</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => { setSelectedStatus(e.target.value); resetPagination(); }} 
              className="input-dark" 
              style={{ width: '100%', minHeight: 38 }}
            >
              <option value="">Todos los estados</option>
              <option value="approved">Aprobado</option>
              <option value="pending">Pendiente</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>

          <div>
            <button 
              onClick={() => {
                setFromDateStr(defaultFrom.toISOString().slice(0, 10));
                setToDateStr(now.toISOString().slice(0, 10));
                setSelectedUserId('');
                setUserQuery('');
                setSelectedProductId('');
                setProductQuery('');
                setSelectedCategory('');
                setSelectedStatus('');
                resetPagination();
              }}
              className="btn-secondary" 
              style={{ width: '100%', minHeight: 38 }}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Facturado" value={formatPEN(totalAmount)} icon={TrendingUp} color="var(--green)" bg="rgba(34,197,94,0.1)" />
        <StatCard label="Facturación Pendiente" value={formatPEN(pendingAmount)} icon={Wallet} color="var(--hot)" bg="rgba(249,115,22,0.1)" />
        <StatCard label="Descuentos Otorgados" value={formatPEN(discountAmount)} icon={Tag} color="var(--accent2)" bg="rgba(124,58,237,0.1)" />
        <StatCard label="Total Pedidos" value={`${approvedOrdersCount} / ${totalOrdersCount}`} icon={ReceiptText} color="var(--text)" bg="rgba(255,255,255,0.05)" />
      </section>

      {/* Ranking Widget (Horizontal Cards style above table) */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '16px', fontFamily: "'Unbounded', sans-serif" }}>
          Top 5 Servicios Más Vendidos del Periodo
        </h2>
        {rankingList.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>No hay ventas aprobadas en este periodo.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {rankingList.map((item, idx) => {
              const max = Math.max(...rankingList.map((r) => r.amount), 1)
              return (
                <div key={idx} style={{ background: 'var(--bg2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800 }}>#{idx + 1}</span>
                    <span>{item.count} ventas</span>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '8px' }}>
                    {item.name}
                  </div>
                  <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 999, overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ width: `${(item.amount / max) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))' }} />
                  </div>
                  <strong style={{ color: 'var(--green)', fontSize: '0.9rem' }}>{formatPEN(item.amount)}</strong>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Complete Full Width Details Table */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border2)',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        overflowX: 'auto',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '16px', fontFamily: "'Unbounded', sans-serif" }}>
          Detalle Completo del Reporte ({filteredOrders.length} pedidos)
        </h2>
        {paginatedOrders.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>
            No se encontraron pedidos con los filtros seleccionados.
          </p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border2)', textAlign: 'left' }}>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Cliente</th>
                  <th style={thStyle}>Producto</th>
                  <th style={thStyle}>Categoría</th>
                  <th style={thStyle}>Descuento</th>
                  <th style={thStyle}>Monto</th>
                  <th style={thStyle}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order: any) => {
                  const user = userMap.get(order.user_id)
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border2)', transition: 'background-color 0.2s' }} className="hover-row">
                      <td style={tdStyle}>{new Date(order.created_at).toLocaleDateString('es-PE')}</td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {user?.full_name || 'Sin nombre'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {user?.email}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>{order.products?.name || 'Servicio'}</td>
                      <td style={tdStyle}>
                        <span style={badgeStyle}>
                          {order.products?.category || 'General'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {order.discount_pct > 0 ? `${order.discount_pct}%` : '0%'}
                      </td>
                      <td style={tdStyle}>
                        <strong style={{ color: order.status === 'approved' ? 'var(--green)' : 'var(--text)' }}>
                          {formatPEN(parseFloat(order.amount))}
                        </strong>
                      </td>
                      <td style={tdStyle}>
                        <span style={statusBadgeStyle(order.status)}>
                          {order.status === 'approved' ? 'Aprobado' : order.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  style={{ minHeight: 34, padding: '0 12px', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary"
                  style={{ minHeight: 34, padding: '0 12px', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
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

const exportBtnStyle = {
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
}

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--muted)',
  marginBottom: '6px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px'
}

const thStyle = {
  padding: '12px 16px',
  color: 'var(--muted)',
  fontWeight: 700,
  fontSize: '0.78rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px'
}

const tdStyle = {
  padding: '14px 16px',
  color: 'var(--text)',
  verticalAlign: 'middle'
}

const badgeStyle = {
  background: 'var(--bg3)',
  color: 'var(--muted)',
  padding: '3px 8px',
  borderRadius: '4px',
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase' as const
}

function statusBadgeStyle(status: string) {
  const isApproved = status === 'approved'
  const isPending = status === 'pending'
  return {
    display: 'inline-block',
    background: isApproved ? 'rgba(34,197,94,0.1)' : isPending ? 'rgba(249,115,22,0.1)' : 'rgba(239,68,68,0.1)',
    color: isApproved ? 'var(--green)' : isPending ? 'var(--hot)' : '#ef4444',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 800
  }
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: string; icon: any; color: string; bg: string }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border2)',
      borderRadius: '12px',
      padding: '18px'
    }}>
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
