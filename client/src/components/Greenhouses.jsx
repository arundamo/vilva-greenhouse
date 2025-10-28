import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Greenhouses() {
  const [greenhouses, setGreenhouses] = useState([])
  const [selectedGH, setSelectedGH] = useState(null)
  const [beds, setBeds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGreenhouses()
  }, [])

  const loadGreenhouses = () => {
    axios.get('/api/greenhouses').then(res => {
      setGreenhouses(res.data)
      setLoading(false)
      if (res.data.length > 0 && !selectedGH) {
        loadGreenhouseDetails(res.data[0].id)
      }
    }).catch(console.error)
  }

  const loadGreenhouseDetails = (id) => {
    axios.get(`/api/greenhouses/${id}`).then(res => {
      setSelectedGH(res.data)
      setBeds(res.data.beds || [])
    }).catch(console.error)
  }

  // A bed is occupied if any crop is present
  const getBedStatus = (bed) => {
    const hasCrops = Array.isArray(bed.crops) && bed.crops.length > 0
    if (hasCrops) return 'occupied'
    return bed.status === 'occupied' || bed.crop_id ? 'occupied' : bed.status
  }

  const getBedColor = (bed) => {
    const status = getBedStatus(bed)
    switch(status) {
      case 'occupied': return 'bg-green-100 border-green-400'
      case 'preparation': return 'bg-yellow-100 border-yellow-400'
      case 'available': return 'bg-gray-50 border-gray-300'
      default: return 'bg-gray-50 border-gray-300'
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  // Sort beds numerically by extracting the number from bed_name (L1, L2, ..., L10)
  const sortBeds = (bedsArray) => {
    return bedsArray.sort((a, b) => {
      const numA = parseInt(a.bed_name.substring(1))
      const numB = parseInt(b.bed_name.substring(1))
      return numA - numB
    })
  }

  const leftBeds = sortBeds(beds.filter(b => b.side === 'Left'))
  const rightBeds = sortBeds(beds.filter(b => b.side === 'Right'))

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Greenhouses & Raised Beds</h2>

      {/* Greenhouse Selection */}
      <div className="flex space-x-4">
        {greenhouses.map((gh) => (
          <button
            key={gh.id}
            onClick={() => loadGreenhouseDetails(gh.id)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              selectedGH?.id === gh.id
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-green-50 border'
            }`}
          >
            {gh.name}
            <div className="text-xs mt-1">
              {gh.occupied_beds}/{gh.total_beds} occupied
            </div>
          </button>
        ))}
      </div>

      {/* Bed Layout */}
      {selectedGH && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">{selectedGH.name} - {selectedGH.description}</h3>
          <p className="text-sm text-gray-600 mb-6">Each bed is 8×4 ft (32 sq ft)</p>

          <div className="flex gap-8 justify-center">
            {/* Left Column */}
            <div className="space-y-2">
              <h4 className="text-center font-semibold text-gray-700 mb-3">Left Side (L1-L10)</h4>
              {leftBeds.map((bed) => (
                <div
                  key={bed.id}
                  className={`border-2 rounded p-3 w-48 ${getBedColor(bed)} hover:shadow-md transition-shadow`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold">{bed.bed_name}</span>
                    <span className="text-xs px-2 py-1 rounded bg-white">
                      {getBedStatus(bed)}
                    </span>
                  </div>
                  {/* Show all crops for this bed */}
                  {Array.isArray(bed.crops) && bed.crops.length > 0 ? (
                    <div className="mt-2 text-sm">
                      {bed.crops.map((crop) => (
                        <div key={crop.id} className="mb-1">
                          <p className="font-medium text-green-700">{crop.variety_name}</p>
                          <p className="text-xs text-gray-600">{crop.status} (Sowed: {crop.sowing_date})</p>
                        </div>
                      ))}
                    </div>
                  ) : bed.variety_name ? (
                    <div className="mt-2 text-sm">
                      <p className="font-medium text-green-700">{bed.variety_name}</p>
                      <p className="text-xs text-gray-600">{bed.crop_status}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Center Aisle */}
            <div className="flex items-center">
              <div className="w-16 text-center text-gray-400">
                <div className="writing-mode-vertical">↕ Aisle ↕</div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              <h4 className="text-center font-semibold text-gray-700 mb-3">Right Side (R1-R10)</h4>
              {rightBeds.map((bed) => (
                <div
                  key={bed.id}
                  className={`border-2 rounded p-3 w-48 ${getBedColor(bed)} hover:shadow-md transition-shadow`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold">{bed.bed_name}</span>
                    <span className="text-xs px-2 py-1 rounded bg-white">
                      {getBedStatus(bed)}
                    </span>
                  </div>
                  {/* Show all crops for this bed */}
                  {Array.isArray(bed.crops) && bed.crops.length > 0 ? (
                    <div className="mt-2 text-sm">
                      {bed.crops.map((crop) => (
                        <div key={crop.id} className="mb-1">
                          <p className="font-medium text-green-700">{crop.variety_name}</p>
                          <p className="text-xs text-gray-600">{crop.status} (Sowed: {crop.sowing_date})</p>
                        </div>
                      ))}
                    </div>
                  ) : bed.variety_name ? (
                    <div className="mt-2 text-sm">
                      <p className="font-medium text-green-700">{bed.variety_name}</p>
                      <p className="text-xs text-gray-600">{bed.crop_status}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
              <span>Preparation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border-2 border-gray-300 rounded"></div>
              <span>Available</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
