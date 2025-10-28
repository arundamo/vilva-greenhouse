const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all crops with details
router.get('/', (req, res) => {
  const status = req.query.status;
  let query = `
    SELECT c.*, 
      rb.bed_name, rb.side, rb.greenhouse_id,
      g.name as greenhouse_name,
      sv.name as variety_name, sv.days_to_harvest
    FROM crops c
    JOIN raised_beds rb ON c.raised_bed_id = rb.id
    JOIN greenhouses g ON rb.greenhouse_id = g.id
    JOIN spinach_varieties sv ON c.variety_id = sv.id
  `;
  const params = [];
  
  if (status) {
    query += ' WHERE c.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY c.sowing_date DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single crop with activities
router.get('/:id', (req, res) => {
  db.get(`
    SELECT c.*, 
      rb.bed_name, rb.side,
      g.name as greenhouse_name,
      sv.name as variety_name, sv.days_to_harvest
    FROM crops c
    JOIN raised_beds rb ON c.raised_bed_id = rb.id
    JOIN greenhouses g ON rb.greenhouse_id = g.id
    JOIN spinach_varieties sv ON c.variety_id = sv.id
    WHERE c.id = ?
  `, [req.params.id], (err, crop) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!crop) return res.status(404).json({ error: 'Crop not found' });
    
    // Get activities for this crop
    db.all(
      'SELECT * FROM daily_activities WHERE crop_id = ? ORDER BY activity_date DESC',
      [req.params.id],
      (err, activities) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ...crop, activities });
      }
    );
  });
});

// Create new crop
router.post('/', (req, res) => {
  const { raised_bed_id, variety_id, sowing_date, expected_harvest_date, quantity_sowed, notes } = req.body;
  
  
  db.run(
    'INSERT INTO crops (raised_bed_id, variety_id, sowing_date, expected_harvest_date, quantity_sowed, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [raised_bed_id, variety_id, sowing_date, expected_harvest_date, quantity_sowed, notes, 'growing'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Crop created' });
    }
  );
});

// Update crop status (harvest, etc)
router.patch('/:id', (req, res) => {
  const { 
    raised_bed_id, 
    variety_id, 
    sowing_date, 
    expected_harvest_date, 
    quantity_sowed, 
    notes,
    status, 
    actual_harvest_date, 
    quantity_harvested 
  } = req.body;
  
  // Get current crop to check if bed is changing
  db.get('SELECT raised_bed_id FROM crops WHERE id = ?', [req.params.id], (err, currentCrop) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!currentCrop) return res.status(404).json({ error: 'Crop not found' });
    
    // If bed is changing, free the old bed and occupy the new one
    if (raised_bed_id && raised_bed_id !== currentCrop.raised_bed_id) {
      db.run('UPDATE raised_beds SET status = ? WHERE id = ?', ['available', currentCrop.raised_bed_id]);
      db.run('UPDATE raised_beds SET status = ? WHERE id = ?', ['occupied', raised_bed_id]);
    }
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    
    if (raised_bed_id !== undefined) { updates.push('raised_bed_id = ?'); params.push(raised_bed_id); }
    if (variety_id !== undefined) { updates.push('variety_id = ?'); params.push(variety_id); }
    if (sowing_date !== undefined) { updates.push('sowing_date = ?'); params.push(sowing_date); }
    if (expected_harvest_date !== undefined) { updates.push('expected_harvest_date = ?'); params.push(expected_harvest_date); }
    if (quantity_sowed !== undefined) { updates.push('quantity_sowed = ?'); params.push(quantity_sowed); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (actual_harvest_date !== undefined) { updates.push('actual_harvest_date = ?'); params.push(actual_harvest_date); }
    if (quantity_harvested !== undefined) { updates.push('quantity_harvested = ?'); params.push(quantity_harvested); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(req.params.id);
    
    db.run(
      `UPDATE crops SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Crop not found' });
        
        // If harvested or sold, update bed status
        if (status === 'harvested' || status === 'sold') {
          db.run('UPDATE raised_beds SET status = ? WHERE id = (SELECT raised_bed_id FROM crops WHERE id = ?)', 
            ['available', req.params.id]);
        }
        
        res.json({ message: 'Crop updated' });
      }
    );
  });
});

// Delete crop
router.delete('/:id', (req, res) => {
  // First get the raised_bed_id, then delete the crop and free the bed
  db.get('SELECT raised_bed_id FROM crops WHERE id = ?', [req.params.id], (err, crop) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!crop) return res.status(404).json({ error: 'Crop not found' });
    
    db.run('DELETE FROM crops WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Free up the bed
      db.run('UPDATE raised_beds SET status = ? WHERE id = ?', ['available', crop.raised_bed_id]);
      
      res.json({ message: 'Crop deleted' });
    });
  });
});

module.exports = router;
