const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all customers
router.get('/', (req, res) => {
  db.all('SELECT * FROM customers ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create customer
router.post('/', (req, res) => {
  const { name, phone, whatsapp, address, notes } = req.body;
  
  db.run(
    'INSERT INTO customers (name, phone, whatsapp, address, notes) VALUES (?, ?, ?, ?, ?)',
    [name, phone, whatsapp, address, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Customer created' });
    }
  );
});

// Update customer
router.patch('/:id', (req, res) => {
  const { name, phone, whatsapp, address, notes } = req.body;
  const updates = [];
  const params = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    params.push(phone);
  }
  if (whatsapp !== undefined) {
    updates.push('whatsapp = ?');
    params.push(whatsapp);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    params.push(address);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  params.push(req.params.id);
  
  db.run(
    `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Customer not found' });
      res.json({ message: 'Customer updated' });
    }
  );
});

// Get spinach varieties
router.get('/varieties', (req, res) => {
  db.all('SELECT * FROM spinach_varieties ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add spinach variety
router.post('/varieties', (req, res) => {
  const { name, days_to_harvest } = req.body;
  
  db.run(
    'INSERT INTO spinach_varieties (name, days_to_harvest) VALUES (?, ?)',
    [name, days_to_harvest],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Variety added' });
    }
  );
});

// Delete spinach variety
router.delete('/varieties/:id', (req, res) => {
  db.run('DELETE FROM spinach_varieties WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Variety not found' });
    res.json({ message: 'Variety deleted' });
  });
});

module.exports = router;
