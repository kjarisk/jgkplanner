/**
 * BudgetHeader - Header component for the budget page
 * Contains year selector, title, and action buttons
 */

import { Link } from 'react-router-dom'
import { Button } from '../common'
import { ExportMenu } from './ExportMenu'

export function BudgetHeader({ 
  year, 
  onYearChange, 
  onExport,
  onSettings 
}) {
  const years = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear - 2; y <= currentYear + 5; y++) {
    years.push(y)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budsjettrapport</h1>
            <p className="text-sm text-gray-500">Planlegg og spor kostnader og inntekter</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Year Selector */}
          <select
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Export Button */}
          <ExportMenu onExport={onExport} />

          {/* Settings Button */}
          {onSettings && (
            <Button variant="ghost" onClick={onSettings}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
