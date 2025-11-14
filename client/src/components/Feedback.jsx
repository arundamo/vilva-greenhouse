import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Feedback() {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, high, low

  useEffect(() => {
    loadFeedback()
  }, [])

  const loadFeedback = () => {
    setLoading(true)
    axios.get('/api/sales/feedback')
      .then(res => {
        setFeedback(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        alert('Failed to load feedback: ' + (err.response?.data?.error || err.message))
        setLoading(false)
      })
  }

  const StarDisplay = ({ rating }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className="text-lg">
            {star <= rating ? '⭐' : '☆'}
          </span>
        ))}
      </div>
    )
  }

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredFeedback = feedback.filter(f => {
    if (filter === 'high') return f.rating >= 4
    if (filter === 'low') return f.rating <= 2
    return true
  })

  const averageRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : 0

  if (loading) return <div className="text-center py-10">Loading feedback...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Customer Feedback</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Reviews</div>
          <div className="text-3xl font-bold text-gray-800">{feedback.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Average Rating</div>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-bold text-green-600">{averageRating}</div>
            <StarDisplay rating={Math.round(parseFloat(averageRating))} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">High Ratings (4-5 ⭐)</div>
          <div className="text-3xl font-bold text-green-600">
            {feedback.filter(f => f.rating >= 4).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b pb-2">
        {['all', 'high', 'low'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-t-lg transition-colors ${
              filter === f
                ? 'bg-green-600 text-white font-semibold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' && 'All Feedback'}
            {f === 'high' && '⭐ High Ratings (4-5)'}
            {f === 'low' && '⚠️ Low Ratings (1-2)'}
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No feedback found for this filter
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {item.customer_name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      Order #{item.order_id}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    📞 {item.phone} • 📅 Delivered: {item.delivery_date}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(item.submitted_at).toLocaleDateString()}
                  </div>
                  <div className={`text-2xl font-bold ${getRatingColor(item.rating)}`}>
                    {item.rating}/5
                  </div>
                </div>
              </div>

              {/* Rating Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-600 mb-1">Overall Rating</div>
                  <StarDisplay rating={item.rating} />
                </div>
                {item.delivery_quality > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600 mb-1">Delivery Quality</div>
                    <StarDisplay rating={item.delivery_quality} />
                  </div>
                )}
                {item.product_freshness > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600 mb-1">Product Freshness</div>
                    <StarDisplay rating={item.product_freshness} />
                  </div>
                )}
              </div>

              {/* Comments */}
              {item.comments && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <div className="text-sm font-medium text-blue-900 mb-1">Customer Comments:</div>
                  <p className="text-gray-700">{item.comments}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
