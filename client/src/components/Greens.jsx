import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const buildSlides = (globResult) => (
  Object.entries(globResult)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, src]) => src)
)

const greensCardImages = buildSlides(
  import.meta.glob('../assets/home-slideshow/greens/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
    eager: true,
    import: 'default'
  })
)

const fallbackBenefits = [
  'Rich in iron and folate to support healthy blood production.',
  'Packed with fiber to aid digestion and gut health.',
  'Contains antioxidants that support immunity and recovery.',
  'Low-calorie nutrient-dense greens for everyday wellness.'
]

const benefitByKeyword = [
  { keyword: 'baby', benefit: 'Tender leaves are gentle on digestion and ideal for fresh salads.' },
  { keyword: 'red', benefit: 'Naturally pigmented leaves provide extra antioxidant compounds.' },
  { keyword: 'malabar', benefit: 'Heat-tolerant leafy green with hydrating, mineral-rich texture.' },
  { keyword: 'palak', benefit: 'Classic spinach profile high in iron, vitamin C, and vitamin K.' }
]

function getBenefitsForVariety(name) {
  const normalized = String(name || '').toLowerCase()
  const matched = benefitByKeyword
    .filter((entry) => normalized.includes(entry.keyword))
    .map((entry) => entry.benefit)

  return matched.length > 0 ? [...matched, ...fallbackBenefits.slice(0, 2)] : fallbackBenefits.slice(0, 3)
}

export default function Greens() {
  const [varieties, setVarieties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    axios.get('/api/public/varieties')
      .then((response) => {
        setVarieties(Array.isArray(response.data) ? response.data : [])
      })
      .catch((loadError) => {
        console.error(loadError)
        setError('Failed to load crop information. Please try again.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const enrichedVarieties = useMemo(
    () => varieties.map((variety) => ({ ...variety, benefits: getBenefitsForVariety(variety.name) })),
    [varieties]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-slate-600 font-medium">Loading greens information...</p>
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
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Our Greens</h1>
          <p className="text-slate-600 mt-1">Explore available crops, descriptions, and health benefits.</p>
        </div>

        {enrichedVarieties.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            No crop varieties available right now.
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {enrichedVarieties.map((variety) => {
              const imageIndex = greensCardImages.length > 0
                ? Math.abs(Number(variety.id || 0)) % greensCardImages.length
                : -1
              const cropImage = imageIndex >= 0 ? greensCardImages[imageIndex] : null

              return (
                <article key={variety.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <div
                    className="h-44 bg-slate-100"
                    style={cropImage ? { backgroundImage: `url(${cropImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  />

                  <div className="p-5">
                  <div className="flex items-start gap-2">
                    <h2 className="text-lg font-black text-slate-900">{variety.name}</h2>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {variety.description || 'Fresh greenhouse-grown leafy greens selected for taste and nutrition.'}
                  </p>

                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Benefits</p>
                    <ul className="mt-2 space-y-1">
                      {variety.benefits.map((benefit, index) => (
                        <li key={`${variety.id}-${index}`} className="text-sm text-slate-700">
                          • {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
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