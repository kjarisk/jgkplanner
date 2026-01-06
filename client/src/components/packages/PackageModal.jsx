/**
 * PackageModal - Modal for creating/editing packages
 */

import { useState, useEffect } from 'react'

const CATEGORIES = [
  { value: 'junior', label: 'Junior' },
  { value: 'voksen', label: 'Voksen' },
  { value: 'alle', label: 'For Alle' },
  { value: 'gratis', label: 'Gratis' }
]

export default function PackageModal({ 
  package: pkg, 
  trainers, 
  trainingTypes, 
  onClose, 
  onSave 
}) {
  const isEditing = !!pkg
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'junior',
    trainer_ids: [],
    training_type_ids: [],
    perks: [],
    requirements: [],
    period: '',
    is_featured: false,
    sort_order: 0
  })
  
  const [newPerk, setNewPerk] = useState('')
  const [newRequirement, setNewRequirement] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  // Populate form when editing
  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || '',
        description: pkg.description || '',
        price: pkg.price || 0,
        category: pkg.category || 'junior',
        trainer_ids: pkg.trainer_ids || [],
        training_type_ids: pkg.training_type_ids || [],
        perks: pkg.perks || [],
        requirements: pkg.requirements || [],
        period: pkg.period || '',
        is_featured: pkg.is_featured || false,
        sort_order: pkg.sort_order || 0
      })
    }
  }, [pkg])
  
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }
  
  function handleTrainerToggle(trainerId) {
    setFormData(prev => ({
      ...prev,
      trainer_ids: prev.trainer_ids.includes(trainerId)
        ? prev.trainer_ids.filter(id => id !== trainerId)
        : [...prev.trainer_ids, trainerId]
    }))
  }
  
  function handleTypeToggle(typeId) {
    setFormData(prev => ({
      ...prev,
      training_type_ids: prev.training_type_ids.includes(typeId)
        ? prev.training_type_ids.filter(id => id !== typeId)
        : [...prev.training_type_ids, typeId]
    }))
  }
  
  function addPerk() {
    if (newPerk.trim()) {
      setFormData(prev => ({
        ...prev,
        perks: [...prev.perks, newPerk.trim()]
      }))
      setNewPerk('')
    }
  }
  
  function removePerk(index) {
    setFormData(prev => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index)
    }))
  }
  
  function addRequirement() {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }
  
  function removeRequirement(index) {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }
  
  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    
    try {
      await onSave({
        ...formData,
        price: parseFloat(formData.price) || 0,
        sort_order: parseInt(formData.sort_order) || 0
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Rediger pakke' : 'Ny treningspakke'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pakkenavn *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="f.eks. Fredagstrening"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pris (kr)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periode
                </label>
                <input
                  type="text"
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="f.eks. Januar - Mars"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beskrivelse
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Beskriv hva pakken inneholder..."
                />
              </div>
            </div>
            
            {/* Trainers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trenere
              </label>
              <div className="flex flex-wrap gap-2">
                {trainers.map(trainer => (
                  <button
                    key={trainer.id}
                    type="button"
                    onClick={() => handleTrainerToggle(trainer.id)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${formData.trainer_ids.includes(trainer.id)
                        ? 'bg-teal-100 text-teal-700 border-2 border-teal-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                      }
                    `}
                  >
                    {trainer.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Training types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aktivitetstyper
              </label>
              <div className="flex flex-wrap gap-2">
                {trainingTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeToggle(type.id)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                      ${formData.training_type_ids.includes(type.id)
                        ? 'bg-teal-100 text-teal-700 border-2 border-teal-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                      }
                    `}
                  >
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Perks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fordeler / Inkludert
              </label>
              <div className="space-y-2 mb-3">
                {formData.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="flex-1 text-sm">{perk}</span>
                    <button
                      type="button"
                      onClick={() => removePerk(idx)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPerk}
                  onChange={e => setNewPerk(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addPerk())}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Legg til fordel..."
                />
                <button
                  type="button"
                  onClick={addPerk}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Legg til
                </button>
              </div>
            </div>
            
            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Krav
              </label>
              <div className="space-y-2 mb-3">
                {formData.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="flex-1 text-sm">{req}</span>
                    <button
                      type="button"
                      onClick={() => removeRequirement(idx)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={e => setNewRequirement(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Legg til krav..."
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Legg til
                </button>
              </div>
            </div>
            
            {/* Options */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Marker som anbefalt</span>
              </label>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Sortering:</label>
                <input
                  type="number"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleChange}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Lagrer...' : (isEditing ? 'Lagre endringer' : 'Opprett pakke')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
