import { useState, useEffect } from 'react'
import { api } from '../api'

export default function BudgetSummary({ year, onClose }) {
  const [loading, setLoading] = useState(true)
  const [budget, setBudget] = useState(null)
  const [activeTab, setActiveTab] = useState('type')

  useEffect(() => {
    loadBudget()
  }, [year])

  async function loadBudget() {
    setLoading(true)
    try {
      const data = await api.activities.getBudget(year)
      setBudget(data)
    } catch (error) {
      console.error('Failed to load budget:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-3xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Budget Summary - {year}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : budget && (
          <>
            {/* Totals */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {budget.totals?.total_sessions || 0}
                </p>
                <p className="text-sm text-gray-500">Total Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {budget.totals?.total_hours?.toFixed(1) || 0}
                </p>
                <p className="text-sm text-gray-500">Total Hours</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-teal-600">
                  {formatCurrency(budget.totals?.total_cost)}
                </p>
                <p className="text-sm text-gray-500">Total Cost</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex px-6">
                <button
                  onClick={() => setActiveTab('type')}
                  className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === 'type'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  By Training Type
                </button>
                <button
                  onClick={() => setActiveTab('trainer')}
                  className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === 'trainer'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  By Trainer
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {activeTab === 'type' && (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th className="pb-3">Type</th>
                      <th className="pb-3 text-right">Sessions</th>
                      <th className="pb-3 text-right">Hours</th>
                      <th className="pb-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {budget.byType?.map(item => (
                      <tr key={item.id}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium text-gray-900">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-gray-600">{item.session_count}</td>
                        <td className="py-3 text-right text-gray-600">{item.total_hours?.toFixed(1)}</td>
                        <td className="py-3 text-right font-medium text-gray-900">
                          {formatCurrency(item.total_cost)}
                        </td>
                      </tr>
                    ))}
                    {(!budget.byType || budget.byType.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No activities for this year
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'trainer' && (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th className="pb-3">Trainer</th>
                      <th className="pb-3 text-right">Hourly Rate</th>
                      <th className="pb-3 text-right">Sessions</th>
                      <th className="pb-3 text-right">Hours</th>
                      <th className="pb-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {budget.byTrainer?.map(item => (
                      <tr key={item.id}>
                        <td className="py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="py-3 text-right text-gray-600">
                          {formatCurrency(item.hourly_cost)}/t
                        </td>
                        <td className="py-3 text-right text-gray-600">{item.session_count}</td>
                        <td className="py-3 text-right text-gray-600">{item.total_hours?.toFixed(1)}</td>
                        <td className="py-3 text-right font-medium text-gray-900">
                          {formatCurrency(item.total_cost)}
                        </td>
                      </tr>
                    ))}
                    {(!budget.byTrainer || budget.byTrainer.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No trainer data for this year
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Note */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Costs are calculated based on scheduled activities for {year} only.
            </div>
          </>
        )}
      </div>
    </div>
  )
}

