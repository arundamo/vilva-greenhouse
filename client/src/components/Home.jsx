import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (err) {
        console.error('Error parsing user:', err)
      }
    }
  }, [])

  const handleLogout = () => {
    const token = localStorage.getItem('auth_token')
    
    if (token) {
      axios.post('/api/auth/logout').catch(err => console.error('Logout error:', err))
    }
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Hero Section */}
      <div className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🌿</div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-green-800">
                  Vilva Greenhouse Farm
                </h1>
                <p className="text-sm text-gray-600">Fresh Spinach & Greens</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/order')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm sm:text-base"
              >
                Order Now
              </button>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 hidden sm:inline">👤 {user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 font-medium text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/admin')}
                  className="hidden sm:inline-block bg-white text-green-700 border border-green-600 px-3 py-2 rounded-lg hover:bg-green-50 font-medium text-sm"
                  title="Admin Login"
                >
                  Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Welcome to Vilva Greenhouse Farm
          </h2>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">
            We are passionate about growing the freshest, healthiest spinach and greens 
            using sustainable greenhouse farming practices. Our state-of-the-art greenhouses 
            ensure optimal growing conditions year-round, delivering premium quality produce 
            directly to your table.
          </p>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            Located in the heart of agricultural excellence, Vilva Greenhouse Farm combines 
            traditional farming wisdom with modern technology to bring you the best greens 
            nature has to offer.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-3">🏡</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">3 Greenhouses</h3>
            <p className="text-gray-600">
              Modern controlled-environment facilities with optimal conditions for growing premium greens
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-3">🌱</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Multiple Varieties</h3>
            <p className="text-gray-600">
              Choose from various spinach varieties, each with unique flavors and nutritional benefits
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Fresh Delivery</h3>
            <p className="text-gray-600">
              Farm-fresh produce delivered to your doorstep, harvested and packed with care
            </p>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
            Our Products
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-green-600 pl-4 py-2">
              <h3 className="text-xl font-bold text-green-700 mb-1">Fresh Spinach</h3>
              <p className="text-gray-600">
                Premium quality spinach varieties including Baby Spinach, Red Spinach, and more. 
                Rich in iron, vitamins, and minerals.
              </p>
            </div>

            <div className="border-l-4 border-green-600 pl-4 py-2">
              <h3 className="text-xl font-bold text-green-700 mb-1">Leafy Greens</h3>
              <p className="text-gray-600">
                A variety of nutritious leafy greens perfect for salads, cooking, and healthy meals.
              </p>
            </div>

            <div className="border-l-4 border-green-600 pl-4 py-2">
              <h3 className="text-xl font-bold text-green-700 mb-1">Custom Orders</h3>
              <p className="text-gray-600">
                Need a specific quantity or variety? We accommodate bulk orders and special requests.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 sm:p-8 mb-8 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Why Choose Vilva Greenhouse Farm?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="text-2xl">✓</div>
              <div>
                <h4 className="font-bold mb-1">100% Natural</h4>
                <p className="text-green-50">No harmful chemicals or pesticides</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-2xl">✓</div>
              <div>
                <h4 className="font-bold mb-1">Always Fresh</h4>
                <p className="text-green-50">Harvested on order for maximum freshness</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-2xl">✓</div>
              <div>
                <h4 className="font-bold mb-1">Quality Assured</h4>
                <p className="text-green-50">Carefully grown and inspected</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-2xl">✓</div>
              <div>
                <h4 className="font-bold mb-1">Fair Pricing</h4>
                <p className="text-green-50">Direct from farm, no middlemen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Ready to Order?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Experience the freshness of greenhouse-grown greens delivered to your door
          </p>
          <button
            onClick={() => navigate('/order')}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium text-lg inline-flex items-center gap-2"
          >
            <span>Place Your Order</span>
            <span>→</span>
          </button>
          <p className="text-sm text-gray-500 mt-4">
            We'll contact you within 24 hours to confirm your order
          </p>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            Have questions? Contact us for more information about our products and services.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>© 2025 Vilva Greenhouse Farm. All rights reserved.</p>
          <p className="mt-1">Growing fresh, healthy greens with care and dedication</p>
        </div>
      </div>
    </div>
  )
}
