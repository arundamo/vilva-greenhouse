import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Name</th>
              <th className="text-left px-4 py-2 font-semibold">Phone</th>
              <th className="text-left px-4 py-2 font-semibold">WhatsApp</th>
              <th className="text-left px-4 py-2 font-semibold">Address</th>
              <th className="text-left px-4 py-2 font-semibold">Notes</th>
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
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2">{c.phone}</td>
                  <td className="px-4 py-2">{c.whatsapp || '-'}</td>
                  <td className="px-4 py-2 max-w-[360px] truncate" title={c.address || ''}>{c.address || '-'}</td>
                  <td className="px-4 py-2">{c.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
