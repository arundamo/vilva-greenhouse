import React from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import MicrogreenCultivatorInfo from './MicrogreenCultivatorInfo';

export default function Microgreens() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-4 sm:p-6 border border-gray-100">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Microgreens</h2>
        <p className="text-sm text-gray-600 mt-1">Manage microgreens data step by step.</p>
      </div>

      <div className="bg-white rounded-xl shadow p-3 border border-gray-100">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/microgreens/cultivator-info"
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
          >
            Cultivator Info
          </Link>
        </div>
      </div>

      <Routes>
        <Route path="cultivator-info" element={<MicrogreenCultivatorInfo />} />
        <Route path="*" element={<Navigate to="/microgreens/cultivator-info" />} />
      </Routes>
    </div>
  );
}
