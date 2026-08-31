const express = require('express')
const router = express.Router()
const db = require('../database')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const emailService = require('../services/emailService')

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

// GET /api/admin/export/:type - Export selected module as JSON (admin only)
router.get('/export/:type', requireAuth, requireAdmin, (req, res) => {
  const exportType = String(req.params.type || '').toLowerCase()
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

  if (!['sales', 'customers', 'crops'].includes(exportType)) {
    return res.status(400).json({ error: 'Invalid export type. Supported types: sales, customers, crops' })
  }

  if (exportType === 'customers') {
    return db.all('SELECT * FROM customers ORDER BY created_at DESC', (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed exporting customers' })

      const payload = {
        type: 'customers',
        exported_at: new Date().toISOString(),
        count: (rows || []).length,
        customers: rows || [],
      }

      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="customers-export-${ts}.json"`)
      return res.status(200).send(JSON.stringify(payload, null, 2))
    })
  }

  if (exportType === 'crops') {
    const cropsQuery = `
      SELECT c.*, rb.bed_name, rb.side, g.name as greenhouse_name, sv.name as variety_name
      FROM crops c
      LEFT JOIN raised_beds rb ON c.raised_bed_id = rb.id
      LEFT JOIN greenhouses g ON rb.greenhouse_id = g.id
      LEFT JOIN spinach_varieties sv ON c.variety_id = sv.id
      ORDER BY c.created_at DESC
    `

    return db.all(cropsQuery, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed exporting crops' })

      const payload = {
        type: 'crops',
        exported_at: new Date().toISOString(),
        count: (rows || []).length,
        crops: rows || [],
      }

      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="crops-export-${ts}.json"`)
      return res.status(200).send(JSON.stringify(payload, null, 2))
    })
  }

  // sales export (with line items)
  const salesQuery = `
    SELECT so.*, c.name as customer_name, c.phone, c.whatsapp, c.email as customer_email
    FROM sales_orders so
    LEFT JOIN customers c ON so.customer_id = c.id
    ORDER BY so.order_date DESC, so.id DESC
  `

  return db.all(salesQuery, (err, salesRows) => {
    if (err) return res.status(500).json({ error: 'Failed exporting sales' })

    if (!salesRows || salesRows.length === 0) {
      const payload = {
        type: 'sales',
        exported_at: new Date().toISOString(),
        count: 0,
        sales: [],
      }

      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="sales-export-${ts}.json"`)
      return res.status(200).send(JSON.stringify(payload, null, 2))
    }

    const salesIds = salesRows.map((row) => row.id)
    const placeholders = salesIds.map(() => '?').join(',')

    const itemsQuery = `
      SELECT oi.*, sv.name as variety_name
      FROM order_items oi
      LEFT JOIN spinach_varieties sv ON oi.variety_id = sv.id
      WHERE oi.order_id IN (${placeholders})
      ORDER BY oi.order_id, oi.id
    `

    return db.all(itemsQuery, salesIds, (itemsErr, itemsRows) => {
      if (itemsErr) return res.status(500).json({ error: 'Failed exporting sales items' })

      const itemsByOrderId = {}
      ;(itemsRows || []).forEach((item) => {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = []
        itemsByOrderId[item.order_id].push(item)
      })

      const sales = salesRows.map((sale) => ({
        ...sale,
        items: itemsByOrderId[sale.id] || [],
      }))

      const payload = {
        type: 'sales',
        exported_at: new Date().toISOString(),
        count: sales.length,
        sales,
      }

      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="sales-export-${ts}.json"`)
      return res.status(200).send(JSON.stringify(payload, null, 2))
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

// GET /api/admin/contact-messages - List contact form messages
router.get('/contact-messages', requireAuth, requireAdmin, (req, res) => {
  db.all(
    `SELECT id, name, email, phone, subject, message, status, admin_reply, reply_sent_at, created_at, updated_at
     FROM contact_messages
     ORDER BY
       CASE status
         WHEN 'new' THEN 1
         WHEN 'replied' THEN 2
         ELSE 3
       END,
       created_at DESC`,
    (err, rows) => {
      if (err) {
        console.error('Error fetching contact messages:', err)
        return res.status(500).json({ error: 'Failed to fetch contact messages' })
      }
      return res.json(rows || [])
    }
  )
})

// POST /api/admin/contact-messages/:id/reply - Reply to contact form message
router.post('/contact-messages/:id/reply', requireAuth, requireAdmin, (req, res) => {
  const messageId = req.params.id
  const { reply } = req.body

  if (!reply || !String(reply).trim()) {
    return res.status(400).json({ error: 'Reply message is required' })
  }

  db.get(
    'SELECT id, name, email, subject, message FROM contact_messages WHERE id = ?',
    [messageId],
    async (err, contact) => {
      if (err) {
        console.error('Error loading contact message:', err)
        return res.status(500).json({ error: 'Failed to load contact message' })
      }

      if (!contact) {
        return res.status(404).json({ error: 'Contact message not found' })
      }

      if (!contact.email) {
        return res.status(400).json({ error: 'This contact has no email address to reply' })
      }

      const emailResult = await emailService.sendContactReply({
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        reply: String(reply).trim()
      })

      if (!emailResult.success) {
        return res.status(500).json({ error: emailResult.error || 'Failed to send reply email' })
      }

      db.run(
        `UPDATE contact_messages
         SET status = 'replied', admin_reply = ?, reply_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [String(reply).trim(), messageId],
        function(updateErr) {
          if (updateErr) {
            console.error('Error updating contact message status:', updateErr)
            return res.status(500).json({ error: 'Reply sent but failed to update message status' })
          }

          return res.json({ success: true, message: 'Reply sent successfully' })
        }
      )
    }
  )
})

module.exports = router
