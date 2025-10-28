import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

export default function Crops() {
  const [crops, setCrops] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [allCrops, setAllCrops] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingCrop, setEditingCrop] = useState(null)
  const [showVarietyModal, setShowVarietyModal] = useState(false)
  const [showHarvestModal, setShowHarvestModal] = useState(false)
  const [selectedCropForHarvest, setSelectedCropForHarvest] = useState(null)
  const [harvestRecords, setHarvestRecords] = useState([])
  const [harvestFormData, setHarvestFormData] = useState({
    harvest_date: new Date().toISOString().slice(0, 10),
    quantity_harvested: '',
    unit: 'bunches',
    notes: ''
  })
  const [greenhouses, setGreenhouses] = useState([])
  const [availableBeds, setAvailableBeds] = useState([])
  const [varieties, setVarieties] = useState([])
  const [newVariety, setNewVariety] = useState({ name: '', days_to_harvest: '' })
  const [formData, setFormData] = useState({
    greenhouse_id: '',
    raised_bed_id: '',
    variety_id: '',
    sowing_date: new Date().toISOString().slice(0, 10),
    expected_harvest_date: '',
    quantity_sowed: '',
    notes: ''
  })

  useEffect(() => {
    loadCrops()
    loadVarieties()
    loadGreenhouses()
  }, [filter])

  const loadGreenhouses = () => {
    axios.get('/api/greenhouses').then(res => {
      setGreenhouses(res.data)
    }).catch(console.error)
  }

  const loadAvailableBeds = (greenhouseId) => {
    axios.get(`/api/greenhouses/${greenhouseId}`).then(res => {
      setAvailableBeds(res.data.beds)
    }).catch(console.error)
  }

  const loadVarieties = () => {
    axios.get('/api/customers/varieties').then(res => {
      setVarieties(res.data)
    }).catch(console.error)
  }

  const loadCrops = () => {
    // Always load all crops; filter client-side to support derived statuses like "ready"
    axios.get('/api/crops').then(res => {
      setAllCrops(res.data)
      setLoading(false)
    }).catch(console.error)
  }

  const loadHarvestRecords = (cropId) => {
    axios.get(`/api/harvests/crop/${cropId}`).then(res => {
      setHarvestRecords(res.data)
    }).catch(err => {
      console.error(err)
      alert('Failed to load harvest records: ' + (err.response?.data?.error || err.message))
    })
  }

  const openHarvestModal = (crop) => {
    setSelectedCropForHarvest(crop)
    loadHarvestRecords(crop.id)
    setShowHarvestModal(true)
  }

  const closeHarvestModal = () => {
    setShowHarvestModal(false)
    setSelectedCropForHarvest(null)
    setHarvestRecords([])
    setHarvestFormData({
      harvest_date: new Date().toISOString().slice(0, 10),
      quantity_harvested: '',
      unit: 'bunches',
      notes: ''
    })
  }

  const handleAddHarvest = (e) => {
    e.preventDefault()
    const payload = {
      crop_id: selectedCropForHarvest.id,
      ...harvestFormData
    }
    axios.post('/api/harvests', payload).then(() => {
      loadHarvestRecords(selectedCropForHarvest.id)
      setHarvestFormData({
        harvest_date: new Date().toISOString().slice(0, 10),
        quantity_harvested: '',
        unit: 'bunches',
        notes: ''
      })
    }).catch(err => {
      console.error(err)
      alert('Failed to add harvest record: ' + (err.response?.data?.error || err.message))
    })
  }

  const handleDeleteHarvest = (harvestId) => {
    if (confirm('Are you sure you want to delete this harvest record?')) {
      axios.delete(`/api/harvests/${harvestId}`).then(() => {
        loadHarvestRecords(selectedCropForHarvest.id)
      }).catch(err => {
        console.error(err)
        alert('Failed to delete harvest record: ' + (err.response?.data?.error || err.message))
      })
    }
  }

  const handleMarkHarvestComplete = () => {
    if (harvestRecords.length === 0) {
      alert('Please add at least one harvest record before marking the crop as complete.')
      return
    }
    
    if (confirm('Mark this crop harvest as complete? This will update the crop status to "harvested".')) {
      const totalHarvested = harvestRecords.reduce((sum, r) => sum + parseFloat(r.quantity_harvested || 0), 0)
      const lastHarvestDate = harvestRecords[0]?.harvest_date // Already sorted DESC
      
      axios.patch(`/api/crops/${selectedCropForHarvest.id}`, {
        status: 'harvested',
        actual_harvest_date: lastHarvestDate,
        quantity_harvested: totalHarvested
      }).then(() => {
        loadCrops()
        closeHarvestModal()
        alert('Crop marked as harvested successfully!')
      }).catch(err => {
        console.error(err)
        alert('Failed to mark crop as harvested: ' + (err.response?.data?.error || err.message))
      })
    }
  }

  // Derived filtering to support 'ready' (expected harvest due) and server statuses
  useEffect(() => {
    if (!loading) {
      const today = new Date().toISOString().slice(0,10)
      let next = allCrops
      
      // Apply search filter by variety name
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        next = next.filter(c => c.variety_name && c.variety_name.toLowerCase().includes(query))
      }
      
      // Apply status filter
      if (filter === 'growing' || filter === 'harvested' || filter === 'sold') {
        next = allCrops.filter(c => c.status === filter)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          next = next.filter(c => c.variety_name && c.variety_name.toLowerCase().includes(query))
        }
      } else if (filter === 'ready') {
        // Ready: still growing but expected harvest date is today or earlier
        next = allCrops.filter(c => c.status === 'growing' && c.expected_harvest_date && c.expected_harvest_date <= today)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          next = next.filter(c => c.variety_name && c.variety_name.toLowerCase().includes(query))
        }
      }
      setCrops(next)
    }
  }, [filter, allCrops, loading, searchQuery])

  const getStatusColor = (status) => {
    switch(status) {
      case 'growing': return 'bg-green-100 text-green-700'
      case 'ready': return 'bg-blue-100 text-blue-700'
      case 'harvested': return 'bg-purple-100 text-purple-700'
      case 'sold': return 'bg-gray-100 text-gray-700'
      default: return 'bg-yellow-100 text-yellow-700'
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      // Auto-calculate expected harvest date when variety OR sowing date changes
      if ((name === 'variety_id' || name === 'sowing_date') && updated.variety_id && updated.sowing_date) {
        const variety = varieties.find(v => v.id === parseInt(updated.variety_id))
        if (variety) {
          const sowDate = new Date(updated.sowing_date)
          sowDate.setDate(sowDate.getDate() + variety.days_to_harvest)
          updated.expected_harvest_date = sowDate.toISOString().slice(0, 10)
        }
      }
      
      return updated
    })
    
    if (name === 'greenhouse_id') {
      loadAvailableBeds(value)
      setFormData(prev => ({ ...prev, raised_bed_id: '' }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const apiCall = editingCrop 
      ? axios.patch(`/api/crops/${editingCrop.id}`, formData)
      : axios.post('/api/crops', formData)

    apiCall.then(() => {
      setShowModal(false)
      setEditingCrop(null)
      loadCrops()
      setFormData({
        greenhouse_id: '',
        raised_bed_id: '',
        variety_id: '',
        sowing_date: new Date().toISOString().slice(0, 10),
        expected_harvest_date: '',
        quantity_sowed: '',
        notes: ''
      })
      setAvailableBeds([])
    }).catch(err => {
      console.error(err)
      alert('Failed to save crop: ' + (err.response?.data?.error || err.message))
    })
  }

  const handleEdit = (crop) => {
    setEditingCrop(crop)
    // Load the greenhouse to get available beds
    if (crop.greenhouse_id) {
      loadAvailableBeds(crop.greenhouse_id)
    }
    setFormData({
      greenhouse_id: crop.greenhouse_id || '',
      raised_bed_id: crop.raised_bed_id || '',
      variety_id: crop.variety_id || '',
      sowing_date: crop.sowing_date || '',
      expected_harvest_date: crop.expected_harvest_date || '',
      quantity_sowed: crop.quantity_sowed || '',
      notes: crop.notes || '',
      status: crop.status,
      actual_harvest_date: crop.actual_harvest_date || '',
      quantity_harvested: crop.quantity_harvested || ''
    })
    setShowModal(true)
  }

  const handleDelete = (cropId) => {
    if (confirm('Are you sure you want to delete this crop?')) {
      axios.delete(`/api/crops/${cropId}`).then(() => {
        loadCrops()
      }).catch(err => {
        console.error(err)
        alert('Failed to delete crop: ' + (err.response?.data?.error || err.message))
      })
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCrop(null)
    setFormData({
      greenhouse_id: '',
      raised_bed_id: '',
      variety_id: '',
      sowing_date: new Date().toISOString().slice(0, 10),
      expected_harvest_date: '',
      quantity_sowed: '',
      notes: ''
    })
    setAvailableBeds([])
  }

  const handleAddVariety = (e) => {
    e.preventDefault()
    axios.post('/api/customers/varieties', newVariety).then(() => {
      loadVarieties()
      setNewVariety({ name: '', days_to_harvest: '' })
      setShowVarietyModal(false)
    }).catch(err => {
      console.error(err)
      alert('Failed to add variety: ' + (err.response?.data?.error || err.message))
    })
  }

  const handleDeleteVariety = (id) => {
    if (confirm('Are you sure you want to delete this variety?')) {
      axios.delete(`/api/customers/varieties/${id}`).then(() => {
        loadVarieties()
      }).catch(err => {
        console.error(err)
        alert('Failed to delete variety: ' + (err.response?.data?.error || err.message))
      })
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Spinach Crops</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowVarietyModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            🌾 Manage Varieties
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            + Sow New Crop
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3">
          <label htmlFor="crop-search" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            🔍 Search by Variety:
          </label>
          <input
            id="crop-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., Methi, All Green, Palak..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
        {searchQuery && crops.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Found {crops.length} crop{crops.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </p>
        )}
        {searchQuery && crops.length === 0 && (
          <p className="text-sm text-red-600 mt-2">
            No crops found matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b">
        {['all', 'growing', 'ready', 'harvested'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              filter === f
                ? 'border-green-600 text-green-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crops.map((crop) => (
          <div key={crop.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-semibold text-green-700">{crop.variety_name}</h3>
                <p className="text-sm text-gray-600">{crop.greenhouse_name} - {crop.bed_name} ({crop.side})</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(crop.status)}`}>
                {crop.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Sowed:</span>
                <span className="font-medium">{crop.sowing_date}</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Harvest:</span>
                <span className="font-medium">{crop.expected_harvest_date || 'N/A'}</span>
              </div>
              {crop.actual_harvest_date && (
                <div className="flex justify-between">
                  <span>Harvested:</span>
                  <span className="font-medium">{crop.actual_harvest_date}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Quantity Sowed:</span>
                <span className="font-medium">{crop.quantity_sowed}</span>
              </div>
              {crop.quantity_harvested && (
                <div className="flex justify-between">
                  <span>Harvested:</span>
                  <span className="font-medium">{crop.quantity_harvested}</span>
                </div>
              )}
            </div>

            {crop.notes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-600">{crop.notes}</p>
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-3 border-t">
              <button
                onClick={() => openHarvestModal(crop)}
                className="flex-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 text-sm font-medium"
              >
                🌾 Harvests
              </button>
              <button
                onClick={() => handleEdit(crop)}
                className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(crop.id)}
                className="flex-1 px-3 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {crops.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No crops found for the selected filter.
        </div>
      )}

      {/* Sow New Crop Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editingCrop ? 'Update Crop Status' : 'Sow New Crop'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {editingCrop ? (
                // Edit Mode - Show all fields
                <>
                  <div className="bg-blue-50 p-3 rounded-lg mb-2">
                    <p className="text-sm font-semibold text-blue-900">Editing Crop</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Greenhouse *
                    </label>
                    <select
                      name="greenhouse_id"
                      value={formData.greenhouse_id}
                      onChange={handleFormChange}
                      required
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select Greenhouse</option>
                      {greenhouses.map(gh => (
                        <option key={gh.id} value={gh.id}>{gh.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Raised Bed *
                    </label>
                    <select
                      name="raised_bed_id"
                      value={formData.raised_bed_id}
                      onChange={handleFormChange}
                      required
                      disabled={!formData.greenhouse_id}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                    >
                      <option value="">Select Bed</option>
                      {availableBeds.map(bed => (
                        <option key={bed.id} value={bed.id}>
                          {bed.bed_name} ({bed.side}) {bed.crop_id ? '- Currently: ' + bed.variety_name : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spinach Variety *
                    </label>
                    <select
                      name="variety_id"
                      value={formData.variety_id}
                      onChange={handleFormChange}
                      required
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select Variety</option>
                      {varieties.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.days_to_harvest} days)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sowing Date *
                    </label>
                    <input
                      type="date"
                      name="sowing_date"
                      value={formData.sowing_date}
                      onChange={handleFormChange}
                      required
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Harvest Date
                    </label>
                    <input
                      type="date"
                      name="expected_harvest_date"
                      value={formData.expected_harvest_date}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Sowed *
                    </label>
                    <input
                      type="text"
                      name="quantity_sowed"
                      value={formData.quantity_sowed}
                      onChange={handleFormChange}
                      required
                      placeholder="e.g., 500 seeds, 2 kg"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleFormChange}
                      rows={2}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Any additional notes..."
                    />
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Harvest Information</p>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="growing">Growing</option>
                        <option value="harvested">Harvested</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Harvest Date
                    </label>
                    <input
                      type="date"
                      name="actual_harvest_date"
                      value={formData.actual_harvest_date}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Harvested
                    </label>
                    <input
                      type="text"
                      name="quantity_harvested"
                      value={formData.quantity_harvested}
                      onChange={handleFormChange}
                      placeholder="e.g., 25 kg"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  </div>
                </>
              ) : (
                // Create Mode - Show all fields
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Greenhouse *
                    </label>
                <select
                  name="greenhouse_id"
                  value={formData.greenhouse_id}
                  onChange={handleFormChange}
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Greenhouse</option>
                  {greenhouses.map(gh => (
                    <option key={gh.id} value={gh.id}>{gh.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raised Bed *
                </label>
                <select
                  name="raised_bed_id"
                  value={formData.raised_bed_id}
                  onChange={handleFormChange}
                  required
                  disabled={!formData.greenhouse_id}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                >
                  <option value="">Select Bed</option>
                  {availableBeds.map(bed => (
                    <option key={bed.id} value={bed.id}>
                      {bed.bed_name} ({bed.side})
                    </option>
                  ))}
                </select>
                {formData.greenhouse_id && availableBeds.length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">No beds found in this greenhouse</p>
                )}
                {/* Show crops already present in the selected bed */}
                {formData.raised_bed_id && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-semibold">Existing crops in this bed:</span>
                    <ul className="list-disc ml-4">
                      {allCrops.filter(c => c.raised_bed_id == formData.raised_bed_id && c.status === 'growing').map(crop => (
                        <li key={crop.id}>{crop.variety_name} (Sowed: {crop.sowing_date})</li>
                      ))}
                      {allCrops.filter(c => c.raised_bed_id == formData.raised_bed_id && c.status === 'growing').length === 0 && (
                        <li className="text-gray-400">No active crops</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spinach Variety *
                </label>
                <select
                  name="variety_id"
                  value={formData.variety_id}
                  onChange={handleFormChange}
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Variety</option>
                  {varieties.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.days_to_harvest} days)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sowing Date *
                </label>
                <input
                  type="date"
                  name="sowing_date"
                  value={formData.sowing_date}
                  onChange={handleFormChange}
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Harvest Date
                </label>
                <input
                  type="date"
                  name="expected_harvest_date"
                  value={formData.expected_harvest_date}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Sowed *
                </label>
                <input
                  type="text"
                  name="quantity_sowed"
                  value={formData.quantity_sowed}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., 500 seeds, 2 kg"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Any additional notes..."
                />
              </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingCrop ? 'Update Crop' : 'Sow Crop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Varieties Modal */}
      {showVarietyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Manage Spinach Varieties</h3>
              <button 
                onClick={() => setShowVarietyModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Add New Variety Form */}
            <form onSubmit={handleAddVariety} className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-3">Add New Variety</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variety Name *
                  </label>
                  <input
                    type="text"
                    value={newVariety.name}
                    onChange={(e) => setNewVariety({ ...newVariety, name: e.target.value })}
                    required
                    placeholder="e.g., Baby Spinach"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Days to Harvest *
                  </label>
                  <input
                    type="number"
                    value={newVariety.days_to_harvest}
                    onChange={(e) => setNewVariety({ ...newVariety, days_to_harvest: e.target.value })}
                    required
                    min="1"
                    placeholder="e.g., 30"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Add Variety
              </button>
            </form>

            {/* Existing Varieties List */}
            <div>
              <h4 className="font-semibold mb-3">Existing Varieties</h4>
              <div className="space-y-2">
                {varieties.map((variety) => (
                  <div key={variety.id} className="flex justify-between items-center bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-medium text-green-700">{variety.name}</p>
                      <p className="text-sm text-gray-600">{variety.days_to_harvest} days to harvest</p>
                    </div>
                    <button
                      onClick={() => handleDeleteVariety(variety.id)}
                      className="px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
              {varieties.length === 0 && (
                <p className="text-center text-gray-500 py-4">No varieties added yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Harvest Records Modal */}
      {showHarvestModal && selectedCropForHarvest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">Harvest Records</h3>
                <p className="text-sm text-gray-600">
                  {selectedCropForHarvest.variety_name} - {selectedCropForHarvest.greenhouse_name} {selectedCropForHarvest.bed_name}
                </p>
              </div>
              <button 
                onClick={closeHarvestModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Add New Harvest Form */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-3">Log New Harvest</h4>
              <form onSubmit={handleAddHarvest} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harvest Date *
                    </label>
                    <input
                      type="date"
                      value={harvestFormData.harvest_date}
                      onChange={(e) => setHarvestFormData({ ...harvestFormData, harvest_date: e.target.value })}
                      required
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Harvested *
                    </label>
                    <input
                      type="number"
                      value={harvestFormData.quantity_harvested}
                      onChange={(e) => setHarvestFormData({ ...harvestFormData, quantity_harvested: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      placeholder="e.g., 5"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select
                      value={harvestFormData.unit}
                      onChange={(e) => setHarvestFormData({ ...harvestFormData, unit: e.target.value })}
                      required
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    >
                      <option value="bunches">Bunches</option>
                      <option value="grams">Grams</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="pieces">Pieces</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={harvestFormData.notes}
                      onChange={(e) => setHarvestFormData({ ...harvestFormData, notes: e.target.value })}
                      placeholder="Optional notes"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  + Add Harvest Record
                </button>
              </form>
            </div>

            {/* Harvest Records List */}
            <div>
              <h4 className="font-semibold mb-3">Harvest History ({harvestRecords.length} records)</h4>
              {harvestRecords.length === 0 ? (
                <p className="text-center text-gray-500 py-6">No harvest records yet. Log your first harvest above!</p>
              ) : (
                <div className="space-y-2">
                  {harvestRecords.map((record) => (
                    <div key={record.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-green-700">
                              {record.quantity_harvested} {record.unit}
                            </span>
                            <span className="text-sm text-gray-600">
                              📅 {record.harvest_date}
                            </span>
                          </div>
                          {record.notes && (
                            <p className="text-sm text-gray-600">📝 {record.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteHarvest(record.id)}
                          className="px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {harvestRecords.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="bg-green-100 rounded-lg p-3">
                    <p className="font-semibold text-green-900 mb-2">Total Harvested:</p>
                    <div className="space-y-1">
                      {(() => {
                        // Group by unit
                        const byUnit = {}
                        harvestRecords.forEach(r => {
                          const unit = r.unit || 'bunches'
                          if (!byUnit[unit]) byUnit[unit] = 0
                          byUnit[unit] += parseFloat(r.quantity_harvested || 0)
                        })
                        return Object.entries(byUnit).map(([unit, total]) => (
                          <div key={unit} className="text-lg font-bold text-green-700">
                            {unit === 'grams' ? total.toFixed(0) : total.toFixed(1)} {unit}
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                  
                  {selectedCropForHarvest.status !== 'harvested' && (
                    <button
                      onClick={handleMarkHarvestComplete}
                      className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 font-semibold"
                    >
                      ✅ Mark Harvest Complete
                    </button>
                  )}
                  
                  {selectedCropForHarvest.status === 'harvested' && (
                    <div className="bg-purple-100 text-purple-800 rounded-lg p-3 text-center font-semibold">
                      ✅ Crop harvest marked as complete
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
