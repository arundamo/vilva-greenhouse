import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Activities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [crops, setCrops] = useState([])
  const [formData, setFormData] = useState({
    crop_id: '',
    activity_date: new Date().toISOString().slice(0, 10),
    activity_type: 'watering',
    description: '',
    quantity: '',
    notes: ''
  })

  useEffect(() => {
    loadActivities()
    loadCrops()
  }, [])

  const loadCrops = () => {
    // Load only growing crops for activity logging
    axios.get('/api/crops').then(res => {
      const growingCrops = res.data.filter(c => c.status === 'growing' || c.status === 'ready')
      setCrops(growingCrops)
    }).catch(console.error)
  }

  const loadActivities = () => {
    axios.get('/api/activities').then(res => {
      setActivities(res.data)
      setLoading(false)
    }).catch(console.error)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    axios.post('/api/activities', formData).then(() => {
      loadActivities()
      closeModal()
      alert('Activity logged successfully!')
    }).catch(err => {
      console.error(err)
      alert('Failed to log activity: ' + (err.response?.data?.error || err.message))
    })
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({
      crop_id: '',
      activity_date: new Date().toISOString().slice(0, 10),
      activity_type: 'watering',
      description: '',
      quantity: '',
      notes: ''
    })
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      axios.delete(`/api/activities/${id}`).then(() => {
        loadActivities()
        alert('Activity deleted successfully!')
      }).catch(err => {
        console.error(err)
        alert('Failed to delete activity: ' + (err.response?.data?.error || err.message))
      })
    }
  }

  const getActivityIcon = (type) => {
    switch(type) {
      case 'watering': return '💧'
      case 'fertilizer': return '🌾'
      case 'weeding': return '🪴'
      case 'pest_control': return '🐛'
      case 'inspection': return '👀'
      default: return '📝'
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Daily Activities Log</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm sm:text-base w-full sm:w-auto"
        >
          + Log Activity
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Location</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Variety</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Details</th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                  {activity.activity_date}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <span className="inline-flex items-center text-xs sm:text-sm">
                    <span className="mr-2 text-lg sm:text-2xl">{getActivityIcon(activity.activity_type)}</span>
                    <span className="font-medium">{activity.activity_type.replace('_', ' ')}</span>
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                  {activity.greenhouse_name} - {activity.bed_name}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-green-700 font-medium hidden lg:table-cell">
                  {activity.variety_name}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                  {activity.description}
                  {activity.quantity && ` (${activity.quantity})`}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm">
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
              </div>
            </div>
          </div>
        </div>

      {activities.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg">
          No activities logged yet.
        </div>
      )}

      {/* Log Activity Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Log Activity</h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Crop *
                </label>
                <select
                  value={formData.crop_id}
                  onChange={(e) => setFormData({ ...formData, crop_id: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Crop</option>
                  {crops.map(crop => (
                    <option key={crop.id} value={crop.id}>
                      {crop.greenhouse_name} - {crop.bed_name} | {crop.variety_name} ({crop.status})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only showing growing crops</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Activity Date *
                  </label>
                  <input
                    type="date"
                    value={formData.activity_date}
                    onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Activity Type *
                  </label>
                  <select
                    value={formData.activity_type}
                    onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  >
                    <option value="watering">💧 Watering</option>
                    <option value="fertilizer">🌾 Fertilizer</option>
                    <option value="weeding">🪴 Weeding</option>
                    <option value="pest_control">🐛 Pest Control</option>
                    <option value="inspection">👀 Inspection</option>
                    <option value="other">📝 Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="e.g., Applied organic fertilizer, Watered 50L"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g., 50L, 2kg"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                  placeholder="Additional notes or observations"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Log Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
