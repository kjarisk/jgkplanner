/**
 * SectionManager - Modal for managing budget sections
 */

import { useState } from 'react'
import { Modal, ModalHeader, ModalContent, ModalFooter, Button, Input, Table, TableHeader, TableRow, TableCell } from '../common'

// Predefined colors for sections
const SECTION_COLORS = [
  '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280',
  '#0ea5e9', '#ec4899', '#84cc16', '#f97316', '#06b6d4'
]

export function SectionManager({ 
  sections = [],
  onClose,
  onCreate,
  onUpdate,
  onDelete
}) {
  const [newSection, setNewSection] = useState({ name: '', color: SECTION_COLORS[0] })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', color: '' })
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!newSection.name.trim()) return
    
    setLoading(true)
    try {
      await onCreate({
        name: newSection.name.trim(),
        color: newSection.color,
        type: 'manual'
      })
      setNewSection({ name: '', color: SECTION_COLORS[0] })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id) => {
    if (!editForm.name.trim()) return
    
    setLoading(true)
    try {
      await onUpdate(id, {
        name: editForm.name.trim(),
        color: editForm.color
      })
      setEditingId(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Er du sikker på at du vil slette denne seksjonen? Alle kostnader vil bli flyttet.')) return
    
    setLoading(true)
    try {
      await onDelete(id)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (section) => {
    setEditingId(section.id)
    setEditForm({ name: section.name, color: section.color })
  }

  return (
    <Modal onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        Administrer budsjettseksjoner
      </ModalHeader>

      <ModalContent>
        {/* Add New Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Legg til ny seksjon</h4>
          <div className="flex items-center gap-3">
            {/* Color picker */}
            <div className="flex gap-1">
              {SECTION_COLORS.slice(0, 6).map(color => (
                <button
                  key={color}
                  onClick={() => setNewSection({ ...newSection, color })}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    newSection.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input
              value={newSection.name}
              onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
              placeholder="Navn på seksjon..."
              className="flex-1"
            />
            <Button onClick={handleCreate} loading={loading} disabled={!newSection.name.trim()}>
              Legg til
            </Button>
          </div>
        </div>

        {/* Sections List */}
        <Table>
          <TableHeader>
            <TableCell header>Farge</TableCell>
            <TableCell header>Navn</TableCell>
            <TableCell header>Type</TableCell>
            <TableCell header align="right">Handlinger</TableCell>
          </TableHeader>
          <tbody>
            {sections.map(section => (
              <TableRow key={section.id}>
                <TableCell>
                  {editingId === section.id ? (
                    <div className="flex gap-1">
                      {SECTION_COLORS.slice(0, 5).map(color => (
                        <button
                          key={color}
                          onClick={() => setEditForm({ ...editForm, color })}
                          className={`w-5 h-5 rounded-full ${
                            editForm.color === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div 
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: section.color }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {editingId === section.id ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="py-1"
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{section.name}</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-500">
                  {section.type === 'auto' ? 'Automatisk' : 'Manuell'}
                </TableCell>
                <TableCell align="right">
                  {section.type !== 'auto' && (
                    <div className="flex items-center justify-end gap-1">
                      {editingId === section.id ? (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdate(section.id)}
                            loading={loading}
                          >
                            Lagre
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditingId(null)}
                          >
                            Avbryt
                          </Button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(section)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(section.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>

        <p className="text-xs text-gray-500 mt-4">
          * Seksjoner av typen "Automatisk" beregnes fra aktiviteter og kan ikke slettes.
        </p>
      </ModalContent>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Lukk
        </Button>
      </ModalFooter>
    </Modal>
  )
}
