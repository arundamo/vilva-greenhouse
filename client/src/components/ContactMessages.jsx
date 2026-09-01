import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function ContactMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replyDrafts, setReplyDrafts] = useState({})
  const [sendingId, setSendingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get('/api/admin/contact-messages')
      setMessages(Array.isArray(response.data) ? response.data : [])
    } catch (loadError) {
      console.error(loadError)
      setError(loadError.response?.data?.error || 'Failed to load contact messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  const sendReply = async (message) => {
    const reply = String(replyDrafts[message.id] || '').trim()
    if (!reply) {
      alert('Please enter a reply message')
      return
    }

    try {
      setSendingId(message.id)
      setStatusMessage('')
      await axios.post(`/api/admin/contact-messages/${message.id}/reply`, { reply })
      setReplyDrafts((prev) => ({ ...prev, [message.id]: '' }))
      setStatusMessage(`Reply sent to ${message.name}`)
      await loadMessages()
    } catch (sendError) {
      console.error(sendError)
      alert(sendError.response?.data?.error || 'Failed to send reply')
    } finally {
      setSendingId(null)
    }
  }

  const deleteMessage = async (message) => {
    const confirmed = window.confirm(`Delete message from ${message.name}? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    try {
      setDeletingId(message.id)
      setStatusMessage('')
      await axios.delete(`/api/admin/contact-messages/${message.id}`)
      setStatusMessage(`Deleted message from ${message.name}`)
      await loadMessages()
    } catch (deleteError) {
      console.error(deleteError)
      alert(deleteError.response?.data?.error || 'Failed to delete message')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Loading contact messages...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Contact Messages</h2>
            <p className="text-sm text-gray-600 mt-1">View messages from the public contact form and reply by email.</p>
          </div>
          <button
            onClick={loadMessages}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-gray-600">No contact messages yet.</div>
      ) : (
        messages.map((message) => (
          <div key={message.id} className="bg-white rounded-lg shadow p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{message.subject}</h3>
                <p className="text-sm text-gray-600">From: {message.name}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${message.status === 'new' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                {message.status}
              </span>
            </div>

            <div className="text-sm text-gray-600">
              <p>Email: {message.email || 'Not provided'}</p>
              <p>Phone: {message.phone || 'Not provided'}</p>
              <p>Received: {new Date(message.created_at).toLocaleString()}</p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-gray-800 whitespace-pre-wrap">
              {message.message}
            </div>

            {message.admin_reply && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 whitespace-pre-wrap">
                <p className="font-semibold mb-1">Previous reply sent:</p>
                {message.admin_reply}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Reply</label>
              <textarea
                rows="4"
                value={replyDrafts[message.id] || ''}
                onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [message.id]: event.target.value }))}
                placeholder={message.email ? 'Type your reply to customer...' : 'Cannot send reply without customer email'}
                disabled={!message.email}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
              <button
                onClick={() => sendReply(message)}
                disabled={!message.email || sendingId === message.id}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
              >
                {sendingId === message.id ? 'Sending...' : 'Send Reply'}
              </button>
              <button
                onClick={() => deleteMessage(message)}
                disabled={deletingId === message.id}
                className="ml-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
              >
                {deletingId === message.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}