import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { formatCAD } from '../utils/currency'

const EMPTY_FORM = {
  customer_name: '',
  phone: '',
  delivery_address: '',
  delivery_date: '',
  notes: ''
}

export default function PublicCart() {
  const [varieties, setVarieties] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [cartItems, setCartItems] = useState([])
  const [selectedUnits, setSelectedUnits] = useState({})

  useEffect(() => {
    axios.get('/api/public/varieties')
      .then((res) => {
        setVarieties(res.data || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const getBaseUnitPrice = (variety, unit) => {
    if (!variety) return 0
    if (unit === 'kg') return parseFloat(variety.price_per_kg) || 0
    if (unit === 'grams') return parseFloat(variety.price_per_100g) || 0
    return parseFloat(variety.price_per_bunch) || 0
  }

  const getEffectiveUnitPrice = (variety, unit) => {
    const basePrice = getBaseUnitPrice(variety, unit)
    const discount = Math.max(0, parseFloat(variety?.discount_percent) || 0)
    if (!basePrice || discount <= 0) return basePrice
    return basePrice * Math.max(0, 1 - (discount / 100))
  }

  const getAvailableUnits = (variety) => {
    const units = []
    if ((parseFloat(variety?.price_per_bunch) || 0) > 0) units.push('bunches')
    if ((parseFloat(variety?.price_per_kg) || 0) > 0) units.push('kg')
    if ((parseFloat(variety?.price_per_100g) || 0) > 0) units.push('grams')
    return units
  }

  const unitLabel = (unit) => {
    if (unit === 'kg') return 'kg'
    if (unit === 'grams') return '100g'
    return 'bunch'
  }

  const asPromo = (variety, unit) => {
    const compareAt = getBaseUnitPrice(variety, unit)
    const salePrice = getEffectiveUnitPrice(variety, unit)
    if (!salePrice) return null
    const off = Math.max(0, parseFloat(variety?.discount_percent) || 0)
    return {
      salePrice,
      compareAt,
      off,
      offerText: variety?.offer_text || ''
    }
  }

  const getSubtotal = (item) => {
    const variety = varieties.find((v) => v.id === item.variety_id)
    const quantity = parseFloat(item.quantity) || 0
    const unitPrice = getEffectiveUnitPrice(variety, item.unit)
    if (!unitPrice || quantity <= 0) return 0
    return item.unit === 'grams' ? (quantity / 100) * unitPrice : quantity * unitPrice
  }

  const orderTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + getSubtotal(item), 0)
  }, [cartItems, varieties])

  const addToCart = (variety, unit) => {
    const unitPrice = getEffectiveUnitPrice(variety, unit)
    if (!unitPrice) {
      alert('This product has no price for the selected unit yet.')
      return
    }

    const existingIndex = cartItems.findIndex(
      (item) => item.variety_id === variety.id && item.unit === unit
    )

    if (existingIndex >= 0) {
      const updated = [...cartItems]
      updated[existingIndex].quantity = (parseFloat(updated[existingIndex].quantity) || 0) + 1
      setCartItems(updated)
      return
    }

    setCartItems([
      ...cartItems,
      {
        variety_id: variety.id,
        variety_name: variety.name,
        quantity: 1,
        unit
      }
    ])
  }

  const updateCartItem = (index, field, value) => {
    const updated = [...cartItems]
    updated[index][field] = value
    setCartItems(updated)
  }

  const removeCartItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  const resetOrder = () => {
    setForm(EMPTY_FORM)
    setCartItems([])
    setOrderPlaced(false)
    setOrderId(null)
  }

  const submitOrder = (e) => {
    e.preventDefault()

    if (cartItems.length === 0) {
      alert('Please add at least one product to your cart.')
      return
    }

    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) {
      alert('Please enter a valid 10-digit phone number')
      return
    }

    const invalidItem = cartItems.some((item) => !item.variety_id || !(parseFloat(item.quantity) > 0))
    if (invalidItem) {
      alert('Please check quantity for all cart items.')
      return
    }

    setSubmitting(true)
    axios.post('/api/public/orders', {
      ...form,
      items: cartItems.map((item) => ({
        variety_id: item.variety_id,
        quantity: item.quantity,
        unit: item.unit
      }))
    }).then((res) => {
      setOrderPlaced(true)
      setOrderId(res.data?.order_id || null)
      setSubmitting(false)
    }).catch((err) => {
      console.error(err)
      alert('Failed to place order: ' + (err.response?.data?.error || err.message))
      setSubmitting(false)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 to-green-100 flex items-center justify-center">
        <p className="text-gray-700 text-lg">Loading products...</p>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 to-green-100 py-8 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-5xl mb-3">✅</p>
          <h1 className="text-3xl font-bold text-green-700 mb-2">Order Placed</h1>
          <p className="text-gray-600 mb-6">Your order request has been sent to Vilva Greenhouse Farm.</p>
          {orderId && <p className="text-lg font-semibold mb-6">Order ID: #{orderId}</p>}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetOrder}
              className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold"
            >
              Place Another Order
            </button>
            <Link
              to="/"
              className="px-6 py-3 rounded-lg border border-green-600 text-green-700 hover:bg-green-50 font-semibold"
            >
              Back To Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-white py-6 sm:py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-green-900">Fresh Picks</h1>
            <p className="text-gray-600 mt-1">Add items to cart and place your order without logging in.</p>
          </div>
          <Link to="/" className="text-green-700 font-semibold hover:underline">Back to Home</Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
          <section className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Shop All</h2>
              <span className="text-xs sm:text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">{varieties.length} items</span>
            </div>

            <div className="max-h-[72vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {varieties.map((variety) => {
                  const availableUnits = getAvailableUnits(variety)
                  const unit = selectedUnits[variety.id] || availableUnits[0] || 'bunches'
                  const currentPrice = getEffectiveUnitPrice(variety, unit)
                  const promo = asPromo(variety, unit)
                  const inCartQty = cartItems
                    .filter((item) => item.variety_id === variety.id)
                    .reduce((acc, item) => acc + (parseFloat(item.quantity) || 0), 0)

                  return (
                    <article key={variety.id} className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative mb-3 rounded-xl bg-gradient-to-b from-green-50 to-lime-100 h-36 flex items-center justify-center overflow-hidden">
                        <span className="absolute top-2 right-2">
                          <button
                            type="button"
                            onClick={() => addToCart(variety, unit)}
                            disabled={!currentPrice}
                            className="rounded-full bg-green-600 text-white px-4 py-1.5 text-sm font-bold hover:bg-green-700 disabled:bg-gray-400"
                          >
                            + Add
                          </button>
                        </span>
                        <div className="text-center px-4">
                          <p className="text-4xl">🥬</p>
                        </div>
                      </div>

                      {promo && promo.off > 0 ? (
                        <div className="mb-2">
                          <div className="flex items-baseline gap-2">
                            <span className="bg-yellow-300 text-black px-2 py-0.5 rounded-md font-extrabold text-2xl leading-none">
                              {formatCAD(promo.salePrice)}
                            </span>
                            <span className="text-lg">/{unitLabel(unit)}</span>
                          </div>
                          <div className="text-sm text-gray-500 line-through">{formatCAD(promo.compareAt)}</div>
                          <div className="text-2xl font-black text-green-700 leading-tight">{promo.off}% off</div>
                          {promo.offerText && <div className="text-sm font-semibold text-blue-700">{promo.offerText}</div>}
                        </div>
                      ) : promo ? (
                        <div className="mb-2">
                          <div className="flex items-baseline gap-2">
                            <span className="bg-yellow-200 text-black px-2 py-0.5 rounded-md font-extrabold text-2xl leading-none">
                              {formatCAD(promo.salePrice)}
                            </span>
                            <span className="text-lg">/{unitLabel(unit)}</span>
                          </div>
                          {promo.offerText && <div className="text-sm font-semibold text-blue-700 mt-1">{promo.offerText}</div>}
                        </div>
                      ) : (
                        <div className="mb-2 text-sm text-red-600 font-semibold">Price unavailable</div>
                      )}

                      <h3 className="text-[27px] leading-7 font-semibold text-gray-800 mb-1">{variety.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">Fresh from Vilva Greenhouse</p>
                      <p className="text-2xl text-gray-900 font-semibold mb-2">Many in stock</p>

                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs text-gray-600">Unit</label>
                        <select
                          value={unit}
                          onChange={(e) => setSelectedUnits({ ...selectedUnits, [variety.id]: e.target.value })}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1"
                        >
                          {availableUnits.length === 0 ? (
                            <option value="bunches">No priced units</option>
                          ) : (
                            availableUnits.map((u) => (
                              <option key={u} value={u}>{unitLabel(u)}</option>
                            ))
                          )}
                        </select>
                      </div>

                      {inCartQty > 0 && (
                        <p className="text-xs font-semibold text-green-700">In cart: {inCartQty}</p>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-green-100 p-5 sm:p-6 h-fit xl:sticky xl:top-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Cart</h2>

            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-sm mb-4">Your cart is empty. Tap Add on any product card.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {cartItems.map((item, index) => {
                  const subtotal = getSubtotal(item)
                  const variety = varieties.find((v) => v.id === item.variety_id)
                  const availableUnits = getAvailableUnits(variety)
                  return (
                    <div key={`${item.variety_id}-${item.unit}-${index}`} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <p className="font-semibold text-sm text-gray-800">{item.variety_name}</p>
                        <button
                          type="button"
                          onClick={() => removeCartItem(index)}
                          className="text-red-600 text-xs hover:underline"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateCartItem(index, 'quantity', e.target.value)}
                          className="w-24 border rounded-md px-2 py-1 text-sm"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => updateCartItem(index, 'unit', e.target.value)}
                          className="border rounded-md px-2 py-1 text-sm"
                        >
                          {availableUnits.map((unit) => (
                            <option key={unit} value={unit}>{unitLabel(unit)}</option>
                          ))}
                        </select>
                        <span className="ml-auto font-semibold text-green-700 text-sm">{formatCAD(subtotal)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="border-t pt-4 mb-4">
              <p className="flex justify-between text-lg font-bold">
                <span>Estimated total</span>
                <span className="text-green-700">{formatCAD(orderTotal)}</span>
              </p>
            </div>

            <form onSubmit={submitOrder} className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Customer details</h3>
              <input
                type="text"
                placeholder="Your Name"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="tel"
                placeholder="Phone (10 digits)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Delivery Address"
                value={form.delivery_address}
                onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                required
                rows="2"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={form.delivery_date}
                onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows="2"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-green-700 text-white font-bold hover:bg-green-800 disabled:bg-gray-400"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>

              <p className="text-xs text-gray-500">We will call you to confirm availability and delivery details.</p>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}