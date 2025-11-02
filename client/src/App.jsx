import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import Greenhouses from './components/Greenhouses';
import Crops from './components/Crops';
import Activities from './components/Activities';
import Sales from './components/Sales';
import Settings from './components/Settings';
import PublicOrderForm from './components/PublicOrderForm';
import Login from './components/Login';
import Home from './components/Home';
import Customers from './components/Customers';

export default function App() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token with server
      axios.get('/api/auth/me')
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          // Token invalid, clear storage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);
  
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };
  
  const handleLogout = () => {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      axios.post('/api/auth/logout')
        .catch(err => console.error('Logout error:', err));
    }
    
    // Clear local storage and state
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };
  
  // Public routes that don't require authentication
  const isPublicRoute = location.pathname === '/order' || location.pathname === '/home' || location.pathname === '/' || location.pathname === '/admin';
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Public routes - no authentication needed
  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/order" element={<PublicOrderForm />} />
        <Route path="/admin" element={user ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }
  
  // If not logged in and trying to access admin routes, show login
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  
  // Navigation links based on user role
  const navLinks = user.role === 'admin' 
    ? [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/greenhouses', label: 'Greenhouses', icon: '🏡' },
        { path: '/crops', label: 'Crops', icon: '🌱' },
        { path: '/activities', label: 'Activities', icon: '📝' },
        { path: '/customers', label: 'Customers', icon: '👥' },
        { path: '/sales', label: 'Sales', icon: '💰' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
      ]
    : [
        { path: '/home', label: 'Home', icon: '🏠' },
        { path: '/order', label: 'Order Form', icon: '📝' },
      ];
  
  // Admin dashboard interface
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌿</span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold truncate">Vilva Greenhouse Farm</h1>
                <p className="text-xs text-green-100">{user.role === 'admin' ? 'Admin Panel' : 'User Panel'}</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  className={`px-3 py-2 rounded-md transition-colors text-sm lg:text-base ${
                    location.pathname === link.path
                      ? 'bg-green-700 font-semibold'
                      : 'hover:bg-green-500'
                  }`}
                >
                  <span className="mr-1">{link.icon}</span>
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              ))}
              <div className="border-l border-green-500 ml-2 pl-2 flex items-center gap-2">
                <span className="text-sm hidden lg:inline">👤 {user.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md transition-colors ${
                    location.pathname === link.path
                      ? 'bg-green-700 font-semibold'
                      : 'hover:bg-green-500'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-green-500 mt-2 pt-2 px-4">
                <p className="text-sm mb-2">👤 {user.username}</p>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Routes>
          {user.role === 'admin' ? (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/greenhouses" element={<Greenhouses />} />
              <Route path="/crops" element={<Crops />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          ) : (
            <>
              <Route path="/home" element={<Home />} />
              <Route path="/order" element={<PublicOrderForm />} />
              <Route path="*" element={<Navigate to="/home" />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}
