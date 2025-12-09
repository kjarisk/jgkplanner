/**
 * CostEntryForm - Form for creating/editing manual cost entries
 */

import { useState, useEffect } from 'react'
import { Button, Input, Select, Checkbox } from '../common'
import { formatCurrency } from '../../utils/format'

export function CostEntryForm({ 
  initialData,
  trainingTypes = [],
  trainers = [],
  onSubmit,
  onCancel
}) {
  const [form, setForm] = useState({
    description: '',
    units: '1',
    unit_cost: '',
    is_planned: true,
    training_type_id: '',
    trainer_id: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setForm({
        description: initialData.description || '',
        units: initialData.units?.toString() || '1',
        unit_cost: initialData.unit_cost?.toString() || '',
        is_planned: initialData.is_planned !== false,
        training_type_id: initialData.training_type_id || '',
        trainer_id: initialData.trainer_id || '',
        notes: initialData.notes || ''
      })
    }
  }, [initialData])

  const calculatedTotal = (parseFloat(form.units) || 0) * (parseFloat(form.unit_cost) || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description || !form.unit_cost) return

    setLoading(true)
    try {
      await onSubmit({
        description: form.description,
        units: parseFloat(form.units) || 1,
        unit_cost: parseFloat(form.unit_cost) || 0,
        is_planned: form.is_planned,
        training_type_id: form.training_type_id || null,
        trainer_id: form.trainer_id || null,
        notes: form.notes
      })
    } finally {
      setLoading(false)
    }
  }

  const trainingTypeOptions = trainingTypes.map(t => ({
    value: t.id,
    label: t.name
  }))

  const trainerOptions = trainers.map(t => ({
    value: t.id,
    label: t.name
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Description */}
      <Input
        label="Beskrivelse *"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="f.eks. Utstyr, NM deltakelse..."
        required
      />

      {/* Amount calculation */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Beløp *
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={form.units}
            onChange={(e) => setForm({ ...form, units: e.target.value })}
            placeholder="Antall"
            min="0"
            step="any"
            className="w-24"
          />
          <span className="text-gray-500 font-medium">×</span>
          <Input
            type="number"
            value={form.unit_cost}
            onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
            placeholder="Pris per enhet"
            min="0"
            step="any"
            required
            className="flex-1"
          />
          <span className="text-gray-500 font-medium">=</span>
          <div className="w-28 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-red-600">
            {formatCurrency(calculatedTotal)}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">Antall × Pris = Total</p>
      </div>

      {/* Optional links */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Knytt til treningstype"
          value={form.training_type_id}
          onChange={(e) => setForm({ ...form, training_type_id: e.target.value })}
          options={trainingTypeOptions}
          placeholder="Velg type..."
        />
        <Select
          label="Knytt til trener"
          value={form.trainer_id}
          onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}
          options={trainerOptions}
          placeholder="Velg trener..."
        />
      </div>

      {/* Notes */}
      <Input
        label="Notater"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Valgfrie notater..."
      />

      {/* Is Planned */}
      <Checkbox
        label="Planlagt kostnad (ikke bekreftet ennå)"
        checked={form.is_planned}
        onChange={(e) => setForm({ ...form, is_planned: e.target.checked })}
      />

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Avbryt
        </Button>
        <Button 
          type="submit" 
          loading={loading}
          disabled={!form.description || !form.unit_cost}
        >
          {initialData ? 'Oppdater' : 'Legg til'}
        </Button>
      </div>
    </form>
  )
}
