import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import greensBackground from '../assets/home-slideshow/greens/greens.png'

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('/api/auth/login', formData)
      const { token, user } = response.data
      
      // Store token and user info
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Call success callback
      onLoginSuccess(user)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-30 bg-lime-500 text-black border-b border-lime-400/70">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs font-black tracking-[0.22em] sm:text-sm">
          VILVA GREENHOUSE FARMS
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${greensBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-green-950/65 to-black/80" />

        <div className="relative min-h-[calc(100vh-2.5rem)] flex items-center justify-center px-4 py-10">
          <div className="max-w-md w-full">
            <div className="mb-6 text-center">
              <p className="text-[11px] font-black tracking-[0.2em] text-lime-300">SECURE ACCESS</p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">VILVA LOGIN</h1>
            </div>

            <div className="rounded-2xl border border-lime-500/35 bg-green-950/80 p-6 shadow-2xl backdrop-blur sm:p-8">
              <h2 className="text-2xl font-black text-white mb-6 tracking-wide">LOGIN</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-950/60 border border-red-400/50 rounded-lg text-red-100 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-lime-100 mb-1 tracking-wide">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder="Enter your username"
                    className="w-full rounded-lg border border-lime-500/40 bg-black/35 px-3 py-2 text-white placeholder:text-white/50 focus:border-lime-300 focus:ring-2 focus:ring-lime-400/50"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-lime-100 mb-1 tracking-wide">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-lime-500/40 bg-black/35 px-3 py-2 text-white placeholder:text-white/50 focus:border-lime-300 focus:ring-2 focus:ring-lime-400/50"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="w-full rounded-lg border border-white/40 bg-black/40 px-4 py-3 text-sm font-bold tracking-wider text-white hover:bg-white hover:text-black"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-lime-500 px-4 py-3 text-sm font-black tracking-wider text-black hover:bg-lime-400 disabled:bg-gray-500 disabled:text-gray-200 disabled:cursor-not-allowed"
                  >
                    {loading ? 'LOGGING IN...' : 'LOGIN'}
                  </button>
                </div>
              </form>
            </div>

            <div className="text-center mt-6 text-xs text-lime-100/75">
              <p>© 2026 Vilva Greenhouse Farm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
