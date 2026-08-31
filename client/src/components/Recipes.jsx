import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const buildSlides = (globResult) => (
  Object.entries(globResult)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, src]) => src)
)

const recipeImages = buildSlides(
  import.meta.glob('../assets/home-slideshow/greens/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
    eager: true,
    import: 'default'
  })
)

const platforms = [
  { key: 'google', label: 'Google', baseUrl: 'https://www.google.com/search?q=' },
  { key: 'youtube', label: 'YouTube', baseUrl: 'https://www.youtube.com/results?search_query=' }
]

const recipeIdeas = {
  spinach: ['Palak Paneer', 'Dal Palak', 'Aloo Palak', 'Spinach Paratha'],
  malabar: ['Basale Soppu Palya', 'Malabar Spinach Dal', 'Pui Shaak Curry'],
  red: ['Red Spinach Poriyal', 'Lal Saag Stir Fry', 'Saag Chana'],
  baby: ['Baby Spinach Chaat', 'Spinach Moong Dal', 'Saag Soup']
}

function getIdeas(cropName) {
  const name = String(cropName || '').toLowerCase()
  if (name.includes('malabar')) return recipeIdeas.malabar
  if (name.includes('red')) return recipeIdeas.red
  if (name.includes('baby')) return recipeIdeas.baby
  if (name.includes('palak') || name.includes('spinach')) return recipeIdeas.spinach
  return recipeIdeas.spinach
}

export default function Recipes() {
  const [varieties, setVarieties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState('google')

  useEffect(() => {
    setLoading(true)
    setError('')

    axios.get('/api/public/varieties')
      .then((response) => {
        setVarieties(Array.isArray(response.data) ? response.data : [])
      })
      .catch((loadError) => {
        console.error(loadError)
        setError('Failed to load crops for recipes. Please try again.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const filteredVarieties = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return varieties
    return varieties.filter((v) => (v.name || '').toLowerCase().includes(q))
  }, [search, varieties])

  const selectedPlatform = platforms.find((item) => item.key === platform) || platforms[0]

  const openRecipeSearch = (cropName) => {
    const query = `${cropName} indian recipes`
    const url = `${selectedPlatform.baseUrl}${encodeURIComponent(query)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-slate-600 font-medium">Loading recipe crops...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-white p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <Link
            to="/"
            className="mt-4 inline-flex rounded-md bg-lime-500 px-4 py-2 text-sm font-bold text-black hover:bg-lime-400"
          >
            Back Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-lime-300 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="text-xl sm:text-2xl font-black tracking-wide text-green-800">
            Vilva Greenhouse
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold"
            >
              Home
            </Link>
            <Link
              to="/shopping"
              className="px-4 py-2 rounded-lg bg-lime-500 text-black font-bold hover:bg-lime-400 text-sm"
            >
              Marketplace
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Indian Recipes by Crop</h1>
          <p className="text-slate-600 mt-1">Pick a crop and quickly find Indian recipes for it.</p>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search crop name"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
            />
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
            >
              {platforms.map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </div>
        </section>

        {filteredVarieties.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            No crops matched your search.
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredVarieties.map((variety) => {
              const ideas = getIdeas(variety.name)
              const imageIndex = recipeImages.length > 0
                ? Math.abs(Number(variety.id || 0)) % recipeImages.length
                : -1
              const recipeImage = imageIndex >= 0 ? recipeImages[imageIndex] : null

              return (
                <article key={variety.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <div
                    className="h-44 bg-slate-100"
                    style={recipeImage ? { backgroundImage: `url(${recipeImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  />

                  <div className="p-5">
                    <h2 className="text-lg font-black text-slate-900">{variety.name}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Explore common Indian preparations for this crop.
                    </p>

                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">Popular Ideas</p>
                    <ul className="mt-1 space-y-1">
                      {ideas.map((idea, index) => (
                        <li key={`${variety.id}-${index}`} className="text-sm text-slate-700">• {idea}</li>
                      ))}
                    </ul>

                    <button
                      onClick={() => openRecipeSearch(variety.name)}
                      className="mt-4 w-full rounded-md bg-lime-500 px-3 py-2 text-sm font-bold text-black hover:bg-lime-400"
                    >
                      Find Indian Recipes
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </main>
    </div>
  )
}