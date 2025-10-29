import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Greenhouses() {
  const [greenhouses, setGreenhouses] = useState([])
  const [selectedGH, setSelectedGH] = useState(null)
  const [beds, setBeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSowModal, setShowSowModal] = useState(false)
  const [selectedBed, setSelectedBed] = useState(null)
  const [varieties, setVarieties] = useState([])
  const [formData, setFormData] = useState({
    variety_id: '',
    sowing_date: new Date().toISOString().slice(0, 10),
    expected_harvest_date: '',
    quantity_sowed: '',
    notes: ''
  })

  useEffect(() => {
    loadGreenhouses()
    loadVarieties()
  }, [])

  const loadVarieties = () => {
    axios.get('/api/customers/varieties').then(res => {
      setVarieties(res.data)
    }).catch(console.error)
  }

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

  const handleBedClick = (bed) => {
    setSelectedBed(bed)
    setFormData({
      variety_id: '',
      sowing_date: new Date().toISOString().slice(0, 10),
      expected_harvest_date: '',
      quantity_sowed: '',
      notes: ''
    })
    setShowSowModal(true)
  }

  const handleSowCrop = (e) => {
    e.preventDefault()
    const payload = {
      greenhouse_id: selectedGH.id,
      raised_bed_id: selectedBed.id,
      ...formData
    }
    axios.post('/api/crops', payload).then(() => {
      setShowSowModal(false)
      loadGreenhouseDetails(selectedGH.id)
      alert('Crop sowed successfully!')
    }).catch(err => {
      console.error(err)
      alert('Failed to sow crop: ' + (err.response?.data?.error || err.message))
    })
  }

  const closeSowModal = () => {
    setShowSowModal(false)
    setSelectedBed(null)
    setFormData({
      variety_id: '',
      sowing_date: new Date().toISOString().slice(0, 10),
      expected_harvest_date: '',
      quantity_sowed: '',
      notes: ''
    })
  }

  // Auto-calculate expected harvest date when variety or sowing date changes
  useEffect(() => {
    if (formData.variety_id && formData.sowing_date) {
      const variety = varieties.find(v => v.id === parseInt(formData.variety_id))
      if (variety && variety.days_to_harvest) {
        const sowDate = new Date(formData.sowing_date)
        const harvestDate = new Date(sowDate)
        harvestDate.setDate(harvestDate.getDate() + variety.days_to_harvest)
        setFormData(prev => ({
          ...prev,
          expected_harvest_date: harvestDate.toISOString().slice(0, 10)
        }))
      }
    }
  }, [formData.variety_id, formData.sowing_date, varieties])

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
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Greenhouses & Raised Beds</h2>

      {/* Greenhouse Selection */}
      <div className="flex flex-wrap gap-2 sm:gap-4">
        {greenhouses.map((gh) => (
          <button
            key={gh.id}
            onClick={() => loadGreenhouseDetails(gh.id)}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base flex-1 sm:flex-none min-w-[120px] ${
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
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">{selectedGH.name} - {selectedGH.description}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Each bed is 8×4 ft (32 sq ft)</p>

          {/* Mobile: Tabs for Left/Right, Desktop: Side by side */}
          <div className="block lg:hidden mb-4">
            <div className="flex gap-2 mb-4">
              <button 
                className="flex-1 px-4 py-2 rounded bg-green-600 text-white font-semibold"
                onClick={() => {/* Show left beds */}}
              >
                Left (L1-L10)
              </button>
              <button 
                className="flex-1 px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                onClick={() => {/* Show right beds */}}
              >
                Right (R1-R10)
              </button>
            </div>
          </div>

          <div className="lg:flex gap-4 lg:gap-8 justify-center">
            {/* Left Column */}
            <div className="space-y-2 mb-6 lg:mb-0">
              <h4 className="text-center font-semibold text-gray-700 mb-3 text-sm sm:text-base">Left Side (L1-L10)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {leftBeds.map((bed) => (
                  <div
                    key={bed.id}
                    onClick={() => handleBedClick(bed)}
                    className={`border-2 rounded p-2 sm:p-3 w-full lg:w-48 ${getBedColor(bed)} hover:shadow-md transition-shadow cursor-pointer`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm sm:text-base">{bed.bed_name}</span>
                      <span className="text-xs px-2 py-1 rounded bg-white">
                        {getBedStatus(bed)}
                      </span>
                    </div>
                    {/* Show all crops for this bed */}
                    {Array.isArray(bed.crops) && bed.crops.length > 0 ? (
                      <div className="mt-2 text-xs sm:text-sm">
                        {bed.crops.map((crop) => (
                          <div key={crop.id} className="mb-1">
                            <p className="font-medium text-green-700 truncate">{crop.variety_name}</p>
                            <p className="text-xs text-gray-600 truncate">{crop.status} (Sowed: {crop.sowing_date})</p>
                          </div>
                        ))}
                      </div>
                    ) : bed.variety_name ? (
                      <div className="mt-2 text-xs sm:text-sm">
                        <p className="font-medium text-green-700 truncate">{bed.variety_name}</p>
                        <p className="text-xs text-gray-600 truncate">{bed.crop_status}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Center Aisle - Hidden on mobile */}
            <div className="hidden lg:flex items-center">
              <div className="w-16 text-center text-gray-400">
                <div className="writing-mode-vertical">↕ Aisle ↕</div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              <h4 className="text-center font-semibold text-gray-700 mb-3 text-sm sm:text-base">Right Side (R1-R10)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {rightBeds.map((bed) => (
                  <div
                    key={bed.id}
                    onClick={() => handleBedClick(bed)}
                    className={`border-2 rounded p-2 sm:p-3 w-full lg:w-48 ${getBedColor(bed)} hover:shadow-md transition-shadow cursor-pointer`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm sm:text-base">{bed.bed_name}</span>
                      <span className="text-xs px-2 py-1 rounded bg-white">
                        {getBedStatus(bed)}
                      </span>
                    </div>
                    {/* Show all crops for this bed */}
                    {Array.isArray(bed.crops) && bed.crops.length > 0 ? (
                      <div className="mt-2 text-xs sm:text-sm">
                        {bed.crops.map((crop) => (
                          <div key={crop.id} className="mb-1">
                            <p className="font-medium text-green-700 truncate">{crop.variety_name}</p>
                            <p className="text-xs text-gray-600 truncate">{crop.status} (Sowed: {crop.sowing_date})</p>
                          </div>
                        ))}
                      </div>
                    ) : bed.variety_name ? (
                      <div className="mt-2 text-xs sm:text-sm">
                        <p className="font-medium text-green-700 truncate">{bed.variety_name}</p>
                        <p className="text-xs text-gray-600 truncate">{bed.crop_status}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4 sm:mt-6 text-xs sm:text-sm">
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

      {/* Sow Crop Modal */}
      {showSowModal && selectedBed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold">
                Sow Crop in {selectedGH.name} - {selectedBed.bed_name}
              </h3>
              <button 
                onClick={closeSowModal}
                className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSowCrop} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Variety *
                </label>
                <select
                  value={formData.variety_id}
                  onChange={(e) => setFormData({ ...formData, variety_id: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Variety</option>
                  {varieties.map(variety => (
                    <option key={variety.id} value={variety.id}>
                      {variety.name} ({variety.days_to_harvest} days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Sowing Date *
                  </label>
                  <input
                    type="date"
                    value={formData.sowing_date}
                    onChange={(e) => setFormData({ ...formData, sowing_date: e.target.value })}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Expected Harvest
                  </label>
                  <input
                    type="date"
                    value={formData.expected_harvest_date}
                    onChange={(e) => setFormData({ ...formData, expected_harvest_date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">Harvest date auto-calculated based on variety</p>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Quantity Sowed
                </label>
                <input
                  type="text"
                  value={formData.quantity_sowed}
                  onChange={(e) => setFormData({ ...formData, quantity_sowed: e.target.value })}
                  placeholder="e.g., 500g seeds"
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
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Show existing crops in this bed */}
              {Array.isArray(selectedBed.crops) && selectedBed.crops.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 sm:p-3">
                  <p className="text-xs sm:text-sm font-medium text-yellow-800 mb-2">⚠️ Existing crops in this bed:</p>
                  {selectedBed.crops.map(crop => (
                    <div key={crop.id} className="text-xs text-yellow-700">
                      • {crop.variety_name} ({crop.status})
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSowModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Sow Crop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
