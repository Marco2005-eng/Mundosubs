'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Download } from 'lucide-react'
import { formatPEN } from '@/lib/utils'

interface ExportButtonsProps {
  excelUrl: string
  csvUrl: string
  orders: any[]
  expenses: any[]
  series: any[]
  totalIncome: number
  totalExpenses: number
  profit: number
  averageTicket: number
  pendingAmount: number
  discountAmount: number
  fromDateStr: string
  toDateStr: string
  selectedCategory: string
}

export function AdminFinancesExportButtons({
  excelUrl,
  csvUrl,
  orders,
  expenses,
  series,
  totalIncome,
  totalExpenses,
  profit,
  averageTicket,
  pendingAmount,
  discountAmount,
  fromDateStr,
  toDateStr,
  selectedCategory
}: ExportButtonsProps) {

  const downloadPDF = () => {
    const doc = new jsPDF()

    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(92, 53, 176) // #5c35b0
    doc.text('REPORTE FINANCIERO Y CONTROL DE CAJA - MUNDOSUBS', 14, 20)

    // Subtitle
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    const subtitle = `Periodo: ${new Date(`${fromDateStr}T00:00:00`).toLocaleDateString('es-PE')} - ${new Date(`${toDateStr}T00:00:00`).toLocaleDateString('es-PE')}`
    doc.text(subtitle, 14, 26)
    if (selectedCategory) {
      doc.text(`Filtro por Categoría: ${selectedCategory.toUpperCase()}`, 14, 31)
    }

    // KPIs summary block (Rectangles)
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, 35, 182, 20, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('INGRESOS APROBADOS', 18, 41)
    doc.text('EGRESOS TOTALES', 58, 41)
    doc.text('UTILIDAD NETA', 98, 41)
    doc.text('TICKET PROMEDIO', 138, 41)
    doc.text('VENTAS', 174, 41)

    doc.setFontSize(9)
    doc.setTextColor(22, 163, 74) // Green
    doc.text(formatPEN(totalIncome), 18, 48)
    doc.setTextColor(220, 38, 38) // Red
    doc.text(formatPEN(totalExpenses), 58, 48)
    doc.setTextColor(profit >= 0 ? 22 : 220, profit >= 0 ? 163 : 38, profit >= 0 ? 74 : 38)
    doc.text(formatPEN(profit), 98, 48)
    doc.setTextColor(249, 115, 22) // Orange
    doc.text(formatPEN(averageTicket), 138, 48)
    doc.setTextColor(15, 23, 42)
    doc.text(String(orders.length), 174, 48)

    // Draw Vector Line Chart inside PDF!
    let nextStartY = 60
    if (series && series.length > 1) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      doc.text('Gráfico de Tendencia del Periodo (Ingresos vs Egresos)', 14, 63)

      const chartX = 14
      const chartY = 68
      const chartW = 182
      const chartH = 40

      // Chart background
      doc.setFillColor(250, 250, 250)
      doc.rect(chartX, chartY, chartW, chartH, 'F')
      doc.setDrawColor(226, 232, 240)
      doc.rect(chartX, chartY, chartW, chartH, 'D')

      // Find max value for scaling
      const values = series.flatMap(s => [s.income, s.expense])
      const maxVal = Math.max(...values, 1)

      // Draw grid lines
      doc.setDrawColor(241, 245, 249)
      doc.setLineWidth(0.2)
      for (let i = 1; i <= 4; i++) {
        const y = chartY + (chartH * i) / 5
        doc.line(chartX, y, chartX + chartW, y)
      }

      // Draw lines
      const pointsCount = series.length
      const getX = (idx: number) => chartX + 10 + (idx / (pointsCount - 1)) * (chartW - 20)
      const getY = (val: number) => chartY + chartH - 5 - (val / maxVal) * (chartH - 10)

      doc.setLineWidth(0.8)
      
      // Draw Incomes (Green)
      doc.setDrawColor(34, 197, 94)
      for (let i = 0; i < pointsCount - 1; i++) {
        doc.line(getX(i), getY(series[i].income), getX(i + 1), getY(series[i + 1].income))
      }

      // Draw Expenses (Red)
      doc.setDrawColor(239, 68, 68)
      for (let i = 0; i < pointsCount - 1; i++) {
        doc.line(getX(i), getY(series[i].expense), getX(i + 1), getY(series[i + 1].expense))
      }

      // Draw labels
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(148, 163, 184)
      for (let i = 0; i < pointsCount; i++) {
        if (i % Math.ceil(pointsCount / 6) === 0) {
          doc.text(series[i].label, getX(i), chartY + chartH - 1, { align: 'center' })
        }
      }

      // Legend
      doc.setFontSize(7)
      doc.setTextColor(34, 197, 94)
      doc.text('Ingresos (Verde)', chartX + 4, chartY + 4)
      doc.setTextColor(239, 68, 68)
      doc.text('Egresos (Rojo)', chartX + 35, chartY + 4)

      nextStartY = 115
    }

    // Table 1: Ingresos Aprobados
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('DETALLE DE INGRESOS APROBADOS', 14, nextStartY)

    const incomeBody = orders.map((order) => [
      new Date(order.created_at).toLocaleDateString('es-PE'),
      order.products?.name || 'Servicio',
      order.products?.category || 'General',
      order.users?.full_name || order.users?.email || '',
      formatPEN(parseFloat(order.amount))
    ])
    incomeBody.push(['TOTAL INGRESOS', '', '', '', formatPEN(totalIncome)])

    autoTable(doc, {
      startY: nextStartY + 4,
      head: [['Fecha', 'Detalle/Producto', 'Categoría', 'Cliente', 'Monto']],
      body: incomeBody,
      headStyles: {
        fillColor: [92, 53, 176],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        4: { fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.row.index === incomeBody.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [241, 245, 249]
          if (data.column.index === 4) {
            data.cell.styles.textColor = [22, 163, 74]
          }
        }
      },
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 }
    })

    // Table 2: Egresos Registrados
    let expensesStartY = (doc as any).lastAutoTable.finalY + 12
    
    // Check if we need to add a page break for the expenses table
    if (expensesStartY > 260) {
      doc.addPage()
      expensesStartY = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('DETALLE DE EGRESOS REGISTRADOS', 14, expensesStartY)

    const expenseBody = expenses.map((expense) => [
      new Date(expense.occurred_at).toLocaleDateString('es-PE'),
      expense.label,
      expense.category,
      expense.vendor || '',
      formatPEN(parseFloat(expense.amount))
    ])
    expenseBody.push(['TOTAL EGRESOS', '', '', '', formatPEN(totalExpenses)])

    autoTable(doc, {
      startY: expensesStartY + 4,
      head: [['Fecha', 'Detalle/Egreso', 'Categoría', 'Proveedor', 'Monto']],
      body: expenseBody,
      headStyles: {
        fillColor: [220, 38, 38], // Dark red for expenses header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        4: { fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.row.index === expenseBody.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [241, 245, 249]
          if (data.column.index === 4) {
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
      },
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 }
    })

    // Save/Download
    const fromStr = fromDateStr.replace(/-/g, '')
    const toStr = toDateStr.replace(/-/g, '')
    doc.save(`mundosubs-finanzas-${fromStr}-${toStr}.pdf`)
  }

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <a href={excelUrl} style={exportBtnStyle}>
        <Download style={{ width: 16, height: 16 }} />
        Exportar Excel
      </a>
      <a href={csvUrl} style={exportBtnStyle}>
        CSV
      </a>
      <button onClick={downloadPDF} style={{ ...exportBtnStyle, color: 'var(--text)', border: '1px solid var(--border2)', background: 'var(--bg3)', cursor: 'pointer' }}>
        PDF
      </button>
    </div>
  )
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
