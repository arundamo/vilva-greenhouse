import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '', whatsapp: '', address: '', email: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    setLoading(true)
    axios.get('/api/customers')
      .then(res => setCustomers(res.data))
      .catch(err => {
        console.error(err)
        alert('Failed to load customers: ' + (err.response?.data?.error || err.message))
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter(c => (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.whatsapp || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    ))
  }, [customers, search])

  const startEdit = (c) => {
    setEditingId(c.id)
    setEditForm({
      name: c.name || '',
      phone: c.phone || '',
      whatsapp: c.whatsapp || '',
      address: c.address || '',
      email: c.email || '',
      notes: c.notes || ''
    })
    setMessage({ type: '', text: '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setMessage({ type: '', text: '' })
  }

  const validate = () => {
    if (!editForm.name.trim()) return 'Name is required'
    const cleanPhone = editForm.phone.replace(/\D/g, '')
    if (cleanPhone.length !== 10) return 'Phone must be 10 digits'
    if (editForm.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(editForm.email)) return 'Invalid email format'
    return null
  }

  const saveEdit = () => {
    const err = validate()
    if (err) {
      setMessage({ type: 'error', text: err })
      return
    }
    setSaving(true)
    setMessage({ type: '', text: '' })
    axios.patch(`/api/customers/${editingId}`, editForm)
      .then(() => {
        setMessage({ type: 'success', text: 'Customer updated' })
        // Refresh list
        return axios.get('/api/customers')
      })
      .then(res => {
        setCustomers(res.data)
        cancelEdit()
      })
      .catch(err => {
        setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update customer' })
      })
      .finally(() => setSaving(false))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-3xl font-bold text-gray-800">Customers</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, address..."
            className="w-full sm:w-72 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {message.text && (
          <div className={`mx-4 mt-4 rounded px-4 py-2 text-sm ${
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.text}
          </div>
        )}
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Name</th>
              <th className="text-left px-4 py-2 font-semibold">Phone</th>
              <th className="text-left px-4 py-2 font-semibold">WhatsApp</th>
              <th className="text-left px-4 py-2 font-semibold">Address</th>
              <th className="text-left px-4 py-2 font-semibold">Notes</th>
              <th className="text-left px-4 py-2 font-semibold">Email</th>
              <th className="text-left px-4 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No customers found.</td>
              </tr>
            ) : (
              filtered.map(c => (
                <React.Fragment key={c.id}>
                  <tr className={`border-t ${editingId === c.id ? 'bg-green-50' : 'hover:bg-gray-50'}`}> 
                    <td className="px-4 py-2 font-medium">{c.name}</td>
                    <td className="px-4 py-2">{c.phone}</td>
                    <td className="px-4 py-2">{c.whatsapp || '-'}</td>
                    <td className="px-4 py-2 max-w-[220px] truncate" title={c.address || ''}>{c.address || '-'}</td>
                    <td className="px-4 py-2">{c.notes || '-'}</td>
                    <td className="px-4 py-2">{c.email || '-'}</td>
                    <td className="px-4 py-2">
                      {editingId === c.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                          >{saving ? 'Saving...' : 'Save'}</button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                          >Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(c)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        >Edit</button>
                      )}
                    </td>
                  </tr>
                  {editingId === c.id && (
                    <tr className="border-t bg-white">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                            <input
                              type="text"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp</label>
                            <input
                              type="text"
                              value={editForm.whatsapp}
                              onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                            <textarea
                              rows={2}
                              value={editForm.address}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                            <textarea
                              rows={2}
                              value={editForm.notes}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
