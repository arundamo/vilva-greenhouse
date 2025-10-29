import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Sales() {
  const [orders, setOrders] = useState([])

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { variety_id: '', quantity: '', unit: 'bunches', price_per_unit: '' }]
    })
  }

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      alert('Order must have at least one item')
      return
    }
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.price_per_unit) || 0))
    }, 0).toFixed(2)
  }
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash',
    payment_date: new Date().toISOString().slice(0, 10)
  })
  const [customers, setCustomers] = useState([])
  const [varieties, setVarieties] = useState([])
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    address: ''
  })
  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    requested_via: 'whatsapp',
    items: [{ variety_id: '', quantity: '', unit: 'bunches', price_per_unit: '' }],
    delivery_date: '',
    delivery_address: '',
    notes: ''
  })

  useEffect(() => {
    loadOrders()
    loadCustomers()
    loadVarieties()
  }, [filter])

  const loadOrders = () => {
    setLoading(true)
    const url = filter === 'all' ? '/api/sales' : `/api/sales?status=${filter}`
    axios.get(url).then(res => {
      setOrders(res.data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      alert('Failed to load orders: ' + (err.response?.data?.error || err.message))
      setLoading(false)
    })
  }

  const loadCustomers = () => {
    axios.get('/api/customers').then(res => {
      setCustomers(res.data)
    }).catch(console.error)
  }

  const loadVarieties = () => {
    axios.get('/api/customers/varieties').then(res => {
      setVarieties(res.data)
    }).catch(console.error)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingOrder) {
  // Update existing order
  axios.patch(`/api/sales/${editingOrder.id}`, formData).then(() => {
        loadOrders()
        closeModal()
        alert('Order updated successfully!')
      }).catch(err => {
        console.error(err)
        alert('Failed to update order: ' + (err.response?.data?.error || err.message))
      })
    } else {
      // Create new order
      axios.post('/api/sales', formData).then(() => {
        loadOrders()
        closeModal()
        alert('Order created successfully!')
      }).catch(err => {
        console.error(err)
        alert('Failed to create order: ' + (err.response?.data?.error || err.message))
      })
    }
  }

  const handleEditOrder = (order) => {
    setEditingOrder(order)
    setFormData({
      customer_id: order.customer_id,
      order_date: order.order_date,
      requested_via: order.requested_via,
      items: order.items && order.items.length > 0 ? order.items.map(item => ({
        variety_id: item.variety_id,
        quantity: item.quantity,
        unit: item.unit,
        price_per_unit: item.price_per_unit
      })) : [{ variety_id: '', quantity: '', unit: 'bunches', price_per_unit: '' }],
      delivery_date: order.delivery_date || '',
      delivery_address: order.delivery_address || '',
      notes: order.notes || ''
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingOrder(null)
    setShowNewCustomer(false)
    setEditingCustomer(null)
    setFormData({
      customer_id: '',
      order_date: new Date().toISOString().slice(0, 10),
      requested_via: 'whatsapp',
      items: [{ variety_id: '', quantity: '', unit: 'bunches', price_per_unit: '' }],
      delivery_date: '',
      delivery_address: '',
      notes: ''
    })
    setNewCustomer({
      name: '',
      phone: '',
      whatsapp: '',
      address: ''
    })
  }

  const handleAddCustomer = (e) => {
    e.preventDefault()
    axios.post('/api/customers', newCustomer).then(res => {
      loadCustomers()
      setFormData({ ...formData, customer_id: res.data.id })
      setShowNewCustomer(false)
      setNewCustomer({ name: '', phone: '', whatsapp: '', address: '' })
      alert('Customer added successfully!')
    }).catch(err => {
      console.error(err)
      alert('Failed to add customer: ' + (err.response?.data?.error || err.message))
    })
  }

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setNewCustomer({
      name: customer.name,
      phone: customer.phone,
      whatsapp: customer.whatsapp || '',
      address: customer.address || ''
    })
    setShowNewCustomer(true)
  }

  const handleUpdateCustomer = (e) => {
    e.preventDefault()
    axios.patch(`/api/customers/${editingCustomer.id}`, newCustomer).then(() => {
      loadCustomers()
      setFormData({ ...formData, customer_id: editingCustomer.id })
      setShowNewCustomer(false)
      setEditingCustomer(null)
      setNewCustomer({ name: '', phone: '', whatsapp: '', address: '' })
      alert('Customer updated successfully!')
    }).catch(err => {
      console.error(err)
      alert('Failed to update customer: ' + (err.response?.data?.error || err.message))
    })
  }

  const updateOrderStatus = (id, status) => {
    axios.patch(`/api/sales/${id}`, { delivery_status: status }).then(() => {
      loadOrders()
    }).catch(err => {
      console.error(err)
      alert('Failed to update order status: ' + (err.response?.data?.error || err.message))
    })
  }

  const openPaymentModal = (order) => {
    setSelectedOrder(order)
    setShowPaymentModal(true)
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedOrder(null)
    setPaymentData({
      payment_method: 'cash',
      payment_date: new Date().toISOString().slice(0, 10)
    })
  }

  const handlePaymentReceived = (e) => {
    e.preventDefault()
    axios.patch(`/api/sales/${selectedOrder.id}`, {
      payment_status: 'paid',
      payment_method: paymentData.payment_method,
      payment_date: paymentData.payment_date
    }).then(() => {
      loadOrders()
      closePaymentModal()
      alert('Payment recorded successfully!')
    }).catch(err => {
      console.error(err)
      alert('Failed to update payment: ' + (err.response?.data?.error || err.message))
    })
  }

  const handleDeleteOrder = (orderId) => {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      axios.delete(`/api/sales/${orderId}`).then(() => {
        loadOrders()
        alert('Order deleted successfully!')
      }).catch(err => {
        console.error(err)
        alert('Failed to delete order: ' + (err.response?.data?.error || err.message))
      })
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'unconfirmed': return 'bg-orange-100 text-orange-700 border border-orange-300'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'packed': return 'bg-blue-100 text-blue-700'
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Sales & Orders</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          + New Order
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {['unconfirmed', 'pending', 'packed', 'delivered', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 sm:px-4 py-2 rounded-t-lg transition-colors text-sm sm:text-base ${
              filter === f
                ? 'bg-green-600 text-white font-semibold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'unconfirmed' && '🆕 '}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className={`bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow ${order.delivery_status === 'unconfirmed' ? 'border-2 border-orange-300' : ''}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg sm:text-xl font-semibold">{order.customer_name}</h3>
                  {order.requested_via === 'online_form' && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">
                      🌐 Online Order
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  📞 {order.phone} {order.whatsapp && `• WhatsApp: ${order.whatsapp}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">Order #{order.id} • {order.order_date}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(order.delivery_status)}`}>
                  {order.delivery_status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-gray-500 mb-2">Order Items</p>
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                        <span className="font-medium text-green-700">{item.variety_name}</span>
                        <span className="text-sm text-gray-600">
                          {item.quantity} {item.unit} × ₹{item.price_per_unit} = ₹{item.subtotal}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No items</p>
                )}
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-xs text-gray-500">Amount</p>
                <p className="font-medium">₹{order.total_amount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment</p>
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                    {order.payment_status}
                  </p>
                  {order.payment_method && (
                    <span className="text-xs text-gray-500">({order.payment_method})</span>
                  )}
                </div>
                {order.payment_date && (
                  <p className="text-xs text-gray-500">{order.payment_date}</p>
                )}
              </div>
            </div>

            {order.delivery_date && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  📅 Delivery: {order.delivery_date}
                </p>
              </div>
            )}

            {order.delivery_address && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  📍 {order.delivery_address}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-xs text-gray-500">
                Via: <span className="font-medium capitalize">{order.requested_via}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleEditOrder(order)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                >
                  ✏️ Edit
                </button>
                {order.payment_status === 'pending' && (
                  <button
                    onClick={() => openPaymentModal(order)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
                  >
                    💰 Payment
                  </button>
                )}
                {order.delivery_status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'packed')}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                  >
                    Mark Packed
                  </button>
                )}
                {order.delivery_status === 'packed' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
                  >
                    Mark Delivered
                  </button>
                )}
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg">
          No orders found for the selected filter.
        </div>
      )}

      {/* New/Edit Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editingOrder ? 'Edit Order' : 'Create New Order'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  {!showNewCustomer ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={formData.customer_id}
                          onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                          required
                          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select Customer</option>
                          {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowNewCustomer(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                        >
                          + New
                        </button>
                      </div>
                      {formData.customer_id && (
                        <button
                          type="button"
                          onClick={() => {
                            const customer = customers.find(c => c.id === parseInt(formData.customer_id))
                            if (customer) handleEditCustomer(customer)
                          }}
                          className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                        >
                          ✏️ Edit Selected Customer
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-blue-900">
                          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCustomer(false)
                            setEditingCustomer(null)
                            setNewCustomer({ name: '', phone: '', whatsapp: '', address: '' })
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Back to Select
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            required
                            placeholder="Customer name"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Phone *
                            </label>
                            <input
                              type="tel"
                              value={newCustomer.phone}
                              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                              required
                              placeholder="Phone number"
                              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              WhatsApp
                            </label>
                            <input
                              type="tel"
                              value={newCustomer.whatsapp}
                              onChange={(e) => setNewCustomer({ ...newCustomer, whatsapp: e.target.value })}
                              placeholder="WhatsApp (optional)"
                              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Address
                          </label>
                          <textarea
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                            placeholder="Customer address (optional)"
                            rows="2"
                            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          {editingCustomer ? 'Update Customer' : 'Add Customer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Date *
                  </label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    required
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requested Via *
                  </label>
                  <select
                    value={formData.requested_via}
                    onChange={(e) => setFormData({ ...formData, requested_via: e.target.value })}
                    required
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Phone</option>
                    <option value="in-person">In Person</option>
                  </select>
                </div>
              </div>

              {/* Order Items */}
              <div className="col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Order Items *
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
                  {formData.items.map((item, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Variety *</label>
                          <select
                            value={item.variety_id}
                            onChange={(e) => updateItem(index, 'variety_id', e.target.value)}
                            required
                            className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Select Variety</option>
                            {varieties.map(variety => (
                              <option key={variety.id} value={variety.id}>
                                {variety.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Quantity *</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            placeholder="10"
                            className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Unit *</label>
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            required
                            className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500"
                          >
                            <option value="bunches">Bunches</option>
                            <option value="grams">Grams</option>
                            <option value="kg">Kilograms</option>
                            <option value="pieces">Pieces</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Price per Unit *</label>
                          <input
                            type="number"
                            value={item.price_per_unit}
                            onChange={(e) => updateItem(index, 'price_per_unit', e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            placeholder="50"
                            className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500"
                          />
                          {item.quantity && item.price_per_unit && (
                            <p className="text-xs text-gray-500 mt-1">
                              Subtotal: ₹{(parseFloat(item.quantity) * parseFloat(item.price_per_unit)).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-right font-semibold text-lg pt-2 border-t">
                    Total: ₹{calculateTotal()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address
                </label>
                <textarea
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  rows="2"
                  placeholder="Full delivery address"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                  placeholder="Additional notes"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>

              {formData.quantity && formData.price_per_unit && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Total Amount:</p>
                  <p className="text-2xl font-bold text-green-700">
                    ₹{(parseFloat(formData.quantity) * parseFloat(formData.price_per_unit)).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  {editingOrder ? 'Update Order' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Record Payment</h3>
              <button 
                onClick={closePaymentModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Order #{selectedOrder.id}</p>
              <p className="font-semibold text-lg">{selectedOrder.customer_name}</p>
              <p className="text-sm text-gray-600">{selectedOrder.variety_name} - {selectedOrder.quantity} {selectedOrder.unit}</p>
              <p className="text-2xl font-bold text-green-700 mt-2">₹{selectedOrder.total_amount}</p>
            </div>

            <form onSubmit={handlePaymentReceived} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
