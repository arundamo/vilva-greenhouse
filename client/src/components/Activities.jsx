import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Activities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = () => {
    axios.get('/api/activities').then(res => {
      setActivities(res.data)
      setLoading(false)
    }).catch(console.error)
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Daily Activities Log</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + Log Activity
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variety</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activity.activity_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center text-sm">
                    <span className="mr-2 text-2xl">{getActivityIcon(activity.activity_type)}</span>
                    <span className="font-medium">{activity.activity_type.replace('_', ' ')}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {activity.greenhouse_name} - {activity.bed_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-medium">
                  {activity.variety_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {activity.description}
                  {activity.quantity && ` (${activity.quantity})`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activities.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg">
          No activities logged yet.
        </div>
      )}
    </div>
  )
}
