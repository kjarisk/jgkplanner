import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import TrainerModal from '../components/TrainerModal'

export default function Admin() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [trainers, setTrainers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [trainerModal, setTrainerModal] = useState({ open: false, trainer: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [usersData, trainersData, notificationsData] = await Promise.all([
        api.users.list(),
        api.trainers.list(),
        api.notifications.list()
      ])
      setUsers(usersData)
      setTrainers(trainersData)
      setNotifications(notificationsData)
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await api.users.updateRole(userId, newRole)
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleDeleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.users.delete(userId)
      setUsers(users.filter(u => u.id !== userId))
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleDeleteTrainer(trainerId) {
    if (!confirm('Are you sure you want to delete this trainer?')) return
    try {
      await api.trainers.delete(trainerId)
      setTrainers(trainers.filter(t => t.id !== trainerId))
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleMarkNotificationRead(notificationId) {
    try {
      await api.notifications.markRead(notificationId)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: 1 } : n
      ))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.notifications.markAllRead()
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  function handleTrainerSaved() {
    setTrainerModal({ open: false, trainer: null })
    loadData()
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  // Enrich users with linked trainer info for filtering in TrainerModal
  const usersWithTrainerInfo = users.map(u => {
    const linkedTrainer = trainers.find(t => t.user_id === u.id)
    return {
      ...u,
      linked_trainer_id: linkedTrainer?.id || null
    }
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-teal-600 hover:text-teal-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('trainers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trainers'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Trainers ({trainers.length})
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'notifications'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full mr-3" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                                <span className="text-gray-500 text-sm">{u.name[0]}</span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{u.name}</div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {u.provider}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={u.id === user.id}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="user">User</option>
                            <option value="trainer">Trainer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Trainers Tab */}
            {activeTab === 'trainers' && (
              <div>
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={() => setTrainerModal({ open: true, trainer: null })}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    + Add Trainer
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linked User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hourly Cost</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trainers.map(t => (
                        <tr key={t.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {t.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {t.linked_user ? (
                              <div className="flex items-center gap-2">
                                {t.linked_user.avatar_url ? (
                                  <img src={t.linked_user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">{t.linked_user.name?.[0]}</span>
                                  </div>
                                )}
                                <span>{t.linked_user.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Not linked</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {t.hourly_cost?.toLocaleString()} kr
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                            <button
                              onClick={() => setTrainerModal({ open: true, trainer: t })}
                              className="text-teal-600 hover:text-teal-900 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTrainer(t.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {trainers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            No trainers yet. Add your first trainer above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                {unreadCount > 0 && (
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={handleMarkAllRead}
                      className="text-sm text-teal-600 hover:text-teal-700"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
                <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-4 flex items-start gap-4 ${!n.is_read ? 'bg-teal-50' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${!n.is_read ? 'bg-teal-500' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{n.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className="text-xs text-teal-600 hover:text-teal-700"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No notifications yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Trainer Modal */}
      {trainerModal.open && (
        <TrainerModal
          trainer={trainerModal.trainer}
          users={usersWithTrainerInfo}
          onClose={() => setTrainerModal({ open: false, trainer: null })}
          onSaved={handleTrainerSaved}
        />
      )}
    </div>
  )
}

