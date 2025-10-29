import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import App from './App.jsx'
import './styles/index.css'

// Configure Axios base URL for production (Render static site)
// Falls back to same-origin in local dev
const apiBase = import.meta.env.VITE_API_URL || ''
axios.defaults.baseURL = apiBase

// Restore auth header if token exists
const token = localStorage.getItem('auth_token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
