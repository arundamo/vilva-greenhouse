import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const testimonials = [
  {
    quote: "The freshest greens I've ever had — you can taste the difference. I order weekly now.",
    name: 'Priya S.',
    location: 'Local Customer',
  },
  {
    quote: 'Reliable, fast, and the pricing is completely transparent. Vilva has simplified our restaurant sourcing.',
    name: 'Rajan M.',
    location: 'Restaurant Owner',
  },
  {
    quote: 'I love knowing exactly where my greens come from. The greenhouse-fresh quality is unmatched.',
    name: 'Anita K.',
    location: 'Home Chef',
  },
]

const whyUs = [
  {
    title: 'Grown Locally',
    body: 'Our greenhouses are right in your community — produce travels hours, not days, from harvest to table.',
  },
  {
    title: 'No Compromise on Quality',
    body: 'Climate-controlled growing means consistent quality every single day, rain or shine.',
  },
  {
    title: 'Fair, Transparent Prices',
    body: 'Clear pricing by bunch, kg, or 100g. No hidden costs, no surprises at checkout.',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)) } catch (err) { /* ignore */ }
    }

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
    script.async = true
    script.type = 'text/javascript'
    document.body.appendChild(script)
    return () => { if (document.body.contains(script)) document.body.removeChild(script) }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    axios.post('/api/auth/logout').catch(() => {})
    window.location.href = '/'
  }

  const serif = { fontFamily: "'Playfair Display', Georgia, serif" }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#F7F3EE', color: '#2C2C2C' }} className="min-h-screen">

      {/* Announcement Bar */}
      <div style={{ background: '#2D4A2A', color: '#C8DFC0' }} className="text-center py-2.5 text-xs sm:text-sm font-medium tracking-wide">
        🌿 &nbsp;Free delivery on orders over ₹500 &nbsp;·&nbsp; Harvested fresh daily
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b" style={{ background: 'rgba(247,243,238,0.97)', backdropFilter: 'blur(8px)', borderColor: '#D6CFCA' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="shrink-0 flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
            <span className="text-2xl">🌿</span>
            <span style={{ ...serif, fontSize: '1.2rem', fontWeight: 700, color: '#2D4A2A' }}>
              Vilva Greenhouse
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: '#4A4A4A' }}>
            <Link to="/shopping" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:opacity-60 transition-opacity">Shop</Link>
            <Link to="/order" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:opacity-60 transition-opacity">Order</Link>
            {user && (
              <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:opacity-60 transition-opacity">Dashboard</Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm" style={{ color: '#6B6B6B' }}>👤 {user.username}</span>
                <button onClick={handleLogout} className="text-sm px-4 py-2 transition-opacity hover:opacity-70" style={{ border: '1px solid #C5BCB5', color: '#4A4A4A', background: 'transparent', cursor: 'pointer', borderRadius: '2px' }}>
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/admin')} className="text-sm px-4 py-2 transition-opacity hover:opacity-70" style={{ border: '1px solid #C5BCB5', color: '#4A4A4A', background: 'transparent', cursor: 'pointer', borderRadius: '2px' }}>
                Admin
              </button>
            )}
            <Link to="/shopping" className="text-sm px-5 py-2.5 font-semibold transition-opacity hover:opacity-85" style={{ background: '#2D4A2A', color: '#F7F3EE', textDecoration: 'none', borderRadius: '2px', letterSpacing: '0.04em' }}>
              Shop Now
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            style={{ color: '#4A4A4A', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="md:hidden px-4 py-4 flex flex-col gap-4 text-sm font-medium border-t" style={{ background: '#F7F3EE', borderColor: '#D6CFCA', color: '#4A4A4A' }}>
            <Link to="/shopping" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'inherit' }}>Shop</Link>
            <Link to="/order" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'inherit' }}>Order</Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'inherit' }}>Dashboard</Link>
                <button onClick={handleLogout} className="text-left" style={{ color: '#B04040', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>Logout</button>
              </>
            ) : (
              <button onClick={() => navigate('/admin')} className="text-left" style={{ color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>Admin Login</button>
            )}
          </div>
        )}
      </header>

      {/* Hero */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: '88vh', background: 'linear-gradient(160deg, #1A3320 0%, #2D4A2A 40%, #3A6B3A 75%, #4A7C50 100%)' }}
      >
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.2) 100%)' }} />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto py-24">
          <p className="font-medium mb-6" style={{ color: '#8AAE88', letterSpacing: '0.22em', fontSize: '0.7rem', textTransform: 'uppercase' }}>
            Greenhouse Fresh &nbsp;·&nbsp; Naturally Grown &nbsp;·&nbsp; Locally Sourced
          </p>
          <h1 style={{ ...serif, fontWeight: 700, lineHeight: 1.12, color: '#F0EDE8', fontSize: 'clamp(2.6rem, 6vw, 5rem)', marginBottom: '24px' }}>
            Farm-Fresh Greens,<br />
            <em style={{ fontStyle: 'italic', color: '#B8D4B4' }}>Delivered to Your Door</em>
          </h1>
          <p className="text-base sm:text-lg mx-auto mb-10 leading-relaxed" style={{ color: '#A8C0A4', maxWidth: '520px' }}>
            Crisp, vibrant, nutritious leafy greens grown in our climate-controlled greenhouses —
            harvested at peak freshness and delivered with care.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/shopping"
              style={{ background: '#F7F3EE', color: '#2D4A2A', fontWeight: 600, textDecoration: 'none', padding: '14px 36px', borderRadius: '2px', fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}
              className="transition-opacity hover:opacity-90"
            >
              Shop Our Greens
            </Link>
            <button
              onClick={() => navigate('/order')}
              style={{ background: 'transparent', color: '#D8ECD4', fontWeight: 600, border: '1px solid rgba(216,236,212,0.5)', padding: '14px 36px', borderRadius: '2px', fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
              className="transition-opacity hover:opacity-80"
            >
              Place an Order
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1" style={{ color: 'rgba(168,192,164,0.4)' }}>
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: '1px', height: '30px', background: 'rgba(168,192,164,0.3)' }} />
        </div>
      </section>

      {/* As Seen In */}
      <section style={{ background: '#EDE8E1', borderTop: '1px solid #D6CFCA', borderBottom: '1px solid #D6CFCA' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-center gap-8 sm:gap-16">
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#8A7F78', letterSpacing: '0.16em' }}>As featured in</span>
          {['The Hindu', 'Times Food', 'Farm Forward', 'Green Living', 'Local Harvest'].map(name => (
            <span key={name} style={{ ...serif, fontStyle: 'italic', color: '#B0A8A0', fontSize: '0.95rem' }}>{name}</span>
          ))}
        </div>
      </section>

      {/* Why Us */}
      <section className="py-24" style={{ background: '#F7F3EE' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase mb-3" style={{ color: '#7A9E7A', letterSpacing: '0.2em' }}>Why Vilva</p>
            <h2 style={{ ...serif, fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', color: '#1E2E1E', lineHeight: 1.2 }}>
              Grown with intention.<br />Delivered with care.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyUs.map(({ title, body }) => (
              <div key={title} className="text-center px-4">
                <div className="mx-auto mb-5" style={{ width: '40px', height: '1px', background: '#8DB88D' }} />
                <h3 style={{ ...serif, fontWeight: 600, fontSize: '1.15rem', color: '#2D4A2A', marginBottom: '10px' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B6460' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #C8BEB5, transparent)' }} />

      {/* Mission + Crop grid */}
      <section className="py-24" style={{ background: '#F0EBE4' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: '#7A9E7A', letterSpacing: '0.2em' }}>Our Mission</p>
            <h2 style={{ ...serif, fontWeight: 700, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', color: '#1E2E1E', lineHeight: 1.25, marginBottom: '18px' }}>
              Bringing the farm<br /><em style={{ fontStyle: 'italic' }}>closer to your table</em>
            </h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: '#5C5450' }}>
              At Vilva Greenhouse, we believe fresh produce should be accessible, affordable,
              and honest. We operate modern, energy-efficient greenhouses to grow the highest-quality
              leafy greens at fair prices — year-round, without compromise.
            </p>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#5C5450' }}>
              Every bunch is harvested to order, packed carefully, and delivered directly to you.
              No middlemen, no days-old produce.
            </p>
            <Link
              to="/shopping"
              style={{ display: 'inline-block', background: '#2D4A2A', color: '#F7F3EE', fontWeight: 600, textDecoration: 'none', padding: '12px 30px', borderRadius: '2px', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}
              className="transition-opacity hover:opacity-85"
            >
              Explore Our Crops
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { emoji: '🥬', crop: 'Spinach', note: 'Packed with iron' },
              { emoji: '🌿', crop: 'Microgreens', note: 'Nutrient-dense' },
              { emoji: '🥗', crop: 'Mixed Greens', note: 'Fresh daily' },
              { emoji: '🌾', crop: 'Herbs', note: 'Aromatic & fresh' },
            ].map(({ emoji, crop, note }) => (
              <div key={crop} className="p-6 text-center transition-opacity hover:opacity-90" style={{ background: '#2D4A2A', cursor: 'default' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{emoji}</div>
                <p style={{ ...serif, fontWeight: 600, color: '#C8DFC0', fontSize: '0.95rem' }}>{crop}</p>
                <p className="text-xs mt-1" style={{ color: '#7A9E7A' }}>{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24" style={{ background: '#F7F3EE' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase mb-3" style={{ color: '#7A9E7A', letterSpacing: '0.2em' }}>What People Say</p>
            <h2 style={{ ...serif, fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: '#1E2E1E' }}>
              Loved by our community
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ quote, name, location }) => (
              <div key={name} className="p-8" style={{ background: '#FFFFFF', border: '1px solid #E0D9D2' }}>
                <p style={{ ...serif, fontStyle: 'italic', fontSize: '1rem', color: '#3A3330', lineHeight: 1.75, marginBottom: '20px' }}>
                  "{quote}"
                </p>
                <div style={{ width: '28px', height: '1px', background: '#8DB88D', marginBottom: '14px' }} />
                <p className="text-sm font-semibold" style={{ color: '#2D4A2A' }}>{name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9A9490' }}>{location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop CTA */}
      <section className="py-20" style={{ background: '#2D4A2A' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-semibold uppercase mb-4" style={{ color: '#7AAD7A', letterSpacing: '0.2em' }}>Order Today</p>
          <h2 style={{ ...serif, fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', color: '#F0EDE8', marginBottom: '14px', lineHeight: 1.2 }}>
            Ready for farm-fresh<br />greens delivered to you?
          </h2>
          <p className="text-base leading-relaxed mx-auto mb-10" style={{ color: '#A0BF9C', maxWidth: '460px' }}>
            Browse current varieties, see transparent pricing, and place your order in minutes.
            We confirm and dispatch within 24 hours.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/shopping"
              style={{ background: '#F7F3EE', color: '#2D4A2A', fontWeight: 600, textDecoration: 'none', padding: '13px 34px', borderRadius: '2px', fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}
              className="transition-opacity hover:opacity-90"
            >
              View All Crops
            </Link>
            <button
              onClick={() => navigate('/order')}
              style={{ background: 'transparent', color: '#C8DFC0', fontWeight: 600, border: '1px solid rgba(200,223,192,0.4)', padding: '13px 34px', borderRadius: '2px', fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
              className="transition-opacity hover:opacity-80"
            >
              Quick Order
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-14 border-t border-b" style={{ background: '#EDE8E1', borderColor: '#D6CFCA' }}>
        <div className="max-w-xl mx-auto px-4 text-center">
          <h3 style={{ ...serif, fontWeight: 600, fontSize: '1.4rem', color: '#2D4A2A', marginBottom: '8px' }}>Stay in the loop</h3>
          <p className="text-sm mb-6" style={{ color: '#6B6460' }}>
            Get harvest updates, seasonal crops, and exclusive offers in your inbox.
          </p>
          {subscribed ? (
            <p className="text-sm font-medium py-3" style={{ color: '#2D4A2A' }}>
              ✓ &nbsp;Thanks for subscribing! We'll be in touch soon.
            </p>
          ) : (
            <form
              className="flex flex-col sm:flex-row gap-3"
              onSubmit={e => {
                e.preventDefault()
                if (email.trim()) setSubscribed(true)
              }}
            >
              <input
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 text-sm outline-none"
                style={{ border: '1px solid #C5BCB5', background: '#FFFFFF', color: '#2C2C2C', borderRadius: '2px' }}
              />
              <button
                type="submit"
                style={{ background: '#2D4A2A', color: '#F7F3EE', fontWeight: 600, padding: '12px 26px', borderRadius: '2px', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', border: 'none', whiteSpace: 'nowrap' }}
                className="transition-opacity hover:opacity-85"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1A2E1A', color: '#7A9E7A' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 sm:grid-cols-4 gap-10">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🌿</span>
              <span style={{ ...serif, fontWeight: 700, color: '#C8DFC0', fontSize: '1.05rem' }}>Vilva Greenhouse</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#5A7A5A' }}>
              Modern greenhouse farming.<br />Fresh produce for our community.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: '#5A8A5A', letterSpacing: '0.15em' }}>Shop</p>
            <ul className="space-y-2.5 text-sm" style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/shopping" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:opacity-80 transition-opacity">All Crops</Link></li>
              <li><Link to="/order" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:opacity-80 transition-opacity">Place an Order</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: '#5A8A5A', letterSpacing: '0.15em' }}>Company</p>
            <ul className="space-y-2.5 text-sm" style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:opacity-80 transition-opacity">Home</Link></li>
              <li><Link to="/order" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:opacity-80 transition-opacity">Place an Order</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: '#5A8A5A', letterSpacing: '0.15em' }}>Contact</p>
            <ul className="space-y-2.5 text-xs" style={{ listStyle: 'none', padding: 0, lineHeight: 1.8 }}>
              <li>📍 Vilva Greenhouse Farm</li>
              <li>📧 hello@vilva.farm</li>
              <li>📞 Available on request</li>
            </ul>
          </div>
        </div>
        <div className="border-t py-5 text-center text-xs" style={{ borderColor: '#2A3E2A', color: '#4A6A4A' }}>
          © 2026 Vilva Greenhouse Farm &nbsp;·&nbsp; Fresh crops &nbsp;·&nbsp; Modern farming
        </div>
      </footer>

      <elevenlabs-convai agent-id="agent_7401ka1qwanvfwq9zgkvfkx20hvt"></elevenlabs-convai>
    </div>
  )
}
