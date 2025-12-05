import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const userData = await api.auth.me()
      setUser(userData)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      await api.auth.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    setUser(null)
  }

  // Dev login for development
  async function devLogin(role = 'admin') {
    try {
      const result = await api.auth.devLogin(role)
      setUser(result.user)
      return result.user
    } catch (error) {
      console.error('Dev login error:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    logout,
    devLogin,
    refreshUser: checkAuth,
    isAdmin: user?.role === 'admin',
    isTrainer: user?.role === 'trainer',
    canEdit: user?.role === 'admin' || user?.role === 'trainer'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

