import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { formatCAD } from '../utils/currency'
import { sendWhatsAppMessage, getDeliveryReminderMessage } from '../utils/whatsapp'

export default function Dashboard() {
  const [stats, setStats] = useState({ greenhouses: 3, crops: 0, activeCrops: 0, pendingOrders: 0 })
  const [recentActivities, setRecentActivities] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [cropReports, setCropReports] = useState([])
  const [customerReports, setCustomerReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  
  // Load section configuration from localStorage
  const [sectionConfig, setSectionConfig] = useState(() => {
    const saved = localStorage.getItem('dashboardSectionConfig')
    return saved ? JSON.parse(saved) : {
      sections: [
        { id: 'activities', label: 'Recent Activities', visible: true, expanded: true },
        { id: 'pendingOrders', label: 'Pending Sales Orders', visible: true, expanded: true },
        { id: 'cropReports', label: 'Crop Performance Reports', visible: true, expanded: true },
        { id: 'customerReports', label: 'Customer Purchase Reports', visible: true, expanded: true }
      ]
    }
  })

  // Save configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardSectionConfig', JSON.stringify(sectionConfig))
  }, [sectionConfig])

  const toggleSection = (sectionId) => {
    setSectionConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, expanded: !s.expanded } : s
      )
    }))
  }

  const toggleVisibility = (sectionId) => {
    setSectionConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, visible: !s.visible } : s
      )
    }))
  }

  const moveSection = (fromIndex, toIndex) => {
    setSectionConfig(prev => {
      const newSections = [...prev.sections]
      const [movedSection] = newSections.splice(fromIndex, 1)
      newSections.splice(toIndex, 0, movedSection)
      return { ...prev, sections: newSections }
    })
  }

  const resetToDefaults = () => {
    setSectionConfig({
      sections: [
        { id: 'activities', label: 'Recent Activities', visible: true, expanded: true },
        { id: 'pendingOrders', label: 'Pending Sales Orders', visible: true, expanded: true },
        { id: 'cropReports', label: 'Crop Performance Reports', visible: true, expanded: true },
        { id: 'customerReports', label: 'Customer Purchase Reports', visible: true, expanded: true }
      ]
    })
  }

  useEffect(() => {
    Promise.all([
      axios.get('/api/crops'),
      axios.get('/api/activities'),
      axios.get('/api/sales?status=pending'),
      axios.get('/api/sales'),
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
      
      const harvestPromises = crops.data.map(crop => 
        axios.get(`/api/harvests/crop/${crop.id}`).catch(() => ({ data: [] }))
      )
      const harvestResults = await Promise.all(harvestPromises)
      const cropsWithHarvests = crops.data.map((crop, index) => ({
        ...crop,
        harvestRecords: harvestResults[index].data
      }))
      
      generateCropReports(cropsWithHarvests, allSales.data)
      generateCustomerReports(allSales.data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const generateCropReports = (crops, salesOrders) => {
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
          harvestByUnit: {}
        }
      }
      
      const report = varietyMap[crop.variety_name]
      report.timesSowed++
      if (crop.status === 'harvested') report.timesHarvested++
      if (crop.status === 'sold') report.timesSold++
      if (crop.status === 'growing') report.growing++
      
      const sowedQty = parseFloat(crop.quantity_sowed)
      if (!isNaN(sowedQty)) report.totalQuantitySowed += sowedQty
      
      if (crop.harvestRecords && crop.harvestRecords.length > 0) {
        report.totalHarvestCount += crop.harvestRecords.length
        crop.harvestRecords.forEach(harvest => {
          const harvestedQty = parseFloat(harvest.quantity_harvested)
          const unit = harvest.unit || 'bunches'
          if (!isNaN(harvestedQty)) {
            if (!report.harvestByUnit[unit]) report.harvestByUnit[unit] = 0
            report.harvestByUnit[unit] += harvestedQty
          }
        })
      } else if (crop.quantity_harvested) {
        const harvestedQty = parseFloat(crop.quantity_harvested)
        const unit = 'bunches'
        if (!isNaN(harvestedQty)) {
          if (!report.harvestByUnit[unit]) report.harvestByUnit[unit] = 0
          report.harvestByUnit[unit] += harvestedQty
        }
      }
    })

    if (salesOrders && salesOrders.length > 0) {
      salesOrders.forEach(sale => {
        if (sale.items && sale.items.length > 0) {
          sale.items.forEach(item => {
            const vName = item.variety_name
            if (varietyMap[vName]) varietyMap[vName].timesSold++
          })
        }
      })
    }
    
    const reports = Object.values(varietyMap).sort((a, b) => b.timesSowed - a.timesSowed)
    setCropReports(reports)
  }

  const generateCustomerReports = (salesOrders) => {
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
          if (v.unit && v.unit !== item.unit) v.unit = 'mixed'
        })
      }
      
      if (!report.lastOrderDate || sale.order_date > report.lastOrderDate) {
        report.lastOrderDate = sale.order_date
      }
    })
    
    Object.values(customerMap).forEach(customer => {
      let maxCount = 0
      Object.entries(customer.varietiesPurchased).forEach(([variety, data]) => {
        if (data.count > maxCount) {
          maxCount = data.count
          customer.preferredVariety = variety
        }
      })
    })
    
    const reports = Object.values(customerMap).sort((a, b) => b.totalOrders - a.totalOrders)
    setCustomerReports(reports)
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  // Section Components
  const sections = {
    activities: () => (
      <div className="bg-white rounded-lg shadow">
        <button onClick={() => toggleSection('activities')} className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h3 className="text-lg sm:text-xl font-semibold">Recent Activities</h3>
          <span className="text-2xl transform transition-transform duration-200" style={{ transform: sectionConfig.sections.find(s => s.id === 'activities')?.expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
        {sectionConfig.sections.find(s => s.id === 'activities')?.expanded && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500">No recent activities</p>
            ) : (
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{activity.activity_type.replace('_', ' ')} - {activity.greenhouse_name} / {activity.bed_name}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {activity.variety_name} • {activity.activity_date}
                        {activity.description && ` • ${activity.description}`}
                      </p>
                    </div>
                    <span className="text-xl sm:text-2xl ml-2 flex-shrink-0">
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
        )}
      </div>
    ),

    pendingOrders: () => (
      <div className="bg-white rounded-lg shadow">
        <button onClick={() => toggleSection('pendingOrders')} className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h3 className="text-lg sm:text-xl font-semibold">Pending Sales Orders</h3>
          <span className="text-2xl transform transition-transform duration-200" style={{ transform: sectionConfig.sections.find(s => s.id === 'pendingOrders')?.expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
        {sectionConfig.sections.find(s => s.id === 'pendingOrders')?.expanded && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {recentSales.length === 0 ? (
              <p className="text-gray-500">No pending orders</p>
            ) : (
              <div className="space-y-2">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between gap-2 p-3 border rounded hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {sale.customer_name} - {sale.items && sale.items.length > 1 ? 'Multiple items' : (sale.items && sale.items[0] ? sale.items[0].variety_name : 'No items')}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {formatCAD(sale.total_amount)} • {sale.requested_via}
                        {sale.delivery_date && ` • Delivery: ${sale.delivery_date}`}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center flex-shrink-0">
                      {sale.phone && (
                        <button onClick={() => sendWhatsAppMessage(sale.phone, getDeliveryReminderMessage(sale))} className="px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-xs border border-green-200" title="Send WhatsApp reminder">📱</button>
                      )}
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        sale.delivery_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        sale.delivery_status === 'packed' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>{sale.delivery_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    ),

    cropReports: () => (
      <div className="bg-white rounded-lg shadow">
        <button onClick={() => toggleSection('cropReports')} className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h3 className="text-lg sm:text-xl font-semibold">📊 Crop Performance Reports</h3>
          <span className="text-2xl transform transition-transform duration-200" style={{ transform: sectionConfig.sections.find(s => s.id === 'cropReports')?.expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
        {sectionConfig.sections.find(s => s.id === 'cropReports')?.expanded && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {cropReports.length === 0 ? (
              <p className="text-gray-500">No crop data available</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variety</th>
                      <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sowed</th>
                      <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Growing</th>
                      <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Harvests</th>
                      <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Harvested</th>
                      <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sold</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cropReports.map((report, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap"><span className="font-medium text-green-700 text-sm">{report.variety}</span></td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold">{report.timesSowed}</span></td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center hidden sm:table-cell"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">{report.growing}</span></td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center hidden md:table-cell"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">{report.totalHarvestCount}</span></td>
                        <td className="px-3 sm:px-6 py-4 text-center hidden md:table-cell">
                          <div className="space-y-1">
                            {Object.entries(report.harvestByUnit).map(([unit, qty]) => (
                              <div key={unit} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs sm:text-sm font-semibold inline-block mr-1">{qty.toFixed(unit === 'grams' ? 0 : 1)} {unit}</div>
                            ))}
                            {Object.keys(report.harvestByUnit).length === 0 && <span className="text-gray-400 text-sm">—</span>}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-semibold">{report.timesSold}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    ),

    customerReports: () => (
      <div className="bg-white rounded-lg shadow">
        <button onClick={() => toggleSection('customerReports')} className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h3 className="text-lg sm:text-xl font-semibold">👥 Customer Purchase Reports</h3>
          <span className="text-2xl transform transition-transform duration-200" style={{ transform: sectionConfig.sections.find(s => s.id === 'customerReports')?.expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
        {sectionConfig.sections.find(s => s.id === 'customerReports')?.expanded && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {customerReports.length === 0 ? (
              <p className="text-gray-500">No customer data available</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg border border-blue-200">
                    <p className="text-xs sm:text-sm text-blue-600 font-medium">Total Customers</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-700">{customerReports.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-lg border border-green-200">
                    <p className="text-xs sm:text-sm text-green-600 font-medium">Total Orders</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-700">{customerReports.reduce((sum, c) => sum + c.totalOrders, 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-lg border border-purple-200">
                    <p className="text-xs sm:text-sm text-purple-600 font-medium">Total Sales</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-700">{formatCAD(customerReports.reduce((sum, c) => sum + c.totalAmount, 0))}</p>
                  </div>
                </div>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Preferred</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Varieties</th>
                        <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Last Order</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customerReports.map((customer, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{customer.customer_name}</p>
                              <p className="text-xs text-gray-500">📞 {customer.phone}</p>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold">{customer.totalOrders}</span></td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">{formatCAD(customer.totalAmount)}</span></td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center hidden md:table-cell"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm font-semibold">{customer.preferredVariety}</span></td>
                          <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                            <div className="space-y-1">
                              {Object.entries(customer.varietiesPurchased).map(([variety, data]) => (
                                <div key={variety} className="text-xs sm:text-sm">
                                  <span className="font-medium text-gray-700">{variety}</span>: <span className="text-gray-600"> {data.count}× ({data.totalQuantity.toFixed(1)} {data.unit})</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{customer.lastOrderDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Settings Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Vilva Greenhouse Farm Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-600">Farm management and tracking system</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">Customize</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">Greenhouses</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.greenhouses}</p>
              <p className="text-xs text-gray-500 hidden sm:block">G1, G2, G3</p>
            </div>
            <span className="text-3xl sm:text-4xl">🏡</span>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">Active Crops</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.activeCrops}</p>
              <p className="text-xs text-gray-500 hidden sm:block">Growing now</p>
            </div>
            <span className="text-3xl sm:text-4xl">🌱</span>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">Total Crops</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.crops}</p>
              <p className="text-xs text-gray-500 hidden sm:block">All time</p>
            </div>
            <span className="text-3xl sm:text-4xl">📊</span>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">Pending Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
              <p className="text-xs text-gray-500 hidden sm:block">To deliver</p>
            </div>
            <span className="text-3xl sm:text-4xl">💰</span>
          </div>
        </div>
      </div>

      {/* Dynamic Sections based on configuration */}
      {sectionConfig.sections
        .filter(section => section.visible)
        .map(section => (
          <div key={section.id}>
            {sections[section.id]()}
          </div>
        ))}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Dashboard Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">Customize the order and visibility of dashboard sections</p>

                {/* Section List */}
                <div className="space-y-2">
                  {sectionConfig.sections.map((section, index) => (
                    <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => index > 0 && moveSection(index, index - 1)}
                            disabled={index === 0}
                            className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => index < sectionConfig.sections.length - 1 && moveSection(index, index + 1)}
                            disabled={index === sectionConfig.sections.length - 1}
                            className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ▼
                          </button>
                        </div>
                        <span className="font-medium text-gray-700">{section.label}</span>
                      </div>
                      <button
                        onClick={() => toggleVisibility(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          section.visible
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {section.visible ? '👁️ Visible' : '🚫 Hidden'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={resetToDefaults}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Reset to Defaults
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex-1"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
