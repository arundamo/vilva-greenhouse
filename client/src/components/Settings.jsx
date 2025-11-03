import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('password')
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // New user form
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    role: 'public',
    full_name: '',
    email: '',
    phone: ''
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: false,
    notification_email: '',
    whatsapp_enabled: false,
    whatsapp_number: ''
  })

  useEffect(() => {
    loadCurrentUser()
    loadUsers()
    loadNotificationSettings()
  }, [])

  const loadCurrentUser = () => {
    axios.get('/api/auth/me')
      .then(res => setCurrentUser(res.data))
      .catch(err => console.error(err))
  }

  const loadUsers = () => {
    axios.get('/api/auth/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
  }

  const loadNotificationSettings = () => {
    // Load from localStorage for now (can be moved to DB later)
    const saved = localStorage.getItem('notification_settings')
    if (saved) {
      setNotificationSettings(JSON.parse(saved))
    }
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwordForm.new_password.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }

    setLoading(true)
    axios.post('/api/auth/change-password', {
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password
    })
      .then(() => {
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      })
      .catch(err => {
        setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password' })
      })
      .finally(() => setLoading(false))
  }

  const handleCreateUser = (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (newUserForm.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    axios.post('/api/auth/register', newUserForm)
      .then(() => {
        setMessage({ type: 'success', text: 'User created successfully!' })
        setNewUserForm({
          username: '',
          password: '',
          role: 'public',
          full_name: '',
          email: '',
          phone: ''
        })
        loadUsers()
      })
      .catch(err => {
        setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create user' })
      })
      .finally(() => setLoading(false))
  }

  const handleSaveNotifications = (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    // Save to localStorage (can be moved to DB later)
    localStorage.setItem('notification_settings', JSON.stringify(notificationSettings))
    setMessage({ type: 'success', text: 'Notification settings saved!' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your account and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'password'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🔒 Change Password
          </button>
          {currentUser?.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                👥 Manage Users
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                🔔 Notifications
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'export'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                ⬇️ Export Data
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Change Your Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password * (min 6 characters)
              </label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                required
                minLength={6}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Manage Users Tab */}
      {activeTab === 'users' && currentUser?.role === 'admin' && (
        <div className="space-y-6">
          {/* Create New User */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username * (for login)
                  </label>
                  <input
                    type="text"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    required
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password * (min 6 characters)
                  </label>
                  <input
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUserForm.full_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="public">Public (View Only)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>

          {/* Existing Users List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Existing Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Username</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Full Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{user.username}</td>
                      <td className="px-4 py-2 text-sm">{user.full_name || '-'}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{user.email || '-'}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && currentUser?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Order Notification Settings</h3>
          <form onSubmit={handleSaveNotifications} className="space-y-6 max-w-2xl">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Note:</strong> Email notifications require additional setup. 
                For now, we recommend checking the Sales page regularly for new orders marked with 🌐.
              </p>
            </div>

            {/* Email Notifications */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="email_enabled"
                  checked={notificationSettings.email_enabled}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, email_enabled: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="email_enabled" className="text-sm font-medium text-gray-700">
                  Enable Email Notifications
                </label>
              </div>

              {notificationSettings.email_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notification Email
                  </label>
                  <input
                    type="email"
                    value={notificationSettings.notification_email}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, notification_email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Requires email service configuration (not yet implemented)
                  </p>
                </div>
              )}
            </div>

            {/* WhatsApp Notifications */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="whatsapp_enabled"
                  checked={notificationSettings.whatsapp_enabled}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, whatsapp_enabled: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="whatsapp_enabled" className="text-sm font-medium text-gray-700">
                  Enable WhatsApp Notifications
                </label>
              </div>

              {notificationSettings.whatsapp_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={notificationSettings.whatsapp_number}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, whatsapp_number: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Requires WhatsApp Business API (not yet implemented)
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Save Settings
            </button>
          </form>
        </div>
      )}

      {/* Export Data Tab (Admin) */}
      {activeTab === 'export' && currentUser?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="text-lg font-semibold">Export Database Snapshot</h3>
          <p className="text-sm text-gray-600">Download a full JSON snapshot of all tables for backup or to sync locally.</p>
          <div>
            <button
              onClick={async () => {
                try {
                  setLoading(true)
                  const res = await axios.get('/api/admin/export', { responseType: 'blob' })
                  const blob = new Blob([res.data], { type: 'application/json' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
                  a.download = `data-export-${ts}.json`
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                  window.URL.revokeObjectURL(url)
                  setMessage({ type: 'success', text: 'Export downloaded successfully.' })
                } catch (err) {
                  console.error(err)
                  setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to export data' })
                } finally {
                  setLoading(false)
                }
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Preparing...' : 'Download JSON Export'}
            </button>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
            Tip: Use this export with <code>server/import-data.js</code> on your local machine to sync production → local.
          </div>
        </div>
      )}
    </div>
  )
}
