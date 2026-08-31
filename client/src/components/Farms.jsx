import React from 'react'
import { Link } from 'react-router-dom'

export default function Farms() {
  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-lime-300 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
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

      <main className="max-w-7xl mx-auto px-4 py-6">
        <section className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="h-56 sm:h-72 bg-gradient-to-r from-green-900 via-green-700 to-lime-500" />
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Our Farms</h1>
            <p className="mt-2 text-slate-600 max-w-3xl">
              Vilva Greenhouse Farms follows modern, controlled-environment practices to grow fresh, clean, and consistent greens year-round.
            </p>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">How We Grow</h2>
            <p className="mt-2 text-sm text-slate-600">
              We grow crops in organized greenhouse beds with crop rotation, clean handling, and monitored irrigation schedules.
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Quality Focus</h2>
            <p className="mt-2 text-sm text-slate-600">
              Every batch is tracked from sowing to harvest so customers receive reliable freshness and traceable farm records.
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Sustainability</h2>
            <p className="mt-2 text-sm text-slate-600">
              Our team emphasizes efficient water use, reduced waste, and practical greenhouse methods to support sustainable farming.
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">Visit & Contact</h2>
          <p className="mt-2 text-sm text-slate-600">
            We are currently serving local customers with direct ordering and scheduled delivery support.
          </p>
          <p className="mt-3 text-sm text-slate-700 font-semibold">Vilva Greenhouse Farms, Guelph, ON</p>
        </section>
      </main>
    </div>
  )
}