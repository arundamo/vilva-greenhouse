import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function CropDemand() {
  const [demand, setDemand] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: ''
  })

  useEffect(() => {
    fetchDemand()
  }, [])

  const fetchDemand = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.status) params.append('status', filters.status)

    axios.get(`/api/sales/crop-demand?${params}`)
      .then(res => setDemand(res.data))
      .catch(err => {
        console.error(err)
        alert('Failed to load crop demand: ' + (err.response?.data?.error || err.message))
      })
      .finally(() => setLoading(false))
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    fetchDemand()
  }

  const resetFilters = () => {
    setFilters({ start_date: '', end_date: '', status: '' })
    setTimeout(() => fetchDemand(), 0)
  }

  // Group by variety for cleaner display
  const grouped = demand.reduce((acc, item) => {
    if (!acc[item.variety_name]) {
      acc[item.variety_name] = []
    }
    acc[item.variety_name].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-white">Crop Demand Report</h2>
          <p className="text-sm text-lime-200 mt-1">Quantities needed from pending orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Order Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Pending (default)</option>
              <option value="pending">Pending Only</option>
              <option value="packed">Packed Only</option>
              <option value="unconfirmed">Unconfirmed Only</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700"
            >
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-zinc-800 text-lime-100 border border-lime-700/40 rounded text-sm hover:bg-zinc-700"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-lime-200/70">Loading...</div>
        ) : demand.length === 0 ? (
          <div className="p-8 text-center text-lime-200/70">
            No pending orders found for the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-lime-100">
              <thead className="bg-zinc-900/90 text-lime-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Crop Variety</th>
                  <th className="text-left px-4 py-3 font-semibold">Unit</th>
                  <th className="text-right px-4 py-3 font-semibold">Total Quantity</th>
                  <th className="text-right px-4 py-3 font-semibold">Order Count</th>
                  <th className="text-left px-4 py-3 font-semibold">Customers</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([variety, items]) => (
                  <React.Fragment key={variety}>
                    {items.map((item, idx) => (
                      <tr
                        key={`${variety}-${item.unit}`}
                        className={`border-t border-lime-700/30 hover:bg-lime-500/5 ${idx === 0 ? 'font-medium' : ''}`}
                      >
                        {idx === 0 && (
                          <td className="px-4 py-3 font-semibold text-lime-100" rowSpan={items.length}>
                            {variety}
                          </td>
                        )}
                        <td className="px-4 py-3 text-lime-100/90">{item.unit}</td>
                        <td className="px-4 py-3 text-right font-semibold text-lime-300">
                          {item.total_quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-lime-100/90">{item.order_count}</td>
                        <td className="px-4 py-3 text-lime-100/90 max-w-xs truncate" title={item.customers}>
                          {item.customers || '-'}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && demand.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">📊 Summary</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-700 font-medium">Total Varieties:</span>{' '}
              <span className="text-green-900 font-semibold">{Object.keys(grouped).length}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Total Line Items:</span>{' '}
              <span className="text-green-900 font-semibold">{demand.length}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Total Orders:</span>{' '}
              <span className="text-green-900 font-semibold">
                {demand.reduce((sum, d) => sum + d.order_count, 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Guide */}
      <div className="bg-zinc-900/75 border border-lime-700/35 rounded-lg p-4 text-sm text-lime-100/90">
        <strong>ℹ️ How to use:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>By default, shows all <strong>pending</strong>, <strong>packed</strong>, and <strong>unconfirmed</strong> orders</li>
          <li>Use filters to narrow by delivery date range or order status</li>
          <li>Quantities are grouped by crop variety and unit (bunches, kg, grams)</li>
          <li>Use this report to plan harvesting and packing for upcoming deliveries</li>
        </ul>
      </div>
    </div>
  )
}
