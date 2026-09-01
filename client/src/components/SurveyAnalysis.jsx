import React, { useEffect, useState } from 'react'
import axios from 'axios'

const keyValueEntries = (obj) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1])

const downloadBlob = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

const escapeCsvCell = (value) => {
  const str = value == null ? '' : String(value)
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export default function SurveyAnalysis() {
  const [summary, setSummary] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingAll, setDeletingAll] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [summaryRes, listRes] = await Promise.all([
        axios.get('/api/admin/survey-responses/summary'),
        axios.get('/api/admin/survey-responses')
      ])

      setSummary(summaryRes.data || null)
      setResponses(Array.isArray(listRes.data) ? listRes.data : [])
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to load survey analysis data.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    const confirmed = window.confirm('Delete all survey responses? This action cannot be undone.')
    if (!confirmed) return

    try {
      setDeletingAll(true)
      setError('')
      setSuccess('')

      const response = await axios.delete('/api/admin/survey-responses')
      setSuccess(response.data?.message || 'All survey responses deleted successfully.')
      await loadData()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to delete survey responses.')
    } finally {
      setDeletingAll(false)
    }
  }

  const handleDownloadJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      total: responses.length,
      responses
    }
    const fileName = `survey-responses-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
    downloadBlob(JSON.stringify(payload, null, 2), fileName, 'application/json;charset=utf-8')
  }

  const handleDownloadCsv = () => {
    const headers = [
      'id',
      'created_at',
      'respondent_name',
      'phone',
      'email',
      'neighborhood_address',
      'sample_opt_in',
      'consumption_frequency',
      'primary_source',
      'top_drivers',
      'hard_to_find_varieties',
      'hard_to_find_other',
      'biggest_frustration',
      'subscription_interest',
      'curry_delivery_interest',
      'decision_barrier'
    ]

    const rows = responses.map((row) => {
      const topDrivers = Array.isArray(row.top_drivers) ? row.top_drivers.join(' | ') : ''
      const hardToFind = Array.isArray(row.hard_to_find_varieties) ? row.hard_to_find_varieties.join(' | ') : ''
      const values = [
        row.id,
        row.created_at,
        row.respondent_name,
        row.phone,
        row.email,
        row.neighborhood_address,
        Number(row.sample_opt_in) === 1 ? 'Yes' : 'No',
        row.consumption_frequency,
        row.primary_source,
        topDrivers,
        hardToFind,
        row.hard_to_find_other,
        row.biggest_frustration,
        row.subscription_interest,
        row.curry_delivery_interest,
        row.decision_barrier
      ]
      return values.map(escapeCsvCell).join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const fileName = `survey-responses-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    downloadBlob(`\uFEFF${csv}`, fileName, 'text/csv;charset=utf-8')
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) return <div className="text-center py-10">Loading survey analysis...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Survey Analysis</h2>
        <p className="text-sm text-lime-200 mt-1">Community survey insights for Indian greens demand.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={loading || responses.length === 0}
            className="rounded-lg bg-lime-600 px-4 py-2 text-sm font-bold text-white hover:bg-lime-500 disabled:opacity-60"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={handleDownloadJson}
            disabled={loading || responses.length === 0}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            Download JSON
          </button>
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={deletingAll || loading || responses.length === 0}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-60"
          >
            {deletingAll ? 'Deleting...' : 'Delete All Responses'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/40 bg-red-950/45 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-400/40 bg-emerald-950/45 p-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/85 rounded-lg shadow p-5 border border-lime-700/35">
              <p className="text-sm text-lime-200/80">Total Responses</p>
              <p className="text-3xl font-black text-lime-100 mt-1">{summary.total_responses || 0}</p>
            </div>
            <div className="bg-zinc-900/85 rounded-lg shadow p-5 border border-lime-700/35">
              <p className="text-sm text-lime-200/80">Sample Opt-ins</p>
              <p className="text-3xl font-black text-lime-100 mt-1">{summary.sample_opt_in_yes || 0}</p>
            </div>
            <div className="bg-zinc-900/85 rounded-lg shadow p-5 border border-lime-700/35">
              <p className="text-sm text-lime-200/80">Sample Opt-in Rate</p>
              <p className="text-3xl font-black text-lime-100 mt-1">
                {summary.total_responses > 0
                  ? `${Math.round((summary.sample_opt_in_yes / summary.total_responses) * 100)}%`
                  : '0%'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-zinc-900/85 rounded-lg shadow p-5 border border-lime-700/35">
              <h3 className="text-lg font-bold text-white mb-3">Q1 Consumption Frequency</h3>
              <ul className="space-y-2 text-sm">
                {keyValueEntries(summary.by_frequency).map(([key, count]) => (
                  <li key={key} className="flex items-center justify-between border-b border-lime-800/35 pb-1">
                    <span className="text-lime-100">{key}</span>
                    <span className="font-bold text-lime-300">{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900/85 rounded-lg shadow p-5 border border-lime-700/35">
              <h3 className="text-lg font-bold text-white mb-3">Q2 Primary Source</h3>
              <ul className="space-y-2 text-sm">
                {keyValueEntries(summary.by_source).map(([key, count]) => (
                  <li key={key} className="flex items-center justify-between border-b border-lime-800/35 pb-1">
                    <span className="text-lime-100">{key}</span>
                    <span className="font-bold text-lime-300">{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900/85 rounded-lg shadow p-5 border border-lime-700/35">
              <h3 className="text-lg font-bold text-white mb-3">Q3 Top Purchasing Drivers</h3>
              <ul className="space-y-2 text-sm">
                {keyValueEntries(summary.top_driver_counts).map(([key, count]) => (
                  <li key={key} className="flex items-center justify-between border-b border-lime-800/35 pb-1">
                    <span className="text-lime-100">{key}</span>
                    <span className="font-bold text-lime-300">{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900/85 rounded-lg shadow p-5 border border-lime-700/35">
              <h3 className="text-lg font-bold text-white mb-3">Q4 Hard-to-Find Varieties</h3>
              <ul className="space-y-2 text-sm">
                {keyValueEntries(summary.hard_to_find_counts).map(([key, count]) => (
                  <li key={key} className="flex items-center justify-between border-b border-lime-800/35 pb-1">
                    <span className="text-lime-100">{key}</span>
                    <span className="font-bold text-lime-300">{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900/85 rounded-lg shadow p-5 border border-lime-700/35">
              <h3 className="text-lg font-bold text-white mb-3">Q5 Biggest Frustration</h3>
              <ul className="space-y-2 text-sm">
                {keyValueEntries(summary.by_frustration).map(([key, count]) => (
                  <li key={key} className="flex items-center justify-between border-b border-lime-800/35 pb-1">
                    <span className="text-lime-100">{key}</span>
                    <span className="font-bold text-lime-300">{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900/85 rounded-lg shadow p-5 border border-lime-700/35">
              <h3 className="text-lg font-bold text-white mb-3">Q6 Subscription Interest</h3>
              <ul className="space-y-2 text-sm">
                {keyValueEntries(summary.by_subscription_interest).map(([key, count]) => (
                  <li key={key} className="flex items-center justify-between border-b border-lime-800/35 pb-1">
                    <span className="text-lime-100">{key}</span>
                    <span className="font-bold text-lime-300">{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900/85 rounded-lg shadow p-5 border border-lime-700/35">
              <h3 className="text-lg font-bold text-white mb-3">Q7 Curry Delivery Interest</h3>
              <ul className="space-y-2 text-sm">
                {keyValueEntries(summary.by_curry_interest).map(([key, count]) => (
                  <li key={key} className="flex items-center justify-between border-b border-lime-800/35 pb-1">
                    <span className="text-lime-100">{key}</span>
                    <span className="font-bold text-lime-300">{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900/85 rounded-lg shadow p-5 border border-lime-700/35">
              <h3 className="text-lg font-bold text-white mb-3">Q8 Decision Barrier</h3>
              <ul className="space-y-2 text-sm">
                {keyValueEntries(summary.by_barrier).map(([key, count]) => (
                  <li key={key} className="flex items-center justify-between border-b border-lime-800/35 pb-1">
                    <span className="text-lime-100">{key}</span>
                    <span className="font-bold text-lime-300">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      <div className="bg-zinc-900/85 rounded-lg shadow border border-lime-700/35 overflow-x-auto">
        <div className="p-4 border-b border-lime-700/35">
          <h3 className="text-lg font-bold text-white">Raw Responses</h3>
        </div>
        <table className="min-w-full text-sm text-lime-100">
          <thead className="bg-zinc-900/90 text-lime-100">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Phone</th>
              <th className="text-left px-4 py-2">Source</th>
              <th className="text-left px-4 py-2">Frequency</th>
              <th className="text-left px-4 py-2">Subscription</th>
              <th className="text-left px-4 py-2">Barrier</th>
              <th className="text-left px-4 py-2">Sample Opt-in</th>
            </tr>
          </thead>
          <tbody>
            {responses.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-lime-200/70">No survey responses yet.</td>
              </tr>
            ) : (
              responses.map((row) => (
                <tr key={row.id} className="border-t border-lime-700/30 hover:bg-lime-500/5">
                  <td className="px-4 py-2">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{row.respondent_name || '-'}</td>
                  <td className="px-4 py-2">{row.phone || '-'}</td>
                  <td className="px-4 py-2">{row.primary_source || '-'}</td>
                  <td className="px-4 py-2">{row.consumption_frequency || '-'}</td>
                  <td className="px-4 py-2">{row.subscription_interest || '-'}</td>
                  <td className="px-4 py-2">{row.decision_barrier || '-'}</td>
                  <td className="px-4 py-2">{Number(row.sample_opt_in) === 1 ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
