require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware - Allow both 5173 and 5174 for Vite
app.use(cors({ 
  origin: [CLIENT_ORIGIN, 'http://localhost:5174'], 
  credentials: true 
}));
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

// API routes
app.use('/api/greenhouses', require('./routes/greenhouses'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/harvests', require('./routes/harvests'));

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

