import { useState } from 'react'
import { api } from '../api'

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#1F2937', // Dark gray
  '#7C3AED', // Violet
  '#06B6D4', // Cyan
]

export default function TrainingTypeModal({ type, trainers, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: type?.name || '',
    color: type?.color || '#3B82F6',
    default_trainer_id: type?.default_trainer_id || '',
    default_hours: type?.default_hours || 2
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = {
        name: formData.name,
        color: formData.color,
        default_trainer_id: formData.default_trainer_id || null,
        default_hours: parseFloat(formData.default_hours)
      }

      if (type) {
        await api.types.update(type.id, data)
      } else {
        await api.types.create(data)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!type) return
    if (!confirm('Delete this training type? This will also delete all associated activities.')) return

    setLoading(true)
    try {
      await api.types.delete(type.id)
      onSaved()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {type ? 'Edit Training Type' : 'Add Training Type'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Friday Training"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-8 w-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm font-mono"
              />
            </div>
          </div>

          {/* Default Trainer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Trainer
            </label>
            <select
              value={formData.default_trainer_id}
              onChange={(e) => setFormData({ ...formData, default_trainer_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">No default</option>
              {trainers.map(trainer => (
                <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
              ))}
            </select>
          </div>

          {/* Default Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={formData.default_hours}
              onChange={(e) => setFormData({ ...formData, default_hours: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Preview */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: formData.color }}
              />
              <span className="font-medium">{formData.name || 'Training Type'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {type && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Saving...' : (type ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

