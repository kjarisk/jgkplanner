/**
 * BudgetSection - A single budget section with its costs
 * Can be auto (activities) or manual (custom entries)
 */

import { useState } from 'react'
import { Card, CardHeader, CardContent, Table, TableHeader, TableRow, TableCell, Button, Badge, EmptyState } from '../common'
import { CostEntryForm } from './CostEntryForm'
import { formatCurrency, formatNumber } from '../../utils/format'

export function BudgetSection({ 
  section,
  trainingTypes = [],
  trainers = [],
  onAddCost,
  onEditCost,
  onDeleteCost,
  onEditSection,
  expanded = true
}) {
  const [isExpanded, setIsExpanded] = useState(expanded)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCost, setEditingCost] = useState(null)

  const isAutoSection = section.type === 'auto'
  const hasCosts = section.costs && section.costs.length > 0

  const handleAddCost = async (data) => {
    await onAddCost({ ...data, section_id: section.id })
    setShowAddForm(false)
  }

  const handleEditCost = async (data) => {
    await onEditCost(editingCost.id, data)
    setEditingCost(null)
  }

  const handleDeleteCost = async (costId) => {
    if (confirm('Er du sikker på at du vil slette denne kostnaden?')) {
      await onDeleteCost(costId)
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Section Header */}
      <div 
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-5 h-5 rounded-md shadow-sm"
            style={{ backgroundColor: section.color }}
          />
          <div>
            <h3 className="font-semibold text-gray-900 text-base">{section.name}</h3>
            {isAutoSection && (
              <p className="text-xs text-gray-500 mt-0.5">Beregnet fra aktiviteter</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Section totals */}
          <div className="text-right">
            <p className="text-base font-semibold text-red-600">
              {formatCurrency(section.total_cost)}
            </p>
            {section.total_income > 0 && (
              <p className="text-xs text-green-600 mt-0.5">
                +{formatCurrency(section.total_income)} inntekt
              </p>
            )}
          </div>

          {/* Expand/collapse icon */}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <CardContent noPadding className="border-t border-gray-100">
          {/* Add Cost Button (manual sections only) */}
          {!isAutoSection && (
            <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
              {showAddForm ? (
                <CostEntryForm
                  trainingTypes={trainingTypes}
                  trainers={trainers}
                  onSubmit={handleAddCost}
                  onCancel={() => setShowAddForm(false)}
                />
              ) : (
                <Button 
                  variant="outline" 
                  size="md"
                  onClick={() => setShowAddForm(true)}
                  className="w-full border-dashed border-gray-300 hover:border-teal-400 hover:text-teal-600"
                >
                  + Legg til kostnad
                </Button>
              )}
            </div>
          )}

          {/* Costs Table */}
          {hasCosts ? (
            <Table>
              <TableHeader>
                <TableCell header>Beskrivelse</TableCell>
                {isAutoSection && <TableCell header align="right">Økter</TableCell>}
                <TableCell header align="right">Antall</TableCell>
                <TableCell header align="right">Pris</TableCell>
                <TableCell header align="right">Total</TableCell>
                {!isAutoSection && <TableCell header align="right">Handlinger</TableCell>}
              </TableHeader>
              <tbody>
                {section.costs.map(cost => (
                  <TableRow key={cost.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {cost.training_type && (
                          <div 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cost.training_type.color }}
                          />
                        )}
                        <span className="font-medium text-gray-900">
                          {cost.description}
                        </span>
                        {cost.is_planned === false && (
                          <Badge variant="success" size="xs">Faktisk</Badge>
                        )}
                      </div>
                      {cost.notes && (
                        <p className="text-xs text-gray-500 mt-1">{cost.notes}</p>
                      )}
                    </TableCell>
                    {isAutoSection && (
                      <TableCell align="right" className="text-gray-600">
                        {cost.session_count || '-'}
                      </TableCell>
                    )}
                    <TableCell align="right" className="text-gray-600">
                      {formatNumber(cost.units, 1)}
                    </TableCell>
                    <TableCell align="right" className="text-gray-600">
                      {formatCurrency(cost.unit_cost)}
                    </TableCell>
                    <TableCell align="right" className="font-medium text-gray-900">
                      {formatCurrency(cost.total)}
                    </TableCell>
                    {!isAutoSection && (
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingCost(cost)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCost(cost.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-slate-100 font-semibold border-t-2 border-slate-200">
                  <TableCell className="text-slate-700">Total</TableCell>
                  {isAutoSection && <TableCell align="right" className="text-slate-400">-</TableCell>}
                  <TableCell align="right" className="text-slate-400">-</TableCell>
                  <TableCell align="right" className="text-slate-400">-</TableCell>
                  <TableCell align="right" className="text-red-600 text-base">
                    {formatCurrency(section.total_cost)}
                  </TableCell>
                  {!isAutoSection && <TableCell />}
                </TableRow>
              </tbody>
            </Table>
          ) : (
            <EmptyState
              title="Ingen kostnader"
              description={isAutoSection 
                ? "Ingen aktiviteter registrert for dette året"
                : "Legg til kostnader for å begynne å spore"}
            />
          )}

          {/* Edit Cost Modal */}
          {editingCost && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Rediger kostnad</h3>
                <CostEntryForm
                  initialData={editingCost}
                  trainingTypes={trainingTypes}
                  trainers={trainers}
                  onSubmit={handleEditCost}
                  onCancel={() => setEditingCost(null)}
                />
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
