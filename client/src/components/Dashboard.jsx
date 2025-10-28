import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Dashboard() {
  const [stats, setStats] = useState({ greenhouses: 3, crops: 0, activeCrops: 0, pendingOrders: 0 })
  const [recentActivities, setRecentActivities] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [cropReports, setCropReports] = useState([])
  const [customerReports, setCustomerReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/crops'),
      axios.get('/api/activities'),
      axios.get('/api/sales?status=pending'),
      axios.get('/api/sales'), // Get all sales for reporting
    ]).then(async ([crops, activities, pendingSales, allSales]) => {
      const activeCrops = crops.data.filter(c => c.status === 'growing' || c.status === 'ready').length;
      setStats({
        greenhouses: 3,
        crops: crops.data.length,
        activeCrops,
        pendingOrders: pendingSales.data.length,
      })
      setRecentActivities(activities.data.slice(0, 5))
      setRecentSales(pendingSales.data.slice(0, 5))
      
      // Fetch harvest records for all crops
      const harvestPromises = crops.data.map(crop => 
        axios.get(`/api/harvests/crop/${crop.id}`).catch(() => ({ data: [] }))
      )
      const harvestResults = await Promise.all(harvestPromises)
      
      // Map harvest records to crops
      const cropsWithHarvests = crops.data.map((crop, index) => ({
        ...crop,
        harvestRecords: harvestResults[index].data
      }))
      
      // Generate crop reports with sales data
      generateCropReports(cropsWithHarvests, allSales.data)
      
      // Generate customer reports
      generateCustomerReports(allSales.data)
      
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const generateCropReports = (crops, salesOrders) => {
    // Group crops by variety
    const varietyMap = {}
    crops.forEach(crop => {
      if (!varietyMap[crop.variety_name]) {
        varietyMap[crop.variety_name] = {
          variety: crop.variety_name,
          timesSowed: 0,
          timesHarvested: 0,
          timesSold: 0,
          growing: 0,
          totalQuantitySowed: 0,
          totalHarvestCount: 0,
          harvestByUnit: {} // Track harvests by unit (bunches, grams, kg, etc.)
        }
      }
      
      const report = varietyMap[crop.variety_name]
      report.timesSowed++
      
      if (crop.status === 'harvested') report.timesHarvested++
      if (crop.status === 'sold') report.timesSold++
      if (crop.status === 'growing') report.growing++
      
      // Try to parse quantity (handle different formats like "500g", "2 kg", etc)
      const sowedQty = parseFloat(crop.quantity_sowed)
      if (!isNaN(sowedQty)) report.totalQuantitySowed += sowedQty
      
      // Count and sum harvest records by unit (even for crops still growing)
      if (crop.harvestRecords && crop.harvestRecords.length > 0) {
        report.totalHarvestCount += crop.harvestRecords.length
        crop.harvestRecords.forEach(harvest => {
          const harvestedQty = parseFloat(harvest.quantity_harvested)
          const unit = harvest.unit || 'bunches'
          if (!isNaN(harvestedQty)) {
            if (!report.harvestByUnit[unit]) {
              report.harvestByUnit[unit] = 0
            }
            report.harvestByUnit[unit] += harvestedQty
          }
        })
      } else if (crop.quantity_harvested) {
        // Fallback to old single harvest field if no records
        const harvestedQty = parseFloat(crop.quantity_harvested)
        const unit = 'bunches' // Default for old records
        if (!isNaN(harvestedQty)) {
          if (!report.harvestByUnit[unit]) {
            report.harvestByUnit[unit] = 0
          }
          report.harvestByUnit[unit] += harvestedQty
        }
      }
    })

    // Count sales by variety from sales_orders (multi-item)
    if (salesOrders && salesOrders.length > 0) {
      salesOrders.forEach(sale => {
        if (sale.items && sale.items.length > 0) {
          sale.items.forEach(item => {
            const vName = item.variety_name
            if (varietyMap[vName]) {
              varietyMap[vName].timesSold++
            }
          })
        }
      })
    }
    
    // Convert to array and sort by times sowed
    const reports = Object.values(varietyMap).sort((a, b) => b.timesSowed - a.timesSowed)
    setCropReports(reports)
  }

  const generateCustomerReports = (salesOrders) => {
    // Group sales by customer
    const customerMap = {}
    
  salesOrders.forEach(sale => {
      if (!customerMap[sale.customer_id]) {
        customerMap[sale.customer_id] = {
          customer_id: sale.customer_id,
          customer_name: sale.customer_name,
          phone: sale.phone,
          whatsapp: sale.whatsapp,
          totalOrders: 0,
          totalAmount: 0,
          varietiesPurchased: {},
          lastOrderDate: null,
          preferredVariety: null
        }
      }
      
      const report = customerMap[sale.customer_id]
      report.totalOrders++
      report.totalAmount += parseFloat(sale.total_amount || 0)
      
      // Track varieties purchased from order items
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach(item => {
          const vName = item.variety_name
          if (!report.varietiesPurchased[vName]) {
            report.varietiesPurchased[vName] = {
              count: 0,
              totalQuantity: 0,
              unit: item.unit
            }
          }
          const v = report.varietiesPurchased[vName]
          v.count++
          v.totalQuantity += parseFloat(item.quantity || 0)
          if (v.unit && v.unit !== item.unit) {
            v.unit = 'mixed'
          }
        })
      }
      
      // Track last order date
      if (!report.lastOrderDate || sale.order_date > report.lastOrderDate) {
        report.lastOrderDate = sale.order_date
      }
    })
    
    // Determine preferred variety (most purchased)
    Object.values(customerMap).forEach(customer => {
      let maxCount = 0
      Object.entries(customer.varietiesPurchased).forEach(([variety, data]) => {
        if (data.count > maxCount) {
          maxCount = data.count
          customer.preferredVariety = variety
        }
      })
    })
    
    // Convert to array and sort by total orders
    const reports = Object.values(customerMap).sort((a, b) => b.totalOrders - a.totalOrders)
    setCustomerReports(reports)
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Vilva Greenhouse Farm Dashboard</h2>
        <p className="text-gray-600">Farm management and tracking system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Greenhouses</p>
              <p className="text-3xl font-bold text-green-600">{stats.greenhouses}</p>
              <p className="text-xs text-gray-500">G1, G2, G3</p>
            </div>
            <span className="text-4xl">🏡</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Crops</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeCrops}</p>
              <p className="text-xs text-gray-500">Growing now</p>
            </div>
            <span className="text-4xl">🌱</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Crops</p>
              <p className="text-3xl font-bold text-blue-600">{stats.crops}</p>
              <p className="text-xs text-gray-500">All time</p>
            </div>
            <span className="text-4xl">📊</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Orders</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
              <p className="text-xs text-gray-500">To deliver</p>
            </div>
            <span className="text-4xl">💰</span>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Recent Activities</h3>
        {recentActivities.length === 0 ? (
          <p className="text-gray-500">No recent activities</p>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                <div>
                  <p className="font-medium">{activity.activity_type.replace('_', ' ')} - {activity.greenhouse_name} / {activity.bed_name}</p>
                  <p className="text-sm text-gray-500">
                    {activity.variety_name} • {activity.activity_date}
                    {activity.description && ` • ${activity.description}`}
                  </p>
                </div>
                <span className="text-2xl">
                  {activity.activity_type === 'watering' && '💧'}
                  {activity.activity_type === 'fertilizer' && '🌾'}
                  {activity.activity_type === 'weeding' && '🪴'}
                  {activity.activity_type === 'pest_control' && '🐛'}
                  {activity.activity_type === 'inspection' && '👀'}
                  {activity.activity_type === 'other' && '📝'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Sales Orders */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Pending Sales Orders</h3>
        {recentSales.length === 0 ? (
          <p className="text-gray-500">No pending orders</p>
        ) : (
          <div className="space-y-2">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                <div>
                  <p className="font-medium">
                    {sale.customer_name} - {sale.items && sale.items.length > 1 ? 'Multiple items' : (sale.items && sale.items[0] ? sale.items[0].variety_name : 'No items')}
                  </p>
                  <p className="text-sm text-gray-500">
                    ₹{sale.total_amount} • {sale.requested_via}
                    {sale.delivery_date && ` • Delivery: ${sale.delivery_date}`}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  sale.delivery_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  sale.delivery_status === 'packed' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {sale.delivery_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crop Performance Reports */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">📊 Crop Performance Reports</h3>
        {cropReports.length === 0 ? (
          <p className="text-gray-500">No crop data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variety</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Times Sowed</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Currently Growing</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Harvests</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Harvested</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Times Sold</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cropReports.map((report, index) => {
                  // Success rate = crops completed (harvested or sold) / total sowed
                  // Note: status is mutually exclusive (either 'harvested' OR 'sold', not both)
                  const completedCrops = report.timesHarvested + report.timesSold
                  const successRate = report.timesSowed > 0 
                    ? Math.round((completedCrops / report.timesSowed) * 100)
                    : 0
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-green-700">{report.variety}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {report.timesSowed}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          {report.growing}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                          {report.totalHarvestCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1">
                          {Object.entries(report.harvestByUnit).map(([unit, qty]) => (
                            <div key={unit} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold inline-block mr-1">
                              {qty.toFixed(unit === 'grams' ? 0 : 1)} {unit}
                            </div>
                          ))}
                          {Object.keys(report.harvestByUnit).length === 0 && (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                          {report.timesSold}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Purchase Reports */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">👥 Customer Purchase Reports</h3>
        {customerReports.length === 0 ? (
          <p className="text-gray-500">No customer data available</p>
        ) : (
          <>
            {/* Grand Total Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Total Customers</p>
                <p className="text-3xl font-bold text-blue-700">{customerReports.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-green-700">
                  {customerReports.reduce((sum, c) => sum + c.totalOrders, 0)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Total Sales</p>
                <p className="text-3xl font-bold text-purple-700">
                  ₹{customerReports.reduce((sum, c) => sum + c.totalAmount, 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Variety</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Varieties Purchased</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerReports.map((customer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{customer.customer_name}</p>
                          <p className="text-xs text-gray-500">📞 {customer.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {customer.totalOrders}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          ₹{customer.totalAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                          {customer.preferredVariety}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {Object.entries(customer.varietiesPurchased).map(([variety, data]) => (
                            <div key={variety} className="text-sm">
                              <span className="font-medium text-gray-700">{variety}</span>: 
                              <span className="text-gray-600"> {data.count}× ({data.totalQuantity.toFixed(1)} {data.unit})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {customer.lastOrderDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
