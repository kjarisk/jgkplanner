import { useState, useEffect } from 'react'
import { api } from '../api'
import { getTodayString } from '../utils/date'
import { formatCurrency } from '../utils/format'

export default function BudgetSummary({ year, activities = [], onClose }) {
  const [loading, setLoading] = useState(true)
  const [budget, setBudget] = useState(null)
  const [budgetData, setBudgetData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Budget input state
  const [plannedBudget, setPlannedBudget] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)
  
  // Income form state
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [incomeForm, setIncomeForm] = useState({
    unit_amount: '',
    quantity: '1',
    description: '',
    date: getTodayString(),
    activity_id: ''
  })
  const [savingIncome, setSavingIncome] = useState(false)

  // Calculate total from unit_amount × quantity
  const calculatedTotal = (parseFloat(incomeForm.unit_amount) || 0) * (parseInt(incomeForm.quantity) || 1)

  // Get activities for the current year for linking
  const yearActivities = activities
    .filter(a => a.date?.startsWith(String(year)))
    .sort((a, b) => a.date.localeCompare(b.date))

  useEffect(() => {
    loadData()
  }, [year])

  async function loadData() {
    setLoading(true)
    try {
      // Load activity-based budget data (always works)
      const budgetResponse = await api.activities.getBudget(year)
      setBudget(budgetResponse)
      
      // Try to load income/planned budget data (new feature)
      try {
        const incomeResponse = await api.budget.get(year)
        setBudgetData(incomeResponse)
        setPlannedBudget(incomeResponse.planned_budget || '')
      } catch (incomeError) {
        // Budget endpoints not available yet - use fallback
        console.warn('Budget income endpoints not available:', incomeError.message)
        setBudgetData({ planned_budget: 0, income_entries: [], total_income: 0 })
        setPlannedBudget('')
      }
    } catch (error) {
      console.error('Failed to load budget:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBudget() {
    if (!plannedBudget || parseFloat(plannedBudget) < 0) return
    
    setSavingBudget(true)
    try {
      await api.budget.set(year, { planned_budget: parseFloat(plannedBudget) })
      await loadData()
    } catch (error) {
      console.error('Failed to save budget:', error)
      alert('Failed to save budget. Please restart the server to enable budget features.')
    } finally {
      setSavingBudget(false)
    }
  }

  async function handleAddIncome(e) {
    e.preventDefault()
    if (!incomeForm.unit_amount || !incomeForm.date) return
    
    setSavingIncome(true)
    try {
      await api.budget.addIncome({
        year,
        unit_amount: parseFloat(incomeForm.unit_amount),
        quantity: parseInt(incomeForm.quantity) || 1,
        description: incomeForm.description,
        date: incomeForm.date,
        activity_id: incomeForm.activity_id || null
      })
      setIncomeForm({
        unit_amount: '',
        quantity: '1',
        description: '',
        date: getTodayString(),
        activity_id: ''
      })
      setShowIncomeForm(false)
      await loadData()
    } catch (error) {
      console.error('Failed to add income:', error)
    } finally {
      setSavingIncome(false)
    }
  }

  async function handleDeleteIncome(id) {
    if (!confirm('Delete this income entry?')) return
    
    try {
      await api.budget.deleteIncome(id)
      await loadData()
    } catch (error) {
      console.error('Failed to delete income:', error)
    }
  }

  // Calculate remaining budget
  const totalCost = budget?.totals?.total_cost || 0
  const totalIncome = budgetData?.total_income || 0
  const plannedBudgetNum = budgetData?.planned_budget || 0
  const remaining = plannedBudgetNum - totalCost + totalIncome
  const budgetUsedPercent = plannedBudgetNum > 0 ? Math.min((totalCost / plannedBudgetNum) * 100, 100) : 0

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-4xl" onClick={e => e.stopPropagation()}>
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
        ) : (
          <>
            {/* Budget Input */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">Planned Budget</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={plannedBudget}
                      onChange={(e) => setPlannedBudget(e.target.value)}
                      placeholder="Enter budget..."
                      className="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      onClick={handleSaveBudget}
                      disabled={savingBudget}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded font-medium transition-colors disabled:opacity-50"
                    >
                      {savingBudget ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Budget Progress Bar */}
              {plannedBudgetNum > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Budget Used</span>
                    <span>{formatCurrency(totalCost)} / {formatCurrency(plannedBudgetNum)}</span>
                  </div>
                  <div className="h-3 bg-slate-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        budgetUsedPercent >= 90 ? 'bg-red-500' : 
                        budgetUsedPercent >= 70 ? 'bg-amber-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${budgetUsedPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className={`font-medium ${
                      remaining < 0 ? 'text-red-400' : 'text-teal-400'
                    }`}>
                      {remaining >= 0 ? 'Remaining: ' : 'Over budget: '}
                      {formatCurrency(Math.abs(remaining))}
                    </span>
                    <span className="text-slate-400">{budgetUsedPercent.toFixed(1)}% used</span>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {budget?.totals?.total_sessions || 0}
                </p>
                <p className="text-sm text-gray-500">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {budget?.totals?.total_hours?.toFixed(1) || 0}
                </p>
                <p className="text-sm text-gray-500">Hours</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalCost)}
                </p>
                <p className="text-sm text-gray-500">Total Cost</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
                </p>
                <p className="text-sm text-gray-500">Total Income</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex px-6">
                {['overview', 'type', 'trainer', 'income'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'overview' ? 'Overview' : 
                     tab === 'type' ? 'By Type' : 
                     tab === 'trainer' ? 'By Trainer' : 'Income'}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-700 mb-3">Budget Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Planned Budget</span>
                        <span className="font-medium">{formatCurrency(plannedBudgetNum)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Costs</span>
                        <span className="font-medium text-red-600">- {formatCurrency(totalCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Income</span>
                        <span className="font-medium text-green-600">+ {formatCurrency(totalIncome)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                        <span className="text-slate-700">Net Balance</span>
                        <span className={remaining >= 0 ? 'text-teal-600' : 'text-red-600'}>
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* By Type Tab */}
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
                    {budget?.byType?.map(item => (
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
                    {(!budget?.byType || budget.byType.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No activities for this year
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* By Trainer Tab */}
              {activeTab === 'trainer' && (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th className="pb-3">Trainer</th>
                      <th className="pb-3 text-right">Rate</th>
                      <th className="pb-3 text-right">Sessions</th>
                      <th className="pb-3 text-right">Hours</th>
                      <th className="pb-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {budget?.byTrainer?.map(item => (
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
                    {(!budget?.byTrainer || budget.byTrainer.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No trainer data for this year
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* Income Tab */}
              {activeTab === 'income' && (
                <div className="space-y-4">
                  {/* Add Income Button */}
                  <button
                    onClick={() => setShowIncomeForm(!showIncomeForm)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
                  >
                    + Add Income Entry
                  </button>

                  {/* Income Form */}
                  {showIncomeForm && (
                    <form onSubmit={handleAddIncome} className="bg-gray-50 p-4 rounded-lg space-y-3">
                      {/* Amount calculation row */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Amount *</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={incomeForm.unit_amount}
                            onChange={(e) => setIncomeForm({ ...incomeForm, unit_amount: e.target.value })}
                            placeholder="Unit price"
                            required
                            min="0"
                            step="any"
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                          <span className="text-gray-500 font-medium">×</span>
                          <input
                            type="number"
                            value={incomeForm.quantity}
                            onChange={(e) => setIncomeForm({ ...incomeForm, quantity: e.target.value })}
                            min="1"
                            className="w-20 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                          <span className="text-gray-500 font-medium">=</span>
                          <div className="w-28 bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm font-semibold text-green-600">
                            {formatCurrency(calculatedTotal)}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Unit price × Quantity = Total</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Date *</label>
                          <input
                            type="date"
                            value={incomeForm.date}
                            onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Link to Event</label>
                          <select
                            value={incomeForm.activity_id}
                            onChange={(e) => setIncomeForm({ ...incomeForm, activity_id: e.target.value })}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          >
                            <option value="">No linked event</option>
                            {yearActivities.map(act => (
                              <option key={act.id} value={act.id}>
                                {act.date} - {act.type_name || 'Training'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Description</label>
                        <input
                          type="text"
                          value={incomeForm.description}
                          onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                          placeholder="e.g., Participant fees, Sponsorship, Grant..."
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowIncomeForm(false)}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingIncome || !incomeForm.unit_amount}
                          className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                        >
                          {savingIncome ? 'Adding...' : 'Add Income'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Income List */}
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3 text-right">Calculation</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {budgetData?.income_entries?.map(entry => (
                        <tr key={entry.id}>
                          <td className="py-3 text-gray-600">
                            {new Date(entry.date).toLocaleDateString('no-NO')}
                          </td>
                          <td className="py-3 text-gray-900">
                            <div>{entry.description || '-'}</div>
                            {entry.activity && (
                              <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                                {entry.activity.date} - {entry.activity.type_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right text-gray-500 text-sm">
                            {entry.unit_amount && entry.quantity ? (
                              <span>{formatCurrency(entry.unit_amount)} × {entry.quantity}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 text-right font-medium text-green-600">
                            {formatCurrency(entry.amount)}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteIncome(entry.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!budgetData?.income_entries || budgetData.income_entries.length === 0) && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500">
                            No income entries for this year
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Budget data for {year}. Costs calculated from scheduled activities. Income tracked separately.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
