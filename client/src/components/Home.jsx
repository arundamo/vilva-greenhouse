import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import farmsFeatureImage from '../assets/home-slideshow/farms/farm-03.png'

const buildSlides = (globResult) => (
  Object.entries(globResult)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, src]) => src)
)

const greensSlides = buildSlides(
  import.meta.glob('../assets/home-slideshow/greens/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
    eager: true,
    import: 'default'
  })
)

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [heroFrame, setHeroFrame] = useState(0)

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

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeroFrame((frame) => frame + 1)
    }, 4500)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const menuItems = [
    { label: 'WHERE TO BUY', to: '/shopping' },
    { label: 'ABOUT US', to: '/about' },
    { label: 'RECIPES', to: '/recipes' },
    { label: 'CONTACT US', to: '/contact' },
    ...(user ? [{ label: 'LOGOUT', action: handleLogout }] : [{ label: 'LOGIN', to: '/login' }])
  ]

  const heroTiles = [
    {
      id: 'greens',
      title: 'OUR GREENS',
      subtitle: 'Fresh-cut microgreens and leafy crops',
      cta: 'LEARN MORE',
      to: '/about',
      images: greensSlides.length > 0 ? greensSlides : ['/images/home/greens1.jpg', '/images/home/greens2.jpg'],
      overlay: 'from-green-950/80 via-green-900/55 to-transparent'
    },
    {
      id: 'farms',
      title: 'OUR FARMS',
      subtitle: 'Precision-grown produce from controlled environments',
      cta: 'LEARN MORE',
      to: '/about',
      images: [farmsFeatureImage],
      overlay: 'from-black/65 via-fuchsia-900/45 to-black/25'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-30 bg-lime-500 text-black border-b border-lime-400/70">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs font-black tracking-[0.22em] sm:text-sm">
          VILVA GREENHOUSE FARMS
        </div>
      </div>

      <header className="absolute top-12 left-0 right-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-2xl font-black tracking-wider sm:text-3xl">VILVA</h1>
            <p className="text-[10px] font-semibold tracking-[0.3em] text-white/70 sm:text-xs">GREENHOUSE FARM</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-lime-400/60 bg-black/45 text-lime-300 backdrop-blur hover:border-lime-300 hover:text-lime-200"
            >
              {menuOpen ? (
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4L16 16" />
                  <path d="M16 4L4 16" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 5H17" />
                  <path d="M3 10H17" />
                  <path d="M3 15H17" />
                </svg>
              )}
            </button>
            <button
              onClick={() => navigate('/shopping')}
              className="rounded-md bg-lime-500 px-3 py-2 text-[11px] font-black tracking-wider text-black hover:bg-lime-400 sm:px-4"
            >
              BUY NOW
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu backdrop"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:bg-black/30"
        />
      )}

      <aside
        className={`fixed right-0 top-10 z-40 h-[calc(100vh-2.5rem)] w-full max-w-[420px] border-l border-lime-700/50 bg-green-950/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-full flex-col px-6 py-5 sm:px-8">
          <div className="mb-5 flex items-start justify-between gap-3 border-b border-lime-800/70 pb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-lime-300/85">Vilva Greenhouse Farms</p>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-md border border-lime-400/60 px-2 py-1 text-xs font-bold text-lime-200 hover:bg-lime-400 hover:text-black"
            >
              X
            </button>
          </div>

          <nav className="flex-1 overflow-auto">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.to || '#'}
                onClick={(event) => {
                  if (item.action) {
                    event.preventDefault()
                    setMenuOpen(false)
                    item.action()
                    return
                  }
                  setMenuOpen(false)
                }}
                className="block border-b border-lime-800/60 py-3 text-3xl font-black leading-none tracking-tight text-white/95 transition-colors hover:text-lime-300 sm:text-4xl"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-5 flex items-center justify-between border-t border-lime-800/70 pt-4">
            <p className="text-[11px] font-black tracking-[0.18em] text-lime-400">FOLLOW</p>
            <div className="flex items-center gap-3 text-sm text-white/85">
              <span>f</span>
              <span>ig</span>
              <span>t</span>
              <span>in</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        {heroTiles.map((tile) => {
          const imageCount = tile.images.length || 1
          const image = tile.images[heroFrame % imageCount]

          return (
            <section
              key={tile.id}
              className="group relative min-h-[56vh] overflow-hidden md:min-h-screen"
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-t ${tile.overlay}`} />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10">
                <p className="mb-3 text-xs font-semibold tracking-[0.24em] text-white/75">{tile.subtitle}</p>
                <h2 className="text-5xl font-black leading-[0.9] tracking-tight text-white sm:text-6xl md:text-7xl">
                  {tile.title}
                </h2>
                <Link
                  to={tile.to}
                  className="mt-6 inline-flex rounded-md border border-white/50 bg-black/30 px-4 py-2 text-xs font-bold tracking-[0.18em] text-white backdrop-blur transition-colors hover:bg-white hover:text-black"
                >
                  {tile.cta}
                </Link>
              </div>
            </section>
          )
        })}
      </main>

      <elevenlabs-convai agent-id="agent_7401ka1qwanvfwq9zgkvfkx20hvt"></elevenlabs-convai>
    </div>
  )
}
