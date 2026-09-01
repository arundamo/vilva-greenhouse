import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const topPurchasingDriverOptions = [
  'Peak Freshness & Long Shelf-Life',
  'Proximity & Shopping Convenience',
  'Competitive / Low Pricing',
  'Organic & Locally Grown Quality',
  'Reliable Supply of Hard-to-Find Traditional Varieties'
]

const hardToFindOptions = [
  'Fresh Gongura (Pulicha Keerai / Ambad Chukka)',
  'Red Amaranth (Thotakura / Siru Keerai)',
  'Green Amaranth (Koyya Thotakura)',
  'Fresh Tender Methi (Fenugreek)',
  'Desi Palak (Indian Spinach)',
  'Specialty Keerai (Ponnanganni / Manathakkali / Agathi)',
  'Other'
]

const optionCardClass = 'flex items-start gap-3 rounded-lg border border-emerald-800 bg-emerald-950/50 p-3 cursor-pointer'
const optionInputClass = 'mt-0.5 h-4 w-4 shrink-0 accent-lime-400'

export default function PublicSurvey() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    neighborhood_address: '',
    sample_opt_in: true,
    consumption_frequency: '',
    primary_source: '',
    top_drivers: [],
    hard_to_find_varieties: [],
    hard_to_find_other: '',
    biggest_frustration: '',
    subscription_interest: '',
    curry_delivery_interest: '',
    decision_barrier: ''
  })

  const toggleTopDriver = (value) => {
    setFormData((prev) => {
      const exists = prev.top_drivers.includes(value)
      if (exists) {
        return {
          ...prev,
          top_drivers: prev.top_drivers.filter((item) => item !== value)
        }
      }
      if (prev.top_drivers.length >= 2) {
        return prev
      }
      return {
        ...prev,
        top_drivers: [...prev.top_drivers, value]
      }
    })
  }

  const toggleHardToFindVariety = (value) => {
    setFormData((prev) => {
      const exists = prev.hard_to_find_varieties.includes(value)
      return {
        ...prev,
        hard_to_find_varieties: exists
          ? prev.hard_to_find_varieties.filter((item) => item !== value)
          : [...prev.hard_to_find_varieties, value],
        hard_to_find_other: value === 'Other' && exists ? '' : prev.hard_to_find_other
      }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccess('')
    setError('')

    if (formData.top_drivers.length === 0) {
      setError('Please select at least one top purchasing driver.')
      return
    }

    if (formData.top_drivers.length > 2) {
      setError('Please select only up to 2 top purchasing drivers.')
      return
    }

    if (formData.hard_to_find_varieties.includes('Other') && !formData.hard_to_find_other.trim()) {
      setError('Please specify the Other specialty variety.')
      return
    }

    try {
      setSubmitting(true)
      await axios.post('/api/public/survey', formData)
      setSuccess('Thanks for sharing your feedback. Your survey response has been recorded.')
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        neighborhood_address: '',
        sample_opt_in: true,
        consumption_frequency: '',
        primary_source: '',
        top_drivers: [],
        hard_to_find_varieties: [],
        hard_to_find_other: '',
        biggest_frustration: '',
        subscription_interest: '',
        curry_delivery_interest: '',
        decision_barrier: ''
      })
    } catch (submitError) {
      console.error(submitError)
      setError(submitError.response?.data?.error || 'Failed to submit survey. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-30 bg-lime-500 text-black border-b border-lime-400/70">
        <div className="mx-auto max-w-5xl px-4 py-2 text-center text-xs font-black tracking-[0.22em] sm:text-sm">
          VILVA GREENHOUSE FARMS
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <section className="rounded-2xl border border-lime-700/40 bg-green-950/70 p-6 sm:p-8 shadow-2xl text-emerald-100">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Vilva Greenhouse Farms — Community Survey</h1>
          <p className="mt-2 text-emerald-100 text-sm sm:text-base">
            Helping us bring fresh, locally grown Indian greens directly to your neighborhood.
          </p>

          {success && (
            <div className="mt-4 rounded-lg border border-emerald-400/40 bg-emerald-950/40 p-3 text-sm text-emerald-200">
              {success}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-400/40 bg-red-950/45 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="rounded-xl border border-lime-700/40 bg-black/20 p-4 sm:p-5 space-y-4">
              <h2 className="text-lg font-black text-lime-100">Section 1: Consumption & Buying Habits</h2>

              <div>
                <p className="block text-sm font-semibold text-lime-100 mb-2">1. Household Green Consumption Frequency</p>
                <div className="space-y-2 text-sm">
                  {['Daily', '3–4 times/week', '1–2 times/week', 'Rarely / As needed'].map((option) => (
                    <label key={option} className={optionCardClass}>
                      <input
                        type="radio"
                        name="consumption_frequency"
                        value={option}
                        checked={formData.consumption_frequency === option}
                        onChange={(e) => setFormData({ ...formData, consumption_frequency: e.target.value })}
                        className={optionInputClass}
                        required
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="block text-sm font-semibold text-lime-100 mb-2">2. Current Primary Source for Indian Greens</p>
                <div className="space-y-2 text-sm">
                  {[
                    'Local South Asian Supermarkets (Patel Brothers, Spice Land, etc.)',
                    'Mainstream Grocers (Walmart, Loblaws, Sobeys, etc.)',
                    'Direct Farm / Local Farmers Markets',
                    'Online Grocery / Delivery Services'
                  ].map((option) => (
                    <label key={option} className={optionCardClass}>
                      <input
                        type="radio"
                        name="primary_source"
                        value={option}
                        checked={formData.primary_source === option}
                        onChange={(e) => setFormData({ ...formData, primary_source: e.target.value })}
                        className={optionInputClass}
                        required
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="block text-sm font-semibold text-lime-100 mb-2">3. Top Purchasing Drivers (Select up to 2)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {topPurchasingDriverOptions.map((option) => (
                    <label key={option} className={optionCardClass}>
                      <input
                        type="checkbox"
                        checked={formData.top_drivers.includes(option)}
                        onChange={() => toggleTopDriver(option)}
                        className={optionInputClass}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-lime-200/75">Selected: {formData.top_drivers.length}/2</p>
              </div>
            </div>

            <div className="rounded-xl border border-lime-700/40 bg-black/20 p-4 sm:p-5 space-y-4">
              <h2 className="text-lg font-black text-lime-100">Section 2: Market Gaps & Quality Frustrations</h2>

              <div>
                <p className="block text-sm font-semibold text-lime-100 mb-2">4. Hard-to-Find Specialty Varieties</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {hardToFindOptions.map((option) => (
                    <label key={option} className={optionCardClass}>
                      <input
                        type="checkbox"
                        checked={formData.hard_to_find_varieties.includes(option)}
                        onChange={() => toggleHardToFindVariety(option)}
                        className={optionInputClass}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>

                {formData.hard_to_find_varieties.includes('Other') && (
                  <input
                    type="text"
                    placeholder="Please specify other specialty variety"
                    value={formData.hard_to_find_other}
                    onChange={(e) => setFormData({ ...formData, hard_to_find_other: e.target.value })}
                    className="mt-3 w-full rounded-lg border border-lime-700/40 bg-black/35 px-3 py-2 text-white"
                  />
                )}
              </div>

              <div>
                <p className="block text-sm font-semibold text-lime-100 mb-2">5. Biggest Frustrations with Store-Bought Greens</p>
                <div className="space-y-2 text-sm">
                  {[
                    'Rapid Spoilage (Goes bad within 1–2 days)',
                    'Tough / Fibrous Stems & Overmatured Leaves',
                    'Insect Holes & Visible Pest Damage',
                    'Frequent Stockouts / Inconsistent Availability',
                    'High Price for Subpar Quality'
                  ].map((option) => (
                    <label key={option} className={optionCardClass}>
                      <input
                        type="radio"
                        name="biggest_frustration"
                        value={option}
                        checked={formData.biggest_frustration === option}
                        onChange={(e) => setFormData({ ...formData, biggest_frustration: e.target.value })}
                        className={optionInputClass}
                        required
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-lime-700/40 bg-black/20 p-4 sm:p-5 space-y-4">
              <h2 className="text-lg font-black text-lime-100">Section 3: Subscription & Service Fit</h2>

              <div>
                <p className="block text-sm font-semibold text-lime-100 mb-2">6. Interest in Same-Day Harvested Weekly Subscription Box</p>
                <div className="space-y-2 text-sm">
                  {[
                    'Yes, definitely interested!',
                    'Interested, depending on pricing & delivery terms',
                    'Maybe occasionally',
                    'Not interested right now'
                  ].map((option) => (
                    <label key={option} className={optionCardClass}>
                      <input
                        type="radio"
                        name="subscription_interest"
                        value={option}
                        checked={formData.subscription_interest === option}
                        onChange={(e) => setFormData({ ...formData, subscription_interest: e.target.value })}
                        className={optionInputClass}
                        required
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="block text-sm font-semibold text-lime-100 mb-2">7. Interest in Ready-to-Eat Cooked Curry Delivery (Gongura Pappu, Saag, etc.)</p>
                <div className="space-y-2 text-sm">
                  {[
                    'Yes, eager to try',
                    'Maybe on busy weekdays',
                    'No, prefer cooking from scratch'
                  ].map((option) => (
                    <label key={option} className={optionCardClass}>
                      <input
                        type="radio"
                        name="curry_delivery_interest"
                        value={option}
                        checked={formData.curry_delivery_interest === option}
                        onChange={(e) => setFormData({ ...formData, curry_delivery_interest: e.target.value })}
                        className={optionInputClass}
                        required
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="block text-sm font-semibold text-lime-100 mb-2">8. Primary Decision Barrier for Services</p>
                <div className="space-y-2 text-sm">
                  {[
                    'Prefer cooking fresh from scratch',
                    'Hygiene or food safety concerns',
                    'Budget / Cost constraints',
                    'Existing shopping routine works fine'
                  ].map((option) => (
                    <label key={option} className={optionCardClass}>
                      <input
                        type="radio"
                        name="decision_barrier"
                        value={option}
                        checked={formData.decision_barrier === option}
                        onChange={(e) => setFormData({ ...formData, decision_barrier: e.target.value })}
                        className={optionInputClass}
                        required
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-lime-700/40 bg-black/20 p-4 sm:p-5 space-y-4">
              <h2 className="text-lg font-black text-lime-100">Section 4: Contact & Sample Registration</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-lime-100 mb-1">9. Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full rounded-lg border border-lime-700/40 bg-black/35 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-lime-100 mb-1">WhatsApp / Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-lime-700/40 bg-black/35 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-lime-100 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-lime-700/40 bg-black/35 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-lime-100 mb-1">Neighborhood / Street Address</label>
                  <input
                    type="text"
                    value={formData.neighborhood_address}
                    onChange={(e) => setFormData({ ...formData, neighborhood_address: e.target.value })}
                    className="w-full rounded-lg border border-lime-700/40 bg-black/35 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <label className={`${optionCardClass} text-sm font-semibold text-emerald-100`}>
                <input
                  type="checkbox"
                  checked={formData.sample_opt_in}
                  onChange={(e) => setFormData({ ...formData, sample_opt_in: e.target.checked })}
                  className={optionInputClass}
                />
                Send me updates about next week's harvest.
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto rounded-lg bg-lime-500 px-6 py-3 text-sm font-black tracking-wide text-black hover:bg-lime-400 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Survey'}
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto text-center rounded-lg border border-lime-400/60 px-4 py-2.5 text-sm font-bold text-lime-200 hover:bg-lime-400 hover:text-black"
              >
                Home
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
