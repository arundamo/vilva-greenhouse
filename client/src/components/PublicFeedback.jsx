import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

export default function PublicFeedback() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    rating: 0,
    delivery_quality: 0,
    product_freshness: 0,
    comments: '',
    customer_name: ''
  })

  useEffect(() => {
    // Fetch order details
    axios.get(`/api/public/feedback/${orderId}`)
      .then(res => {
        setOrder(res.data)
        setFormData(prev => ({ ...prev, customer_name: res.data.customer_name }))
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load order details')
        setLoading(false)
      })
  }, [orderId])

  const handleRatingClick = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (formData.rating === 0) {
      alert('Please provide an overall rating')
      return
    }

    setLoading(true)
    axios.post(`/api/public/feedback/${orderId}`, formData)
      .then(() => {
        setSubmitted(true)
      })
      .catch(err => {
        alert(err.response?.data?.error || 'Failed to submit feedback')
      })
      .finally(() => setLoading(false))
  }

  const StarRating = ({ value, onChange, label }) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="text-3xl focus:outline-none transition-transform hover:scale-110"
            >
              {star <= value ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to Load Feedback Form</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/" className="text-green-600 hover:underline">Return to Home</a>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-700 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your feedback has been submitted successfully. We truly appreciate your input and will use it to improve our services.
          </p>
          <a 
            href="/" 
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">Vilva Greenhouse Farm</h1>
          <p className="text-gray-600">We'd Love Your Feedback!</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order Details</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Order #:</span> {order.id}</p>
            <p><span className="font-medium">Order Date:</span> {order.order_date}</p>
            <p><span className="font-medium">Delivery Date:</span> {order.delivery_date}</p>
            {order.items && order.items.length > 0 && (
              <div className="mt-4">
                <p className="font-medium mb-2">Items:</p>
                <ul className="list-disc list-inside pl-2 text-gray-700">
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.variety_name} - {item.quantity} {item.unit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">How was your experience?</h2>

          <StarRating
            label="Overall Rating *"
            value={formData.rating}
            onChange={(value) => handleRatingClick('rating', value)}
          />

          <StarRating
            label="Delivery Quality"
            value={formData.delivery_quality}
            onChange={(value) => handleRatingClick('delivery_quality', value)}
          />

          <StarRating
            label="Product Freshness"
            value={formData.product_freshness}
            onChange={(value) => handleRatingClick('product_freshness', value)}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Tell us more about your experience..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter your name"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Your feedback helps us serve you better. Thank you for choosing Vilva Greenhouse Farm!
        </p>
      </div>
    </div>
  )
}
