const express = require('express')
const router = express.Router()
const db = require('../database')

// GET /api/admin/export - Export all data as JSON (admin only)
router.get('/export', (req, res) => {
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

module.exports = router
