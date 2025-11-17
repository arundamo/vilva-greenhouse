import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import Greenhouses from './components/Greenhouses';
import Crops from './components/Crops';
import Activities from './components/Activities';
import Sales from './components/Sales';
import Settings from './components/Settings';
import PublicOrderForm from './components/PublicOrderForm';
import PublicFeedback from './components/PublicFeedback';
import Feedback from './components/Feedback';
import Login from './components/Login';
import Home from './components/Home';
import Customers from './components/Customers';
import CropDemand from './components/CropDemand';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuPinned, setMenuPinned] = useState(() => {
    // Load pinned state from localStorage
    return localStorage.getItem('menuPinned') === 'true';
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Toggle menu pinned state
  const toggleMenuPin = () => {
    const newPinned = !menuPinned;
    setMenuPinned(newPinned);
    localStorage.setItem('menuPinned', newPinned.toString());
    if (newPinned) {
      setMobileMenuOpen(true);
    }
  };
  
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
    // Redirect to dashboard after successful login
    navigate('/dashboard');
  };
  
  const handleLogout = () => {
    // Clear local storage and state immediately
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    
    // Send logout request to server (but don't wait for it)
    axios.post('/api/auth/logout')
      .catch(err => console.error('Logout error:', err));
  };
  
  // Public routes that don't require authentication
  const isPublicRoute = location.pathname === '/order' || 
                        location.pathname === '/home' || 
                        location.pathname === '/' || 
                        location.pathname === '/admin' ||
                        location.pathname.startsWith('/feedback/');
  
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
        <Route path="/feedback/:orderId" element={<PublicFeedback />} />
        <Route path="/admin" element={<Login onLoginSuccess={handleLoginSuccess} />} />
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
        { path: '/crop-demand', label: 'Crop Demand', icon: '📋' },
        { path: '/feedback', label: 'Feedback', icon: '⭐' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
      ]
    : [
        { path: '/home', label: 'Home', icon: '🏠' },
        { path: '/order', label: 'Order Form', icon: '📝' },
      ];
  
  // Admin dashboard interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
      <nav className={`bg-green-600 text-white shadow-lg fixed w-full top-0 z-50 transition-all ${
        menuPinned ? 'md:pl-64' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Menu Button */}
            <div className="flex items-center space-x-3">
              <button 
                className="p-2 hover:bg-green-700 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🌿</span>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold">Vilva Greenhouse</h1>
                  <p className="text-xs text-green-100 hidden sm:block">{user.role === 'admin' ? 'Admin Panel' : 'User Panel'}</p>
                </div>
              </div>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex items-center gap-3">
              <span className="text-sm hidden sm:inline">👤 {user.username}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay - only show when menu is open and not pinned */}
      {mobileMenuOpen && !menuPinned && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Slide-in Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        mobileMenuOpen || menuPinned ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="bg-green-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌿</span>
            <span className="font-bold">Menu</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Pin/Unpin Button (Desktop only) */}
            <button 
              onClick={toggleMenuPin}
              className="hidden md:block p-1 hover:bg-green-700 rounded transition-colors"
              title={menuPinned ? 'Unpin menu' : 'Pin menu'}
            >
              {menuPinned ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 rotate-45" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                </svg>
              )}
            </button>
            {/* Close Button (Mobile only or when not pinned) */}
            {(!menuPinned || window.innerWidth < 768) && (
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 hover:bg-green-700 rounded md:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              onClick={() => !menuPinned && setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                location.pathname === link.path
                  ? 'bg-green-100 text-green-700 font-semibold shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">👤 {user.username}</span>
            <br />
            <span className="text-xs text-gray-500">{user.role}</span>
          </div>
          {menuPinned && (
            <div className="text-xs text-green-600 font-medium hidden md:block">
              📌 Menu pinned
            </div>
          )}
        </div>
      </aside>

      {/* Main Content with dynamic padding for pinned menu */}
      <main className={`max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 mt-16 transition-all ${
        menuPinned ? 'md:ml-64' : ''
      }`}>
        <Routes>
          {user.role === 'admin' ? (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/greenhouses" element={<Greenhouses />} />
              <Route path="/crops" element={<Crops />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/crop-demand" element={<CropDemand />} />
              <Route path="/feedback" element={<Feedback />} />
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
