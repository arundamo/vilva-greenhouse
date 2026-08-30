import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const features = [
  {
    icon: '🌱',
    title: 'Greenhouse Fresh',
    description: 'Crops harvested at peak freshness directly from our climate-controlled greenhouses.',
  },
  {
    icon: '🌿',
    title: 'Naturally Grown',
    description: 'No unnecessary chemicals — we grow the way nature intended, clean and nutritious.',
  },
  {
    icon: '💰',
    title: 'Transparent Pricing',
    description: "Clear pricing by bunch, kg, or 100g so you always know what you're paying.",
  },
  {
    icon: '🚚',
    title: 'Simple Ordering',
    description: "Browse, order online, and we'll coordinate delivery right to your doorstep.",
  },
]

const stats = [
  { label: 'Greenhouses', value: '3' },
  { label: 'Crop Varieties', value: '10+' },
  { label: 'Happy Customers', value: '200+' },
  { label: 'Order Response', value: '<24h' },
]

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
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
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    axios.post('/api/auth/logout').catch(err => console.error('Logout error:', err))
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans">

      {/* ── Navigation ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🌿</span>
            <div>
              <p className="text-lg font-bold leading-tight text-green-800 tracking-wide">Vilva Greenhouse</p>
              <p className="text-xs text-stone-400 leading-tight hidden sm:block">Farm fresh, delivered</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <Link to="/shopping" className="hover:text-green-700 transition-colors">Shop</Link>
            <Link to="/order" className="hover:text-green-700 transition-colors">Order</Link>
            {user && (
              <Link to="/dashboard" className="hover:text-green-700 transition-colors">Dashboard</Link>
            )}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-stone-500">👤 {user.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full border border-stone-300 text-stone-600 text-sm hover:bg-stone-100 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 rounded-full border border-stone-300 text-stone-600 text-sm hover:bg-stone-100 transition-colors"
              >
                Admin Login
              </button>
            )}
            <Link
              to="/shopping"
              className="px-5 py-2 rounded-full bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition-colors shadow"
            >
              Shop Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div id="mobile-menu" className="md:hidden border-t border-stone-200 bg-white px-4 py-4 flex flex-col gap-3 text-sm font-medium text-stone-700">
            <Link to="/shopping" onClick={() => setMenuOpen(false)} className="hover:text-green-700">Shop</Link>
            <Link to="/order" onClick={() => setMenuOpen(false)} className="hover:text-green-700">Order</Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="hover:text-green-700">Dashboard</Link>
                <button onClick={handleLogout} className="text-left text-red-600 hover:text-red-700">Logout</button>
              </>
            ) : (
              <button onClick={() => navigate('/admin')} className="text-left hover:text-green-700">Admin Login</button>
            )}
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 70%, #4ade80 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-0 -left-10 w-64 h-64 rounded-full opacity-10 bg-white" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-36 text-center text-white">
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/20 text-sm font-medium tracking-wide uppercase">
            Greenhouse Fresh · Naturally Grown
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            From Our Farm <br className="hidden sm:block" />
            <span className="text-lime-300">To Your Table</span>
          </h1>
          <p className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Crisp, vibrant, nutritious leafy greens grown in our climate-controlled greenhouses — 
            harvested fresh and delivered with care.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/shopping"
              className="px-8 py-4 rounded-full bg-white text-green-800 font-bold text-base hover:bg-lime-50 transition-colors shadow-lg"
            >
              Shop Our Crops
            </Link>
            <button
              onClick={() => navigate('/order')}
              className="px-8 py-4 rounded-full border-2 border-white/70 text-white font-bold text-base hover:bg-white/10 transition-colors"
            >
              Place an Order
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 sm:grid-cols-4 sm:divide-x divide-green-700">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center px-4 py-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-lime-300">{value}</p>
              <p className="text-xs sm:text-sm text-green-200 mt-1 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-green-700 uppercase tracking-widest">Why Vilva</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-stone-900">
              Grown with intention. <br className="hidden sm:block" />Delivered with care.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-7 shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission strip ── */}
      <section className="bg-green-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-sm font-semibold text-lime-400 uppercase tracking-widest">Our Mission</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold leading-snug">
              Bringing the farm closer to your community
            </h2>
            <p className="mt-5 text-green-200 text-base leading-relaxed">
              At Vilva Greenhouse, we believe fresh produce shouldn't be a luxury. 
              We operate modern, efficient greenhouses to bring you the highest-quality 
              leafy greens at fair, transparent prices — year-round.
            </p>
            <Link
              to="/shopping"
              className="inline-block mt-8 px-7 py-3 rounded-full bg-lime-400 text-green-900 font-bold hover:bg-lime-300 transition-colors shadow"
            >
              Explore Our Crops →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { emoji: '🥬', label: 'Leafy Greens' },
              { emoji: '🌾', label: 'Microgreens' },
              { emoji: '🌿', label: 'Herbs' },
              { emoji: '🥗', label: 'Salad Mixes' },
            ].map(({ emoji, label }) => (
              <div
                key={label}
                className="bg-green-800 rounded-xl p-6 text-center hover:bg-green-700 transition-colors"
              >
                <div className="text-4xl mb-2">{emoji}</div>
                <p className="text-sm font-semibold text-green-100">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop CTA ── */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-semibold text-green-700 uppercase tracking-widest">Fresh Today</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
            Ready to order?
          </h2>
          <p className="text-stone-500 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Browse our current crop varieties, see live pricing, and place your order in minutes. 
            We'll confirm and coordinate delivery within 24 hours.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/shopping"
              className="px-8 py-4 rounded-full bg-green-700 text-white font-bold hover:bg-green-800 transition-colors shadow"
            >
              View All Crops
            </Link>
            <button
              onClick={() => navigate('/order')}
              className="px-8 py-4 rounded-full border-2 border-green-700 text-green-700 font-bold hover:bg-green-50 transition-colors"
            >
              Quick Order
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-green-950 text-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌿</span>
              <p className="text-lg font-bold text-white">Vilva Greenhouse</p>
            </div>
            <p className="text-sm text-green-400 leading-relaxed">
              Modern greenhouse farming — growing clean, fresh produce for our community.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-green-500 font-semibold mb-4">Navigate</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/shopping" className="hover:text-white transition-colors">Shop</Link></li>
              <li><Link to="/order" className="hover:text-white transition-colors">Place Order</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-green-500 font-semibold mb-4">Contact</p>
            <ul className="space-y-2 text-sm">
              <li>📍 Vilva Greenhouse Farm</li>
              <li>📧 hello@vilva.farm</li>
              <li>📞 Available on request</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-green-900 py-5 text-center text-xs text-green-600">
          © 2026 Vilva Greenhouse Farm · Fresh crops · Modern farming
        </div>
      </footer>

      <elevenlabs-convai agent-id="agent_7401ka1qwanvfwq9zgkvfkx20hvt"></elevenlabs-convai>
    </div>
  )
}
