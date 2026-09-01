import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { formatCAD } from '../utils/currency'

const DEFAULT_PRODUCT_IMAGE = '/images/no-photo-available.svg'

export default function Shopping() {
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [cart, setCart] = useState({})
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    delivery_address: '',
    delivery_date: '',
    notes: ''
  })

  useEffect(() => {
    setLoading(true)
    setError('')

    axios.get('/api/public/marketplace-crops')
      .then(res => {
        setCrops(Array.isArray(res.data) ? res.data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load crops. Please try again.')
        setLoading(false)
      })
  }, [retryCount])

  const getBunchPrice = (crop) => parseFloat(crop.price_per_bunch) || 0

  const addToCart = (crop) => {
    const key = String(crop.variety_id || crop.crop_id)
    setCart((prev) => {
      const existing = prev[key]
      return {
        ...prev,
        [key]: {
          variety_id: crop.variety_id,
          variety_name: crop.variety_name,
          price_per_bunch: getBunchPrice(crop),
          quantity: existing ? existing.quantity + 1 : 1
        }
      }
    })
  }

  const updateCartQty = (key, delta) => {
    setCart((prev) => {
      const item = prev[key]
      if (!item) return prev

      const nextQty = item.quantity + delta
      if (nextQty <= 0) {
        const next = { ...prev }
        delete next[key]
        return next
      }

      return {
        ...prev,
        [key]: { ...item, quantity: nextQty }
      }
    })
  }

  const cartItems = Object.entries(cart).map(([key, item]) => ({ key, ...item }))
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartItems.reduce((total, item) => total + (item.quantity * item.price_per_bunch), 0)

  const handleCheckout = () => {
    if (cartCount === 0) {
      alert('Please add at least one item to cart')
      return
    }

    setShowCheckoutForm(true)
    setOrderSuccess(null)
  }

  const handleSubmitOrder = async (event) => {
    event.preventDefault()
    setOrderSuccess(null)

    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      alert('Please enter a valid 10-digit phone number')
      return
    }

    if (cartCount === 0) {
      alert('Please add at least one item to cart')
      return
    }

    const payload = {
      customer_name: formData.customer_name,
      phone: formData.phone,
      delivery_address: formData.delivery_address,
      delivery_date: formData.delivery_date,
      notes: formData.notes,
      items: cartItems.map((item) => ({
        variety_id: item.variety_id,
        quantity: item.quantity,
        unit: 'bunches'
      }))
    }

    try {
      setSubmitting(true)
      const response = await axios.post('/api/public/orders', payload)
      setOrderSuccess(response.data)
      setCart({})
      setShowCheckoutForm(false)
      setFormData({
        customer_name: '',
        phone: '',
        delivery_address: '',
        delivery_date: '',
        notes: ''
      })
    } catch (submitError) {
      console.error(submitError)
      alert(`Failed to submit order: ${submitError.response?.data?.error || submitError.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lime-300 font-semibold tracking-wider">Loading marketplace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 text-white">
        <div className="max-w-md w-full border border-red-400/40 bg-red-950/40 backdrop-blur rounded-xl p-6 text-center">
          <p className="text-red-300 font-medium">{error}</p>
          <button
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-4 px-4 py-2 rounded-lg bg-lime-500 text-black font-bold hover:bg-lime-400"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-30 bg-lime-500 text-black border-b border-lime-400/70">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs font-black tracking-[0.22em] sm:text-sm">
          VILVA GREENHOUSE FARMS
        </div>
      </div>

      <header className="sticky top-9 z-20 border-b border-lime-700/40 bg-green-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="text-xl sm:text-2xl font-black tracking-[0.18em] text-lime-300">
            Vilva Greenhouse
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg border border-lime-400/60 text-lime-200 hover:bg-lime-400 hover:text-black text-sm font-bold"
            >
              Home
            </Link>
            <button
              onClick={handleCheckout}
              className="px-4 py-2 rounded-lg bg-lime-500 text-black font-black tracking-wide hover:bg-lime-400 text-sm"
            >
              Place Order ({cartCount})
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="pointer-events-none absolute inset-x-0 top-2 -z-10 h-40 bg-[radial-gradient(circle_at_top,#84cc16_0%,rgba(132,204,22,0.12)_28%,rgba(0,0,0,0)_70%)]" />

        <section className="mb-6 rounded-2xl overflow-hidden border border-lime-700/40 bg-zinc-950/80 shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
          <div className="p-5 sm:p-6">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Marketplace</h1>
            <p className="text-lime-100/80 mt-1">Fresh crops available for ordering</p>
          </div>
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="inline-flex rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-xs font-semibold text-lime-200">
              Showing <span className="ml-1 font-black text-lime-100">{crops.length}</span>&nbsp;items
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div>
            {crops.length === 0 ? (
              <div className="border border-lime-800/40 bg-zinc-950/70 rounded-xl p-8 text-center text-lime-100/80">
                No crops available right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {crops.map((crop) => {
                  const bunchPrice = getBunchPrice(crop)
                  const productImage = DEFAULT_PRODUCT_IMAGE

                  return (
                    <article key={crop.crop_id} className="group rounded-xl overflow-hidden border border-lime-800/40 bg-zinc-950/80 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1">
                      <div className="h-44" style={{ backgroundImage: `url(${productImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <div className="p-3">
                        <h2 className="text-base font-black text-white line-clamp-1 tracking-wide">{crop.variety_name}</h2>
                        <p className="mt-1 text-sm font-semibold text-lime-300">
                          {bunchPrice > 0 ? `${formatCAD(bunchPrice)} / bunch` : 'Price on request'}
                        </p>
                        <button
                          onClick={() => addToCart(crop)}
                          className="mt-3 w-full rounded-md bg-lime-500 px-3 py-2 text-sm font-black tracking-wide text-black hover:bg-lime-400"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="border border-lime-700/40 bg-green-950/70 backdrop-blur rounded-xl p-4 h-fit lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-white">Cart</h2>
              <span className="text-xs font-semibold bg-lime-400/20 border border-lime-400/40 text-lime-200 px-2 py-1 rounded-full">{cartCount} items</span>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-sm text-lime-100/70">Your cart is empty. Add items from the list.</p>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.key} className="border border-lime-700/35 bg-black/25 rounded-lg p-3">
                    <p className="text-sm font-semibold text-white line-clamp-1">{item.variety_name}</p>
                    <p className="text-xs text-lime-300 mt-1">{formatCAD(item.price_per_bunch)} / bunch</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-lime-500/50 overflow-hidden">
                        <button
                          onClick={() => updateCartQty(item.key, -1)}
                          className="px-2 py-1 text-sm text-lime-200 hover:bg-lime-500/20"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-sm font-semibold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.key, 1)}
                          className="px-2 py-1 text-sm text-lime-200 hover:bg-lime-500/20"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-bold text-white">{formatCAD(item.quantity * item.price_per_bunch)}</p>
                    </div>
                  </div>
                ))}

                <div className="border-t border-lime-700/30 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-lime-100/75">Estimated total</span>
                    <span className="font-black text-white">{formatCAD(cartTotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-lime-100/60">
                    Fill your details below and submit your order from this page.
                  </p>
                  <button
                    onClick={handleCheckout}
                    className="mt-3 w-full rounded-md bg-lime-500 px-3 py-2 text-sm font-black tracking-wide text-black hover:bg-lime-400"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {orderSuccess && (
              <div className="mt-4 rounded-lg border border-emerald-400/40 bg-emerald-950/40 p-3 text-sm text-emerald-200">
                Order submitted successfully. Order #{orderSuccess.order_id}.
              </div>
            )}

            {showCheckoutForm && cartItems.length > 0 && (
              <form onSubmit={handleSubmitOrder} className="mt-4 border-t border-lime-700/30 pt-4 space-y-3">
                <h3 className="text-base font-black text-white">Checkout Details</h3>
                <p className="text-xs text-lime-100/65">Complete this form to place your order directly from marketplace.</p>

                <div>
                  <label className="block text-xs font-semibold text-lime-100 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full border border-lime-700/40 bg-black/35 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-lime-100 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full border border-lime-700/40 bg-black/35 text-white placeholder:text-lime-100/45 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-lime-100 mb-1">Delivery Address *</label>
                  <textarea
                    required
                    rows="2"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                    className="w-full border border-lime-700/40 bg-black/35 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-lime-100 mb-1">Preferred Delivery Date *</label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full border border-lime-700/40 bg-black/35 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-lime-100 mb-1">Additional Notes</label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special requests or instructions?"
                    className="w-full border border-lime-700/40 bg-black/35 text-white placeholder:text-lime-100/45 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-lime-500 px-3 py-2 text-sm font-black tracking-wide text-black hover:bg-lime-400 disabled:bg-slate-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Order Request'}
                </button>
              </form>
            )}
          </aside>
        </section>
      </main>
    </div>
  )
}
