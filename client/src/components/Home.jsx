import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (err) {
        console.error('Error parsing user:', err)
      }
    }

    // Load ElevenLabs ConvAI widget script
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
    script.async = true
    script.type = 'text/javascript'
    document.body.appendChild(script)

    return () => {
      // Cleanup script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handleLogout = () => {
    // Clear local storage and state immediately
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    
    // Send logout request to server (but don't wait for it)
    axios.post('/api/auth/logout').catch(err => console.error('Logout error:', err))
    
    // Force reload to clear all state
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-green-700">Vilva Greenhouse</h1>
            <p className="text-xs sm:text-sm text-slate-500">Fresh crops, simple ordering</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/shopping"
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Shop
            </Link>
            <button
              onClick={() => navigate('/order')}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              Order
            </button>
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-slate-600">👤 {user.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/admin')}
                className="hidden sm:inline-block px-3 py-2 rounded-lg border border-green-600 text-green-700 hover:bg-green-50 text-sm"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-10">
          <div>
            <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-4">
              Greenhouse fresh every day
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Fresh crops from farm to your table
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-6">
              Explore our available crops, see pricing, and place your order in a few steps.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/shopping"
                className="px-6 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700"
              >
                View Shopping Page
              </Link>
              <button
                onClick={() => navigate('/order')}
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100"
              >
                Quick Order
              </button>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Why customers choose Vilva</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span>🌱</span>
                <p>Freshly harvested leafy crops with consistent quality.</p>
              </div>
              <div className="flex gap-3">
                <span>💰</span>
                <p>Transparent pricing by bunch, kg, and 100g where available.</p>
              </div>
              <div className="flex gap-3">
                <span>🚚</span>
                <p>Simple ordering and delivery coordination by our team.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-sm text-slate-500">Greenhouses</p>
            <p className="text-2xl font-bold text-slate-900">3</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-sm text-slate-500">Crop varieties</p>
            <p className="text-2xl font-bold text-slate-900">Multiple</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-sm text-slate-500">Order response</p>
            <p className="text-2xl font-bold text-slate-900">Within 24h</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-600 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p>© 2026 Vilva Greenhouse Farm</p>
          <p>Fresh crops • Modern greenhouse farming</p>
        </div>
      </footer>

      <elevenlabs-convai agent-id="agent_7401ka1qwanvfwq9zgkvfkx20hvt"></elevenlabs-convai>
    </div>
  )
}
