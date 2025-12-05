import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { api } from '../api'

const UndoContext = createContext(null)

const MAX_UNDO_STACK = 20
const TOAST_DURATION = 5000

export function UndoProvider({ children }) {
  const [undoStack, setUndoStack] = useState([])
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)

  // Add action to undo stack
  const addAction = useCallback((action) => {
    setUndoStack(prev => {
      const newStack = [action, ...prev].slice(0, MAX_UNDO_STACK)
      return newStack
    })
    
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
            // This requires a date change which is delete + create
            await api.activities.delete(lastAction.activityId)
            await api.activities.create({
              ...lastAction.activityData,
              date: lastAction.originalDate
            })
          }
          break
          
        case 'paste_week':
          // Delete all pasted activities (would need to track IDs)
          // For now, this is a no-op - user would need to manually delete
          showToast('Cannot undo paste week - delete activities manually')
          return
          
        default:
          console.warn('Unknown undo action type:', lastAction.type)
      }
      
      // Trigger a refresh by dispatching custom event
      window.dispatchEvent(new CustomEvent('undo-complete'))
      showToast('Undone')
      
    } catch (error) {
      console.error('Undo failed:', error)
      showToast('Undo failed')
    }
  }, [undoStack, clearToast, showToast])

  // Check if can undo
  const canUndo = undoStack.length > 0

  return (
    <UndoContext.Provider value={{
      addAction,
      undo,
      canUndo,
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
      canUndo: false,
      toast: null,
      showToast: () => {},
      clearToast: () => {}
    }
  }
  return context
}

