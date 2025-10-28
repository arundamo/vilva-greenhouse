const express = require('express');
const router = express.Router();
const db = require('../database');

// Get activities (optionally filter by crop_id or date range)
router.get('/', (req, res) => {
  const { crop_id, from_date, to_date } = req.query;
  let query = `
    SELECT da.*, 
      c.id as crop_id,
      rb.bed_name,
      g.name as greenhouse_name,
      sv.name as variety_name
    FROM daily_activities da
    JOIN crops c ON da.crop_id = c.id
    JOIN raised_beds rb ON c.raised_bed_id = rb.id
    JOIN greenhouses g ON rb.greenhouse_id = g.id
    JOIN spinach_varieties sv ON c.variety_id = sv.id
    WHERE 1=1
  `;
  const params = [];
  
  if (crop_id) {
    query += ' AND da.crop_id = ?';
    params.push(crop_id);
  }
  if (from_date) {
    query += ' AND da.activity_date >= ?';
    params.push(from_date);
  }
  if (to_date) {
    query += ' AND da.activity_date <= ?';
    params.push(to_date);
  }
  
  query += ' ORDER BY da.activity_date DESC, da.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add activity
router.post('/', (req, res) => {
  const { crop_id, activity_date, activity_type, description, quantity, notes } = req.body;
  
  db.run(
    'INSERT INTO daily_activities (crop_id, activity_date, activity_type, description, quantity, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [crop_id, activity_date, activity_type, description, quantity, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Activity logged' });
    }
  );
});

// Delete activity
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM daily_activities WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Activity not found' });
    res.json({ message: 'Activity deleted' });
  });
});

module.exports = router;
