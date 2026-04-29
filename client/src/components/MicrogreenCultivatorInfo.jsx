import React, { useState } from 'react';

const initialForm = {
  crop_name: '',
  avg_1020_sow_weight_grams: '',
  medium: '',
  blackout_weight_time: '',
  soak_time: '',
  grow_time: '',
  trueleaf_emerges: '',
  avg_harvest_grams: '',
  growing_notes: '',
  ease_of_grow: '',
  seed_source: '',
  how_to_grow_video_link: ''
};

export default function MicrogreenCultivatorInfo() {
  const [form, setForm] = useState(initialForm);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  };

  const loadRows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/microgreens/cultivators', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load cultivator rows');
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadRows();
  }, []);

  const loadFromPdf = async () => {
    try {
      setLoading(true);
      setMessage('');
      const response = await fetch('/api/microgreens/cultivators/import-pdf', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to import PDF data');
      }
      setMessage(`Imported ${data.count || 0} cultivator rows from PDF pages 3-6.`);
      await loadRows();
    } catch (error) {
      setMessage(error.message || 'Failed to import PDF data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      const payload = {
        name: form.crop_name,
        avg_1020_sow_weight_grams: form.avg_1020_sow_weight_grams,
        medium: form.medium,
        blackout_weight_time: form.blackout_weight_time,
        soak_time: form.soak_time,
        grow_time: form.grow_time,
        trueleaf_emerges: form.trueleaf_emerges,
        avg_harvest_grams: form.avg_harvest_grams,
        growing_notes: form.growing_notes,
        ease_of_grow: form.ease_of_grow,
        seed_source: form.seed_source,
        how_to_grow_video_link: form.how_to_grow_video_link,
        source_page: null
      };

      const isEdit = !!editingId;
      const response = await fetch(isEdit ? `/api/microgreens/cultivators/${editingId}` : '/api/microgreens/cultivators', {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save cultivator row');
      }

      setForm(initialForm);
      setEditingId(null);
      setMessage(isEdit ? 'Cultivator row updated.' : 'Cultivator row saved.');
      await loadRows();
    } catch (error) {
      setMessage(error.message || 'Failed to save cultivator row');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (row) => {
    setForm({
      crop_name: row.crop || '',
      avg_1020_sow_weight_grams: row.avg_1020_sow_weight_grams || '',
      medium: row.medium || '',
      blackout_weight_time: row.blackout_weight_time || '',
      soak_time: row.soak_time || '',
      grow_time: row.grow_time || '',
      trueleaf_emerges: row.trueleaf_emerges || '',
      avg_harvest_grams: row.avg_harvest_grams || '',
      growing_notes: row.growing_notes || '',
      ease_of_grow: row.ease_of_grow || '',
      seed_source: row.seed_source || '',
      how_to_grow_video_link: row.how_to_grow_video_link || ''
    });
    setEditingId(row.id);
    setMessage('Editing selected row. Update and save.');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setMessage('Edit canceled.');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-4 sm:p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Add Cultivator Info</h3>
        <p className="text-sm text-gray-600 mt-1">Use the same structure as your sheet columns.</p>

        {!!message && (
          <div className="mt-3 px-3 py-2 rounded border border-blue-200 bg-blue-50 text-sm text-blue-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            type="text"
            required
            placeholder="Crop Name"
            value={form.crop_name}
            onChange={(e) => setForm((p) => ({ ...p, crop_name: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            placeholder="Avg. 1020 Sow Weight (Grams)"
            value={form.avg_1020_sow_weight_grams}
            onChange={(e) => setForm((p) => ({ ...p, avg_1020_sow_weight_grams: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            placeholder="Medium"
            value={form.medium}
            onChange={(e) => setForm((p) => ({ ...p, medium: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            placeholder="Blackout / Weight Time"
            value={form.blackout_weight_time}
            onChange={(e) => setForm((p) => ({ ...p, blackout_weight_time: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            placeholder="Soak Time"
            value={form.soak_time}
            onChange={(e) => setForm((p) => ({ ...p, soak_time: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            placeholder="Grow Time"
            value={form.grow_time}
            onChange={(e) => setForm((p) => ({ ...p, grow_time: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            placeholder="Trueleaf Emerges"
            value={form.trueleaf_emerges}
            onChange={(e) => setForm((p) => ({ ...p, trueleaf_emerges: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            placeholder="Avg. Harvest (Grams)"
            value={form.avg_harvest_grams}
            onChange={(e) => setForm((p) => ({ ...p, avg_harvest_grams: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            placeholder="Ease Of Grow"
            value={form.ease_of_grow}
            onChange={(e) => setForm((p) => ({ ...p, ease_of_grow: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            placeholder="Seed Source"
            value={form.seed_source}
            onChange={(e) => setForm((p) => ({ ...p, seed_source: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            placeholder="How To Grow Video Link"
            value={form.how_to_grow_video_link}
            onChange={(e) => setForm((p) => ({ ...p, how_to_grow_video_link: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="text"
            placeholder="Growing Notes"
            value={form.growing_notes}
            onChange={(e) => setForm((p) => ({ ...p, growing_notes: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              {editingId ? 'Update Cultivator Info' : 'Add Cultivator Info'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-gray-500 text-white text-sm font-medium hover:bg-gray-600"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="button"
              onClick={loadFromPdf}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Load PDF Data (Pages 3-6)
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="w-full min-w-[1300px] text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-900">
              <th className="px-3 py-3 text-left font-semibold">Crop Name</th>
              <th className="px-3 py-3 text-left font-semibold">Avg. 1020 Sow Weight (Grams)</th>
              <th className="px-3 py-3 text-left font-semibold">Medium</th>
              <th className="px-3 py-3 text-left font-semibold">Blackout / Weight Time</th>
              <th className="px-3 py-3 text-left font-semibold">Soak Time</th>
              <th className="px-3 py-3 text-left font-semibold">Grow Time</th>
              <th className="px-3 py-3 text-left font-semibold">Trueleaf Emerges</th>
              <th className="px-3 py-3 text-left font-semibold">Avg. Harvest (Grams)</th>
              <th className="px-3 py-3 text-left font-semibold">Growing Notes</th>
              <th className="px-3 py-3 text-left font-semibold">Ease Of Grow</th>
              <th className="px-3 py-3 text-left font-semibold">Seed Source</th>
              <th className="px-3 py-3 text-left font-semibold">How To Grow Video Link</th>
              <th className="px-3 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-gray-500">
                  No cultivator records yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">
                    {row.cultivar && row.cultivar !== row.crop ? `${row.crop} (${row.cultivar})` : row.crop}
                  </td>
                  <td className="px-3 py-2">{row.avg_1020_sow_weight_grams || '-'}</td>
                  <td className="px-3 py-2">{row.medium || '-'}</td>
                  <td className="px-3 py-2">{row.blackout_weight_time || '-'}</td>
                  <td className="px-3 py-2">{row.soak_time || '-'}</td>
                  <td className="px-3 py-2">{row.grow_time || '-'}</td>
                  <td className="px-3 py-2">{row.trueleaf_emerges || '-'}</td>
                  <td className="px-3 py-2">{row.avg_harvest_grams || '-'}</td>
                  <td className="px-3 py-2">{row.growing_notes || '-'}</td>
                  <td className="px-3 py-2">{row.ease_of_grow || '-'}</td>
                  <td className="px-3 py-2">{row.seed_source || '-'}</td>
                  <td className="px-3 py-2">{row.how_to_grow_video_link || '-'}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="px-2 py-1 rounded bg-amber-500 text-white text-xs font-medium hover:bg-amber-600"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
