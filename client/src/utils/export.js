/**
 * Export utilities for budget data
 * Supports Excel, CSV, and PDF export
 */

import { formatCurrency, formatNumber } from './format'

/**
 * Export budget report to Excel format
 * Uses SheetJS (xlsx) library
 */
export async function exportBudgetToExcel(report, year) {
  // Dynamically import xlsx to avoid bundle size issues
  const XLSX = await import('xlsx')
  
  const workbook = XLSX.utils.book_new()
  
  // Overview sheet
  const overviewData = [
    ['Budsjettrapport', year],
    [],
    ['Sammendrag'],
    ['Planlagt budsjett', report.planned_budget],
    ['Totale kostnader', report.total_costs],
    ['Totale inntekter', report.total_income],
    ['Balanse', report.balance],
    [],
    ['Nettoresultat', report.total_income - report.total_costs]
  ]
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData)
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Oversikt')
  
  // Sections sheet
  const sectionsData = [
    ['Seksjon', 'Kostnader', 'Inntekter', 'Netto']
  ]
  report.sections?.forEach(section => {
    sectionsData.push([
      section.name,
      section.total_cost,
      section.total_income,
      section.net
    ])
  })
  sectionsData.push([])
  sectionsData.push(['Total', report.total_costs, report.total_income, report.total_income - report.total_costs])
  
  const sectionsSheet = XLSX.utils.aoa_to_sheet(sectionsData)
  XLSX.utils.book_append_sheet(workbook, sectionsSheet, 'Seksjoner')
  
  // Details per section
  report.sections?.forEach(section => {
    if (section.costs && section.costs.length > 0) {
      const sectionData = [
        [section.name],
        [],
        ['Beskrivelse', 'Antall', 'Pris', 'Total']
      ]
      section.costs.forEach(cost => {
        sectionData.push([
          cost.description,
          cost.units,
          cost.unit_cost,
          cost.total
        ])
      })
      sectionData.push([])
      sectionData.push(['Total', '', '', section.total_cost])
      
      // Sanitize sheet name (max 31 chars, no special chars)
      const sheetName = section.name.substring(0, 31).replace(/[\\/*?:\[\]]/g, '')
      const sectionSheet = XLSX.utils.aoa_to_sheet(sectionData)
      XLSX.utils.book_append_sheet(workbook, sectionSheet, sheetName)
    }
  })
  
  // Income sheet
  if (report.income_entries && report.income_entries.length > 0) {
    const incomeData = [
      ['Dato', 'Beskrivelse', 'Type', 'Beløp']
    ]
    report.income_entries.forEach(entry => {
      incomeData.push([
        entry.date,
        entry.description || '-',
        entry.training_type?.name || '-',
        entry.amount
      ])
    })
    incomeData.push([])
    incomeData.push(['Total', '', '', report.total_income])
    
    const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData)
    XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Inntekter')
  }
  
  // Generate and download file
  const filename = `budsjett_${year}.xlsx`
  XLSX.writeFile(workbook, filename)
}

/**
 * Export budget report to CSV format
 */
export function exportBudgetToCsv(report, year) {
  const rows = []
  
  // Header
  rows.push(['Budsjettrapport', year])
  rows.push([])
  
  // Summary
  rows.push(['Sammendrag'])
  rows.push(['Planlagt budsjett', report.planned_budget])
  rows.push(['Totale kostnader', report.total_costs])
  rows.push(['Totale inntekter', report.total_income])
  rows.push(['Balanse', report.balance])
  rows.push([])
  
  // Sections
  rows.push(['Seksjoner'])
  rows.push(['Seksjon', 'Kostnader', 'Inntekter', 'Netto'])
  report.sections?.forEach(section => {
    rows.push([section.name, section.total_cost, section.total_income, section.net])
  })
  rows.push(['Total', report.total_costs, report.total_income, report.total_income - report.total_costs])
  rows.push([])
  
  // Details
  report.sections?.forEach(section => {
    if (section.costs && section.costs.length > 0) {
      rows.push([section.name])
      rows.push(['Beskrivelse', 'Antall', 'Pris', 'Total'])
      section.costs.forEach(cost => {
        rows.push([cost.description, cost.units, cost.unit_cost, cost.total])
      })
      rows.push([])
    }
  })
  
  // Income
  if (report.income_entries && report.income_entries.length > 0) {
    rows.push(['Inntekter'])
    rows.push(['Dato', 'Beskrivelse', 'Type', 'Beløp'])
    report.income_entries.forEach(entry => {
      rows.push([entry.date, entry.description || '-', entry.training_type?.name || '-', entry.amount])
    })
  }
  
  // Convert to CSV string
  const csvContent = rows
    .map(row => row.map(cell => {
      // Escape quotes and wrap in quotes if needed
      const str = String(cell ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(','))
    .join('\n')
  
  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `budsjett_${year}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Export budget report to PDF format
 * Uses browser print dialog with special styling
 */
export function exportBudgetToPdf(report, year) {
  // Create a printable HTML document
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Popup blokkert. Vennligst tillat popups for denne siden.')
    return
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Budsjettrapport ${year}</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 { font-size: 24px; margin-bottom: 20px; }
        h2 { font-size: 18px; margin-top: 30px; margin-bottom: 10px; border-bottom: 2px solid #14b8a6; padding-bottom: 5px; }
        h3 { font-size: 14px; margin-top: 20px; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; }
        .text-right { text-align: right; }
        .text-red { color: #dc2626; }
        .text-green { color: #16a34a; }
        .text-bold { font-weight: 600; }
        .summary-card { 
          display: inline-block; 
          padding: 15px 20px; 
          background: #f9fafb; 
          border-radius: 8px; 
          margin-right: 10px;
          margin-bottom: 10px;
        }
        .summary-card .label { font-size: 12px; color: #6b7280; }
        .summary-card .value { font-size: 20px; font-weight: 600; }
        .total-row { background: #f9fafb; font-weight: 600; }
        @media print {
          body { padding: 0; }
          h2 { page-break-after: avoid; }
          table { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>Budsjettrapport ${year}</h1>
      
      <div style="margin-bottom: 30px;">
        <div class="summary-card">
          <div class="label">Planlagt budsjett</div>
          <div class="value">${formatCurrency(report.planned_budget)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Totale kostnader</div>
          <div class="value text-red">${formatCurrency(report.total_costs)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Totale inntekter</div>
          <div class="value text-green">${formatCurrency(report.total_income)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Balanse</div>
          <div class="value ${report.balance >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(report.balance)}</div>
        </div>
      </div>
      
      <h2>Seksjoner</h2>
      <table>
        <thead>
          <tr>
            <th>Seksjon</th>
            <th class="text-right">Kostnader</th>
            <th class="text-right">Inntekter</th>
            <th class="text-right">Netto</th>
          </tr>
        </thead>
        <tbody>
          ${report.sections?.map(section => `
            <tr>
              <td>${section.name}</td>
              <td class="text-right text-red">${formatCurrency(section.total_cost)}</td>
              <td class="text-right text-green">${section.total_income > 0 ? formatCurrency(section.total_income) : '-'}</td>
              <td class="text-right text-bold ${section.net >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(section.net)}</td>
            </tr>
          `).join('') || ''}
          <tr class="total-row">
            <td>Total</td>
            <td class="text-right text-red">${formatCurrency(report.total_costs)}</td>
            <td class="text-right text-green">${formatCurrency(report.total_income)}</td>
            <td class="text-right ${(report.total_income - report.total_costs) >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(report.total_income - report.total_costs)}</td>
          </tr>
        </tbody>
      </table>
      
      ${report.sections?.map(section => {
        if (!section.costs || section.costs.length === 0) return ''
        return `
          <h3>${section.name}</h3>
          <table>
            <thead>
              <tr>
                <th>Beskrivelse</th>
                <th class="text-right">Antall</th>
                <th class="text-right">Pris</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${section.costs.map(cost => `
                <tr>
                  <td>${cost.description}</td>
                  <td class="text-right">${formatNumber(cost.units, 1)}</td>
                  <td class="text-right">${formatCurrency(cost.unit_cost)}</td>
                  <td class="text-right">${formatCurrency(cost.total)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">Total</td>
                <td class="text-right">${formatCurrency(section.total_cost)}</td>
              </tr>
            </tbody>
          </table>
        `
      }).join('') || ''}
      
      ${report.income_entries && report.income_entries.length > 0 ? `
        <h2>Inntekter</h2>
        <table>
          <thead>
            <tr>
              <th>Dato</th>
              <th>Beskrivelse</th>
              <th>Type</th>
              <th class="text-right">Beløp</th>
            </tr>
          </thead>
          <tbody>
            ${report.income_entries.map(entry => `
              <tr>
                <td>${new Date(entry.date).toLocaleDateString('no-NO')}</td>
                <td>${entry.description || '-'}</td>
                <td>${entry.training_type?.name || '-'}</td>
                <td class="text-right text-green">${formatCurrency(entry.amount)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">Total</td>
              <td class="text-right text-green">${formatCurrency(report.total_income)}</td>
            </tr>
          </tbody>
        </table>
      ` : ''}
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          }
        }
      </script>
    </body>
    </html>
  `
  
  printWindow.document.write(html)
  printWindow.document.close()
}
