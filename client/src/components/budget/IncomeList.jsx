/**
 * IncomeList - List of income entries with add/edit/delete
 */

import { useState } from 'react'
import { Card, CardHeader, CardContent, Table, TableHeader, TableRow, TableCell, Button, Badge, EmptyState } from '../common'
import { IncomeEntryForm } from './IncomeEntryForm'
import { formatCurrency } from '../../utils/format'

export function IncomeList({ 
  incomeEntries = [],
  totalIncome = 0,
  trainingTypes = [],
  onAdd,
  onEdit,
  onDelete
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)

  const handleAdd = async (data) => {
    await onAdd(data)
    setShowAddForm(false)
  }

  const handleEdit = async (data) => {
    await onEdit(editingEntry.id, data)
    setEditingEntry(null)
  }

  const handleDelete = async (id) => {
    if (confirm('Er du sikker på at du vil slette denne inntekten?')) {
      await onDelete(id)
    }
  }

  return (
    <Card>
      <CardHeader 
        actions={
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            + Legg til inntekt
          </Button>
        }
      >
        Inntekter
      </CardHeader>

      <CardContent noPadding>
        {/* Add Form */}
        {showAddForm && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <IncomeEntryForm
              trainingTypes={trainingTypes}
              onSubmit={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Income Table */}
        {incomeEntries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableCell header>Dato</TableCell>
              <TableCell header>Beskrivelse</TableCell>
              <TableCell header align="right">Beregning</TableCell>
              <TableCell header align="right">Beløp</TableCell>
              <TableCell header align="right">Handlinger</TableCell>
            </TableHeader>
            <tbody>
              {incomeEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="text-gray-600">
                    {new Date(entry.date).toLocaleDateString('no-NO')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {entry.description || '-'}
                    </div>
                    {entry.training_type && (
                      <Badge color={entry.training_type.color} size="xs" className="mt-1">
                        {entry.training_type.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell align="right" className="text-gray-500 text-sm">
                    {entry.unit_amount && entry.quantity ? (
                      <span>{formatCurrency(entry.unit_amount)} × {entry.quantity}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell align="right" className="font-medium text-green-600">
                    {formatCurrency(entry.amount)}
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {/* Total Row */}
              <TableRow className="bg-slate-100 font-semibold border-t-2 border-slate-200">
                <TableCell colSpan={3} className="text-slate-700">Total inntekt</TableCell>
                <TableCell align="right" className="text-green-600 text-base">
                  {formatCurrency(totalIncome)}
                </TableCell>
                <TableCell />
              </TableRow>
            </tbody>
          </Table>
        ) : (
          <EmptyState
            title="Ingen inntekter registrert"
            description="Legg til inntekter for å spore dem mot budsjettet"
            action={
              !showAddForm && (
                <Button size="sm" onClick={() => setShowAddForm(true)}>
                  Legg til første inntekt
                </Button>
              )
            }
          />
        )}

        {/* Edit Modal */}
        {editingEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Rediger inntekt</h3>
              <IncomeEntryForm
                initialData={editingEntry}
                trainingTypes={trainingTypes}
                onSubmit={handleEdit}
                onCancel={() => setEditingEntry(null)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
