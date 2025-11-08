const express = require('express')
const router = express.Router()
const db = require('../database')
const { requireAuth, requireAdmin } = require('../middleware/auth')

// GET /api/admin/export - Export all data as JSON (admin only)
router.get('/export', requireAuth, requireAdmin, (req, res) => {
  const exportData = {
    greenhouses: [],
    raised_beds: [],
    spinach_varieties: [],
    crops: [],
    daily_activities: [],
    harvest_records: [],
    customers: [],
    sales_orders: [],
    order_items: [],
    sales_crop_mapping: [],
    users: [],
    exported_at: new Date().toISOString()
  }

  const tables = [
    'greenhouses',
    'raised_beds',
    'spinach_varieties',
    'crops',
    'daily_activities',
    'harvest_records',
    'customers',
    'sales_orders',
    'order_items',
    'sales_crop_mapping',
    'users'
  ]

  let completed = 0
  tables.forEach(table => {
    db.all(`SELECT * FROM ${table}`,(err, rows) => {
      if (err) {
        console.error(`Export error for ${table}:`, err)
        return res.status(500).json({ error: `Failed exporting ${table}` })
      }
      exportData[table] = rows
      completed++
      if (completed === tables.length) {
        const filename = `data-export-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.status(200).send(JSON.stringify(exportData, null, 2))
      }
    })
  })
})

// GET /api/admin/settings - Get all notification settings
router.get('/settings', requireAuth, requireAdmin, (req, res) => {
  db.all('SELECT * FROM notification_settings', (err, rows) => {
    if (err) {
      console.error('Error fetching settings:', err);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
    
    // Convert to object format
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    res.json(settings);
  });
});

// POST /api/admin/settings - Update notification settings
router.post('/settings', requireAuth, requireAdmin, (req, res) => {
  const settings = req.body;
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings data' });
  }
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO notification_settings (setting_key, setting_value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  
  let updated = 0;
  const keys = Object.keys(settings);
  
  if (keys.length === 0) {
    return res.json({ message: 'No settings to update' });
  }
  
  keys.forEach((key, index) => {
    stmt.run([key, String(settings[key])], (err) => {
      if (err) {
        console.error(`Error updating setting ${key}:`, err);
      }
      updated++;
      
      if (updated === keys.length) {
        stmt.finalize();
        res.json({ message: 'Settings updated successfully' });
      }
    });
  });
});

// POST /api/admin/test-email - Send test email
router.post('/test-email', requireAuth, requireAdmin, async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email address required' });
  }
  
  const emailService = require('../services/emailService');
  const result = await emailService.sendTestEmail(email);
  
  if (result.success) {
    res.json({ message: 'Test email sent successfully', messageId: result.messageId });
  } else {
    res.status(500).json({ error: result.error || 'Failed to send test email' });
  }
});

module.exports = router
