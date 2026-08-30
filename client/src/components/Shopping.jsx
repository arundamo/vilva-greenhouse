import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { formatCAD } from '../utils/currency'

export default function Shopping() {
  const navigate = useNavigate()
  const [varieties, setVarieties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError('')

    axios.get('/api/public/varieties')
      .then(res => {
        setVarieties(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load crops. Please try again.')
        setLoading(false)
      })
  }, [retryCount])

  const getPriceRows = (variety) => {
    const priceRows = [
      { label: 'Per Bunch', value: parseFloat(variety.price_per_bunch) || 0 },
      { label: 'Per Kg', value: parseFloat(variety.price_per_kg) || 0 },
      { label: 'Per 100g', value: parseFloat(variety.price_per_100g) || 0 }
    ]
    return priceRows.filter(row => row.value > 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Loading shop...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-4 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-green-700">
            Vilva Greenhouse
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Home
            </Link>
            <button
              onClick={() => navigate('/order')}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              Place Order
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Shop Fresh Crops</h1>
          <p className="text-slate-600 max-w-2xl">
            Browse our current spinach and leafy crop varieties with transparent pricing and place your order online.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {varieties.map((variety) => {
            const priceRows = getPriceRows(variety)
            return (
              <article key={variety.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">{variety.name}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {variety.days_to_harvest ? `${variety.days_to_harvest} days to harvest` : 'Seasonal crop'}
                </p>

                {priceRows.length > 0 ? (
                  <div className="mt-5 space-y-2">
                    {priceRows.map((row) => (
                      <div key={row.label} className="flex justify-between text-sm">
                        <span className="text-slate-600">{row.label}</span>
                        <span className="font-semibold text-green-700">{formatCAD(row.value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">Price available on request.</p>
                )}

                <button
                  onClick={() => navigate('/order')}
                  className="mt-6 w-full rounded-xl bg-green-600 text-white py-2.5 font-medium hover:bg-green-700 transition-colors"
                >
                  Order This Crop
                </button>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
