const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all harvest records for a crop
router.get('/crop/:cropId', (req, res) => {
  db.all(
    'SELECT * FROM harvest_records WHERE crop_id = ? ORDER BY harvest_date DESC',
    [req.params.cropId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Add a harvest record
router.post('/', (req, res) => {
  const { crop_id, harvest_date, quantity_harvested, unit, notes } = req.body;
  
  db.run(
    'INSERT INTO harvest_records (crop_id, harvest_date, quantity_harvested, unit, notes) VALUES (?, ?, ?, ?, ?)',
    [crop_id, harvest_date, quantity_harvested, unit || 'bunches', notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Harvest record added' });
    }
  );
});

// Update a harvest record
router.patch('/:id', (req, res) => {
  const { harvest_date, quantity_harvested, unit, notes } = req.body;
  
  const updates = [];
  const params = [];
  
  if (harvest_date !== undefined) { updates.push('harvest_date = ?'); params.push(harvest_date); }
  if (quantity_harvested !== undefined) { updates.push('quantity_harvested = ?'); params.push(quantity_harvested); }
  if (unit !== undefined) { updates.push('unit = ?'); params.push(unit); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  params.push(req.params.id);
  
  db.run(
    `UPDATE harvest_records SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Harvest record not found' });
      res.json({ message: 'Harvest record updated' });
    }
  );
});

// Delete a harvest record
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM harvest_records WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Harvest record not found' });
    res.json({ message: 'Harvest record deleted' });
  });
});

module.exports = router;
