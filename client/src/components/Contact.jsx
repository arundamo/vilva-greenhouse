import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function Contact() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccess('')
    setError('')

    try {
      setSubmitting(true)
      await axios.post('/api/public/contact', formData)
      setSuccess('Thanks for contacting us. Our admin team has been notified and will reply soon.')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (submitError) {
      console.error(submitError)
      setError(submitError.response?.data?.error || 'Failed to submit contact form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-lime-300 bg-white sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="text-xl sm:text-2xl font-black tracking-wide text-green-800">
            Vilva Greenhouse
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold"
            >
              Home
            </Link>
            <Link
              to="/shopping"
              className="px-4 py-2 rounded-lg bg-lime-500 text-black font-bold hover:bg-lime-400 text-sm"
            >
              Marketplace
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Contact Us</h1>
          <p className="text-slate-600 mt-1">Send us your questions, feedback, or bulk order inquiries.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          {success && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                rows="5"
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Contact Form'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}