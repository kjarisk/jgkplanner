import { useState } from 'react'
import { api } from '../api'

export default function TrainerModal({ trainer, users = [], onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: trainer?.name || '',
    hourly_cost: trainer?.hourly_cost || 0,
    user_id: trainer?.user_id || ''
  })

  // Filter out users that are already linked to other trainers
  const availableUsers = users.filter(u => 
    !u.linked_trainer_id || u.linked_trainer_id === trainer?.id
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = {
        name: formData.name,
        hourly_cost: parseFloat(formData.hourly_cost) || 0,
        user_id: formData.user_id || null
      }

      if (trainer) {
        await api.trainers.update(trainer.id, data)
      } else {
        await api.trainers.create(data)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {trainer ? 'Edit Trainer' : 'Add Trainer'}
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
              placeholder="Trainer name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Hourly Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Cost (kr)
            </label>
            <input
              type="number"
              min="0"
              value={formData.hourly_cost}
              onChange={(e) => setFormData({ ...formData, hourly_cost: e.target.value })}
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set to 0 for unpaid/volunteer trainers
            </p>
          </div>

          {/* Link to User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link to User Account
            </label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">No linked user</option>
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Link this trainer to a user account so they can log in and manage their activities
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
              {loading ? 'Saving...' : (trainer ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

