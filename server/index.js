const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const db = require('./database');

// Debug: Check if email env vars are loaded
console.log('=== Environment Variables Check ===');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set');
console.log('SMTP_HOST:', process.env.SMTP_HOST ? '✅ Set' : '❌ Not set');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM ? '✅ Set' : '❌ Not set');
console.log('===================================');

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// CORS configuration
// We use Authorization header tokens, not cookies, so credentials can be false.
// Allow any origin to avoid deployment-origin mismatches; tighten later if needed.
const corsOptions = {
  origin: true, // reflect request origin
  credentials: false, // no cookies used
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Vilva Greenhouse API',
    endpoints: {
      health: '/api/health',
      uploads: '/uploads'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Authentication middleware
const { requireAuth, requireAdmin } = require('./middleware/auth');

// Public API routes (no authentication required)
app.use('/api/auth', require('./routes/auth')); // Login, register, etc.
app.use('/api/public', require('./routes/public')); // Public order form endpoint

// Protected admin-only routes
app.use('/api/greenhouses', requireAuth, requireAdmin, require('./routes/greenhouses'));
app.use('/api/crops', requireAuth, requireAdmin, require('./routes/crops'));
app.use('/api/activities', requireAuth, requireAdmin, require('./routes/activities'));
app.use('/api/sales', requireAuth, requireAdmin, require('./routes/sales'));
app.use('/api/customers', requireAuth, requireAdmin, require('./routes/customers'));
app.use('/api/harvests', requireAuth, requireAdmin, require('./routes/harvests'));
app.use('/api/admin', requireAuth, requireAdmin, require('./routes/admin'));

// 404 handler
app.use((req, res, next) => {
	res.status(404).json({ error: 'Not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	console.error(err);
	res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
	console.log(`API listening on http://localhost:${PORT}`);
});

