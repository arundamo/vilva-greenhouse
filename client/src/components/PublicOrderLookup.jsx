import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { formatCAD } from '../utils/currency'

const statusLabel = (status) => {
  if (status === 'unconfirmed') return 'Unconfirmed'
  if (status === 'pending') return 'Pending'
  if (status === 'packed') return 'Packed'
  if (status === 'delivered') return 'Delivered'
  if (status === 'cancelled') return 'Cancelled'
  return status || 'Unknown'
}

const statusClass = (status) => {
  if (status === 'unconfirmed') return 'bg-amber-100 text-amber-800'
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800'
  if (status === 'packed') return 'bg-blue-100 text-blue-800'
  if (status === 'delivered') return 'bg-green-100 text-green-800'
  if (status === 'cancelled') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-700'
}

export default function PublicOrderLookup() {
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setOrder(null)

    try {
      setLoading(true)
      const response = await axios.post('/api/public/orders/lookup', formData)
      setOrder(response.data)
    } catch (lookupError) {
      console.error(lookupError)
      setError(lookupError.response?.data?.error || 'Unable to find order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-30 bg-lime-500 text-black border-b border-lime-400/70">
        <div className="mx-auto max-w-5xl px-4 py-2 text-center text-xs font-black tracking-[0.22em] sm:text-sm">
          VILVA GREENHOUSE FARMS
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <section className="rounded-2xl border border-lime-700/40 bg-green-950/70 p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Track Your Order</h1>
            <p className="mt-2 text-lime-100/80 text-sm sm:text-base">
              Enter your order number, name, and phone number to view your order status.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="number"
              min="1"
              placeholder="Order Number"
              value={formData.order_id}
              onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
              className="rounded-lg border border-lime-700/40 bg-black/40 px-3 py-2 text-white placeholder:text-lime-100/45"
              required
            />
            <input
              type="text"
              placeholder="Your Name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="rounded-lg border border-lime-700/40 bg-black/40 px-3 py-2 text-white placeholder:text-lime-100/45"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="rounded-lg border border-lime-700/40 bg-black/40 px-3 py-2 text-white placeholder:text-lime-100/45"
              required
            />

            <div className="md:col-span-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-lime-500 px-5 py-2.5 text-sm font-black tracking-wide text-black hover:bg-lime-400 disabled:opacity-60"
              >
                {loading ? 'Searching...' : 'Search Order'}
              </button>
              <Link
                to="/"
                className="rounded-lg border border-lime-400/60 px-4 py-2.5 text-sm font-bold text-lime-200 hover:bg-lime-400 hover:text-black"
              >
                Home
              </Link>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-400/40 bg-red-950/45 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </section>

        {order && (
          <section className="mt-6 rounded-2xl border border-lime-700/40 bg-green-950/70 p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">Order #{order.id}</h2>
                <p className="text-sm text-lime-100/80 mt-1">
                  Ordered: {order.order_date || '-'}
                  {order.delivery_date ? ` • Delivery: ${order.delivery_date}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(order.delivery_status)}`}>
                  {statusLabel(order.delivery_status)}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {formatCAD(order.total_amount || 0)}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-lime-700/35 pt-4">
              <p className="text-sm font-semibold text-lime-100 mb-2">Items</p>
              <ul className="space-y-1 text-sm text-lime-100/85">
                {(order.items || []).map((item) => (
                  <li key={item.id}>
                    - {item.variety_name} - {item.quantity} {item.unit}
                  </li>
                ))}
              </ul>
            </div>

            {order.delivery_address && (
              <p className="mt-3 text-sm text-lime-100/85">
                <span className="font-semibold text-lime-100">Delivery Address:</span> {order.delivery_address}
              </p>
            )}

            {order.notes && (
              <p className="mt-2 text-sm text-lime-100/85">
                <span className="font-semibold text-lime-100">Notes:</span> {order.notes}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
