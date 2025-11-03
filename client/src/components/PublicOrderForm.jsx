import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function PublicOrderForm() {
  const [varieties, setVarieties] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [orderDetails, setOrderDetails] = useState(null)
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    delivery_address: '',
    delivery_date: '',
    notes: '',
    items: [{ variety_id: '', quantity: '', unit: 'bunches' }]
  })

  useEffect(() => {
    loadVarieties()
  }, [])

  const loadVarieties = () => {
    // Use public varieties endpoint (no auth required)
    axios.get('/api/public/varieties').then(res => {
      setVarieties(res.data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }

  // Calculate price for an item
  const calculateItemPrice = (item) => {
    if (!item.variety_id || !item.quantity) return 0
    
    const variety = varieties.find(v => v.id === parseInt(item.variety_id))
    if (!variety) return 0
    
    const quantity = parseFloat(item.quantity)
    if (isNaN(quantity)) return 0
    
    // Helper to parse price (handles empty strings, null, etc.)
    const getPrice = (price) => parseFloat(price) || 0
    
    switch(item.unit) {
      case 'bunches':
        return quantity * getPrice(variety.price_per_bunch)
      case 'kg':
        return quantity * getPrice(variety.price_per_kg)
      case 'grams':
        return (quantity / 100) * getPrice(variety.price_per_100g)
      default:
        return 0
    }
  }

  // Calculate total order price
  const calculateTotalPrice = () => {
    return formData.items.reduce((total, item) => {
      return total + calculateItemPrice(item)
    }, 0)
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { variety_id: '', quantity: '', unit: 'bunches' }]
    })
  }

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      alert('Order must have at least one item')
      return
    }
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate phone number
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      alert('Please enter a valid 10-digit phone number')
      return
    }

    // Validate items
    const hasEmptyItems = formData.items.some(item => !item.variety_id || !item.quantity)
    if (hasEmptyItems) {
      alert('Please select variety and quantity for all items')
      return
    }

    setSubmitting(true)

    axios.post('/api/public/orders', formData)
      .then(res => {
        setOrderDetails(res.data)
        setOrderSubmitted(true)
        setSubmitting(false)
      })
      .catch(err => {
        console.error(err)
        alert('Failed to submit order: ' + (err.response?.data?.error || err.message))
        setSubmitting(false)
      })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <p className="text-gray-600">Loading order form...</p>
        </div>
      </div>
    )
  }

  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-green-600 mb-4">
              Order Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your order. We'll contact you shortly to confirm the details.
            </p>

            {orderDetails && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-6 text-left">
                <h3 className="font-semibold text-lg mb-3">Order Details:</h3>
                <div className="space-y-2 text-sm sm:text-base">
                  <p><strong>Order #:</strong> {orderDetails.order_id}</p>
                  <p><strong>Name:</strong> {formData.customer_name}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  <p><strong>Delivery Date:</strong> {formData.delivery_date}</p>
                  <div>
                    <strong>Items Ordered:</strong>
                    <ul className="ml-4 mt-2 space-y-1">
                      {formData.items.map((item, idx) => {
                        const variety = varieties.find(v => v.id === parseInt(item.variety_id))
                        const itemPrice = calculateItemPrice(item)
                        return (
                          <li key={idx} className="flex justify-between">
                            <span>• {variety?.name} - {item.quantity} {item.unit}</span>
                            {itemPrice > 0 && <span className="font-medium">₹{itemPrice.toFixed(2)}</span>}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  {calculateTotalPrice() > 0 && (
                    <div className="border-t pt-2 mt-3">
                      <p className="flex justify-between text-lg">
                        <strong>Estimated Total:</strong> 
                        <strong className="text-green-700">₹{calculateTotalPrice().toFixed(2)}</strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">*Price may vary based on final confirmation</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>📞 What's Next?</strong><br/>
                Our team will call you within 24 hours to confirm your order, discuss pricing, and arrange delivery details.
              </p>
            </div>

            <button
              onClick={() => {
                setOrderSubmitted(false)
                setFormData({
                  customer_name: '',
                  phone: '',
                  delivery_address: '',
                  delivery_date: '',
                  notes: '',
                  items: [{ variety_id: '', quantity: '', unit: 'bunches' }]
                })
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Place Another Order
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-6 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <span className="text-4xl sm:text-5xl">🌿</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-green-800">Vilva Greenhouse Farm</h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600">Fresh Spinach & Greens Direct from Our Farm</p>
          <p className="text-sm text-gray-500 mt-2">Place your order online - We'll contact you to confirm</p>
        </div>

        {/* Order Form */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Place Your Order</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Your Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                    placeholder="Enter your name"
                    className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="10-digit mobile number"
                    className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  required
                  rows="2"
                  placeholder="Enter your complete delivery address"
                  className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Delivery Date *
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-700">Items to Order</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  + Add Item
                </button>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Variety *
                      </label>
                      <select
                        value={item.variety_id}
                        onChange={(e) => updateItem(index, 'variety_id', e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select a variety</option>
                        {varieties.map(variety => (
                          <option key={variety.id} value={variety.id}>
                            {variety.name}
                          </option>
                        ))}
                      </select>
                      
                      {/* Show price info for selected variety */}
                      {item.variety_id && (() => {
                        const variety = varieties.find(v => v.id === parseInt(item.variety_id))
                        if (!variety) return null
                        
                        // Helper to parse and check price
                        const getPrice = (price) => parseFloat(price) || 0
                        const priceBunch = getPrice(variety.price_per_bunch)
                        const priceKg = getPrice(variety.price_per_kg)
                        const price100g = getPrice(variety.price_per_100g)
                        
                        const hasPrices = priceBunch > 0 || priceKg > 0 || price100g > 0
                        if (!hasPrices) return null
                        
                        return (
                          <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-2">
                            {priceBunch > 0 && <span>₹{priceBunch}/bunch</span>}
                            {priceKg > 0 && <span>₹{priceKg}/kg</span>}
                            {price100g > 0 && <span>₹{price100g}/100g</span>}
                          </div>
                        )
                      })()}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          required
                          min="1"
                          step="any"
                          placeholder="Qty"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          className="border rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-green-500"
                        >
                          <option value="bunches">Bunches</option>
                          <option value="kg">Kg</option>
                          <option value="grams">Grams</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Item subtotal */}
                  {calculateItemPrice(item) > 0 && (
                    <div className="text-right pt-2 border-t">
                      <span className="text-sm font-semibold text-green-700">
                        Subtotal: ${calculateItemPrice(item).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="2"
                placeholder="Any special requests or instructions?"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Order Total */}
            {calculateTotalPrice() > 0 && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Estimated Total:</span>
                  <span className="text-2xl font-bold text-green-700">${calculateTotalPrice().toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  *This is an estimated price. Final pricing will be confirmed by our team.
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Note:</strong> This is an order request. Our team will contact you within 24 hours to confirm availability, discuss pricing, and finalize delivery details.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting Order...' : 'Submit Order Request'}
            </button>

            <p className="text-xs text-center text-gray-500">
              By submitting, you agree to be contacted by Vilva Greenhouse Farm regarding your order.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>🌱 Fresh • Organic • Locally Grown 🌱</p>
          <p className="mt-2">Questions? Contact us for assistance</p>
        </div>
      </div>
    </div>
  )
}
-$5$0$0$"$>$
$
$ $ $ $ $ $ $ $ $ $ $ $ $ $ $B$y$ $s$u$b$m$i$t$t$i$n$g$,$ $y$o$u$ $a$g$r$e$e$ $t$o$ $b$e$ $c$o$n$t$a$c$t$e$d$ $b$y$ $V$i$l$v$a$ $G$r$e$e$n$h$o$u$s$e$ $F$a$r$m$ $r$e$g$a$r$d$i$n$g$ $y$o$u$r$ $o$r$d$e$r$.$
$
$ $ $ $ $ $ $ $ $ $ $ $ $<$/$p$>$
$
$ $ $ $ $ $ $ $ $ $ $<$/$f$o$r$m$>$
$
$ $ $ $ $ $ $ $ $<$/$d$i$v$>$
$
$
$
$ $ $ $ $ $ $ $ ${$/$*$ $F$o$o$t$e$r$ $*$/$}$
$
$ $ $ $ $ $ $ $ $<$d$i$v$ $c$l$a$s$s$N$a$m$e$=$"$t$e$x$t$-$c$e$n$t$e$r$ $m$t$-$8$ $t$e$x$t$-$s$m$ $t$e$x$t$-$g$r$a$y$-$6$0$0$"$>$
$
$ $ $ $ $ $ $ $ $ $ $<$p$>$�$�$�$�$ $F$r$e$s$h$ $�$�$�$ $O$r$g$a$n$i$c$ $�$�$�$ $L$o$c$a$l$l$y$ $G$r$o$w$n$ $�$�$�$�$<$/$p$>$
$
$ $ $ $ $ $ $ $ $ $ $<$p$ $c$l$a$s$s$N$a$m$e$=$"$m$t$-$2$"$>$Q$u$e$s$t$i$o$n$s$?$ $C$o$n$t$a$c$t$ $u$s$ $f$o$r$ $a$s$s$i$s$t$a$n$c$e$<$/$p$>$
$
$ $ $ $ $ $ $ $ $<$/$d$i$v$>$
$
$ $ $ $ $ $ $<$/$d$i$v$>$
$
$ $ $ $ $<$/$d$i$v$>$
$
$ $ $)$
$
$}$
$
$s text-center text-gray-500">
              By submitting, you agree to be contacted by Vilva Greenhouse Farm regarding your order.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>🌱 Fresh • Organic • Locally Grown 🌱</p>
          <p className="mt-2">Questions? Contact us for assistance</p>
        </div>
      </div>
    </div>
  )
}
