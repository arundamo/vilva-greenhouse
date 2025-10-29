import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Greenhouses from './components/Greenhouses';
import Crops from './components/Crops';
import Activities from './components/Activities';
import Sales from './components/Sales';

export default function App() {
  const location = useLocation();
  const navLinks = [
    { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/greenhouses', label: 'Greenhouses', icon: '�' },
  { path: '/crops', label: 'Crops', icon: '�' },
  { path: '/activities', label: 'Activities', icon: '📝' },
  { path: '/sales', label: 'Sales', icon: '�' },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌿</span>
              <h1 className="text-xl font-bold">Vilva Greenhouse Farm</h1>
            </div>
            <div className="flex space-x-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  className={`px-4 py-2 rounded-md transition-colors ${
                    location.pathname === link.path
                      ? 'bg-green-700 font-semibold'
                      : 'hover:bg-green-500'
                  }`}
                >
                  <span className="mr-1">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/greenhouses" element={<Greenhouses />} />
          <Route path="/crops" element={<Crops />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/sales" element={<Sales />} />
        </Routes>
      </main>
    </div>
  );
}
