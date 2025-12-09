/**
 * BudgetOverview - Overview cards showing key budget metrics
 */

import { useState } from 'react'
import { StatCard, Button, Input } from '../common'
import { formatCurrency } from '../../utils/format'

export function BudgetOverview({ 
  plannedBudget,
  totalCosts,
  totalIncome,
  balance,
  onSetPlannedBudget,
  loading = false
}) {
  const [editing, setEditing] = useState(false)
  const [budgetInput, setBudgetInput] = useState(plannedBudget?.toString() || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const success = await onSetPlannedBudget(parseFloat(budgetInput) || 0)
    setSaving(false)
    if (success) {
      setEditing(false)
    }
  }

  // Calculate percentage used
  const percentUsed = plannedBudget > 0 
    ? Math.min((totalCosts / plannedBudget) * 100, 100) 
    : 0

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {plannedBudget > 0 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Budsjettbruk</span>
            <span>{formatCurrency(totalCosts)} / {formatCurrency(plannedBudget)}</span>
          </div>
          <div className="h-3 bg-slate-600 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                percentUsed >= 90 ? 'bg-red-500' : 
                percentUsed >= 70 ? 'bg-amber-500' : 'bg-teal-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className={`font-medium ${balance >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
              {balance >= 0 ? 'Gjenstående: ' : 'Over budsjett: '}
              {formatCurrency(Math.abs(balance))}
            </span>
            <span className="text-slate-400">{percentUsed.toFixed(1)}% brukt</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Planned Budget - Editable */}
        <div className="bg-slate-100 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Planlagt Budsjett
          </p>
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="py-1"
                autoFocus
              />
              <Button size="sm" onClick={handleSave} loading={saving}>
                Lagre
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Avbryt
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(plannedBudget)}
              </p>
              <button 
                onClick={() => {
                  setBudgetInput(plannedBudget?.toString() || '')
                  setEditing(true)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <StatCard
          label="Totale Kostnader"
          value={formatCurrency(totalCosts)}
          variant="danger"
        />

        <StatCard
          label="Totale Inntekter"
          value={formatCurrency(totalIncome)}
          variant="success"
        />

        <StatCard
          label="Balanse"
          value={formatCurrency(balance)}
          variant={balance >= 0 ? 'success' : 'danger'}
          subValue={balance >= 0 ? 'I pluss' : 'Over budsjett'}
        />
      </div>

      {/* Net Result */}
      <div className={`rounded-lg p-4 ${(totalIncome - totalCosts) >= 0 ? 'bg-teal-50' : 'bg-red-50'}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Nettoresultat (Inntekt - Kostnad)</p>
            <p className={`text-3xl font-bold ${(totalIncome - totalCosts) >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalCosts)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Resterende budsjett</p>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
