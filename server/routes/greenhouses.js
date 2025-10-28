const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all greenhouses with bed counts
router.get('/', (req, res) => {
  db.all(`
    SELECT g.*, 
      (SELECT COUNT(*) FROM raised_beds WHERE greenhouse_id = g.id) as total_beds,
      (SELECT COUNT(DISTINCT c.raised_bed_id) 
       FROM crops c 
       JOIN raised_beds rb ON c.raised_bed_id = rb.id 
       WHERE rb.greenhouse_id = g.id AND c.status IN ('growing', 'ready')) as occupied_beds
    FROM greenhouses g
    ORDER BY g.name
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get greenhouse details with all beds
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM greenhouses WHERE id = ?', [req.params.id], (err, greenhouse) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!greenhouse) return res.status(404).json({ error: 'Greenhouse not found' });
    
    // Get all beds for this greenhouse
    db.all(`SELECT * FROM raised_beds WHERE greenhouse_id = ? ORDER BY side, bed_name`, [req.params.id], (err, beds) => {
      if (err) return res.status(500).json({ error: err.message });
      // For each bed, get all crops
      const bedIds = beds.map(b => b.id)
      if (bedIds.length === 0) return res.json({ ...greenhouse, beds })
      db.all(`SELECT c.*, sv.name as variety_name FROM crops c JOIN spinach_varieties sv ON c.variety_id = sv.id WHERE c.raised_bed_id IN (${bedIds.map(() => '?').join(',')}) AND c.status IN ('growing', 'ready')`, bedIds, (err, crops) => {
        if (err) return res.status(500).json({ error: err.message });
        // Attach crops to beds
        const bedsWithCrops = beds.map(bed => ({
          ...bed,
          crops: crops.filter(c => c.raised_bed_id === bed.id)
        }))
        res.json({ ...greenhouse, beds: bedsWithCrops })
      })
    })
  });
});

module.exports = router;
