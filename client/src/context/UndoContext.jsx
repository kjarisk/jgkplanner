import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { api } from '../api'

const UndoContext = createContext(null)

const MAX_STACK_SIZE = 20
const TOAST_DURATION = 5000

export function UndoProvider({ children }) {
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)

  // Add action to undo stack (clears redo stack)
  const addAction = useCallback((action) => {
    setUndoStack(prev => {
      const newStack = [action, ...prev].slice(0, MAX_STACK_SIZE)
      return newStack
    })
    setRedoStack([]) // Clear redo stack on new action
    
    // Show toast notification
    showToast(action.message || 'Action completed')
  }, [])

  // Show toast with auto-dismiss
  const showToast = useCallback((message) => {
    // Clear existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    
    setToast({ message })
    
    // Auto-dismiss after duration
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
    }, TOAST_DURATION)
  }, [])

  // Clear toast
  const clearToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setToast(null)
  }, [])

  // Undo last action
  const undo = useCallback(async () => {
    if (undoStack.length === 0) return
    
    const [lastAction, ...restStack] = undoStack
    setUndoStack(restStack)
    clearToast()
    
    try {
      switch (lastAction.type) {
        case 'create_activity':
          // Delete the created activity
          if (lastAction.activityId) {
            await api.activities.delete(lastAction.activityId)
          }
          break
          
        case 'create_recurring':
          // Delete the series
          if (lastAction.seriesId) {
            await api.activities.deleteSeries(lastAction.seriesId)
          }
          break
          
        case 'update_activity':
          // Restore previous values
          if (lastAction.activityId && lastAction.previousData) {
            await api.activities.update(lastAction.activityId, lastAction.previousData)
          }
          break
          
        case 'delete_activity':
          // Recreate the deleted activity
          if (lastAction.activityData) {
            await api.activities.create(lastAction.activityData)
          }
          break
          
        case 'reschedule_activity':
          // Move back to original date
          if (lastAction.activityId && lastAction.originalDate) {
            await api.activities.delete(lastAction.activityId)
            await api.activities.create({
              ...lastAction.activityData,
              date: lastAction.originalDate
            })
          }
          break
          
        case 'paste_week':
          showToast('Cannot undo paste week - delete activities manually')
          return
          
        default:
          console.warn('Unknown undo action type:', lastAction.type)
      }
      
      // Add to redo stack
      setRedoStack(prev => [lastAction, ...prev].slice(0, MAX_STACK_SIZE))
      
      // Trigger a refresh by dispatching custom event
      window.dispatchEvent(new CustomEvent('undo-complete'))
      showToast('Undone (Ctrl+Shift+Z to redo)')
      
    } catch (error) {
      console.error('Undo failed:', error)
      showToast('Undo failed')
    }
  }, [undoStack, clearToast, showToast])

  // Redo last undone action
  const redo = useCallback(async () => {
    if (redoStack.length === 0) return
    
    const [actionToRedo, ...restStack] = redoStack
    setRedoStack(restStack)
    clearToast()
    
    try {
      switch (actionToRedo.type) {
        case 'create_activity':
          // Recreate the activity
          if (actionToRedo.activityData) {
            const result = await api.activities.create(actionToRedo.activityData)
            actionToRedo.activityId = result.id // Update with new ID
          }
          break
          
        case 'create_recurring':
          // Recreate the recurring series
          if (actionToRedo.recurringData) {
            const result = await api.activities.createRecurring(actionToRedo.recurringData)
            actionToRedo.seriesId = result.series_id
          }
          break
          
        case 'update_activity':
          // Re-apply the update
          if (actionToRedo.activityId && actionToRedo.newData) {
            await api.activities.update(actionToRedo.activityId, actionToRedo.newData)
          }
          break
          
        case 'delete_activity':
          // Re-delete the activity
          if (actionToRedo.activityId) {
            await api.activities.delete(actionToRedo.activityId)
          }
          break
          
        case 'reschedule_activity':
          // Re-reschedule
          if (actionToRedo.activityData && actionToRedo.newDate) {
            await api.activities.delete(actionToRedo.activityId)
            const result = await api.activities.create({
              ...actionToRedo.activityData,
              date: actionToRedo.newDate
            })
            actionToRedo.activityId = result.id
          }
          break
          
        case 'paste_week':
          showToast('Cannot redo paste week')
          return
          
        default:
          console.warn('Unknown redo action type:', actionToRedo.type)
      }
      
      // Add back to undo stack
      setUndoStack(prev => [actionToRedo, ...prev].slice(0, MAX_STACK_SIZE))
      
      // Trigger a refresh
      window.dispatchEvent(new CustomEvent('redo-complete'))
      showToast('Redone')
      
    } catch (error) {
      console.error('Redo failed:', error)
      showToast('Redo failed')
    }
  }, [redoStack, clearToast, showToast])

  // Check if can undo/redo
  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0

  return (
    <UndoContext.Provider value={{
      addAction,
      undo,
      redo,
      canUndo,
      canRedo,
      toast,
      showToast,
      clearToast
    }}>
      {children}
    </UndoContext.Provider>
  )
}

export function useUndo() {
  const context = useContext(UndoContext)
  if (!context) {
    // Return no-op functions if not in provider
    return {
      addAction: () => {},
      undo: () => {},
      redo: () => {},
      canUndo: false,
      canRedo: false,
      toast: null,
      showToast: () => {},
      clearToast: () => {}
    }
  }
  return context
}

