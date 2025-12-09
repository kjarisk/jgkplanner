/**
 * IncomeEntryForm - Form for creating/editing income entries
 */

import { useState, useEffect } from 'react'
import { Button, Input, Select } from '../common'
import { formatCurrency } from '../../utils/format'
import { getTodayString } from '../../utils/date'

export function IncomeEntryForm({ 
  initialData,
  trainingTypes = [],
  onSubmit,
  onCancel
}) {
  const [form, setForm] = useState({
    unit_amount: '',
    quantity: '1',
    description: '',
    date: getTodayString(),
    training_type_id: ''
  })
  const [loading, setLoading] = useState(false)

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setForm({
        unit_amount: initialData.unit_amount?.toString() || initialData.amount?.toString() || '',
        quantity: initialData.quantity?.toString() || '1',
        description: initialData.description || '',
        date: initialData.date || getTodayString(),
        training_type_id: initialData.training_type_id || ''
      })
    }
  }, [initialData])

  const calculatedTotal = (parseFloat(form.unit_amount) || 0) * (parseInt(form.quantity) || 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.unit_amount || !form.date) return

    setLoading(true)
    try {
      await onSubmit({
        unit_amount: parseFloat(form.unit_amount),
        quantity: parseInt(form.quantity) || 1,
        description: form.description,
        date: form.date,
        training_type_id: form.training_type_id || null
      })
    } finally {
      setLoading(false)
    }
  }

  const trainingTypeOptions = trainingTypes.map(t => ({
    value: t.id,
    label: t.name
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount calculation */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Beløp *
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={form.unit_amount}
            onChange={(e) => setForm({ ...form, unit_amount: e.target.value })}
            placeholder="Enhetspris"
            required
            min="0"
            step="any"
            className="flex-1"
          />
          <span className="text-gray-500 font-medium">×</span>
          <Input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            min="1"
            className="w-20"
          />
          <span className="text-gray-500 font-medium">=</span>
          <div className="w-28 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-green-600">
            {formatCurrency(calculatedTotal)}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">Enhetspris × Antall = Total</p>
      </div>

      {/* Date and Type */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          label="Dato *"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <Select
          label="Knytt til treningstype"
          value={form.training_type_id}
          onChange={(e) => setForm({ ...form, training_type_id: e.target.value })}
          options={trainingTypeOptions}
          placeholder="Velg type..."
        />
      </div>

      {/* Description */}
      <Input
        label="Beskrivelse"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="f.eks. Deltakeravgift, Sponsorat, Tilskudd..."
      />

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Avbryt
        </Button>
        <Button 
          type="submit" 
          loading={loading}
          disabled={!form.unit_amount}
        >
          {initialData ? 'Oppdater' : 'Legg til'}
        </Button>
      </div>
    </form>
  )
}
