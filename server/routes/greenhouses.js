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

// Configure raised bed count (creates missing beds only; does not delete existing)
router.post('/beds/configure', (req, res) => {
  const { greenhouse_id, beds_per_side, area_sqft } = req.body;
  const bedsPerSide = parseInt(beds_per_side, 10);
  const areaSqft = area_sqft !== undefined ? parseFloat(area_sqft) : 32.0;

  if (!Number.isInteger(bedsPerSide) || bedsPerSide < 1 || bedsPerSide > 200) {
    return res.status(400).json({ error: 'beds_per_side must be an integer between 1 and 200' });
  }

  if (Number.isNaN(areaSqft) || areaSqft <= 0) {
    return res.status(400).json({ error: 'area_sqft must be a positive number' });
  }

  const params = [];
  let greenhouseQuery = 'SELECT id, name FROM greenhouses';

  if (greenhouse_id !== undefined && greenhouse_id !== null && greenhouse_id !== '') {
    greenhouseQuery += ' WHERE id = ?';
    params.push(greenhouse_id);
  }

  db.all(greenhouseQuery, params, (err, greenhouses) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!greenhouses || greenhouses.length === 0) {
      return res.status(404).json({ error: 'No greenhouse found for the given selection' });
    }

    const summary = [];
    let totalAdded = 0;
    let processed = 0;

    const finishIfDone = () => {
      processed += 1;
      if (processed === greenhouses.length) {
        res.json({
          message: 'Bed configuration applied successfully',
          beds_per_side: bedsPerSide,
          area_sqft: areaSqft,
          total_added: totalAdded,
          greenhouses: summary,
        });
      }
    };

    greenhouses.forEach((greenhouse) => {
      db.all(
        'SELECT bed_name FROM raised_beds WHERE greenhouse_id = ?',
        [greenhouse.id],
        (bedsErr, existingBeds) => {
          if (bedsErr) return res.status(500).json({ error: bedsErr.message });

          const existing = new Set((existingBeds || []).map((bed) => bed.bed_name));
          const missingBeds = [];

          for (let i = 1; i <= bedsPerSide; i += 1) {
            const leftName = `L${i}`;
            const rightName = `R${i}`;

            if (!existing.has(leftName)) {
              missingBeds.push({ bed_name: leftName, side: 'Left' });
            }
            if (!existing.has(rightName)) {
              missingBeds.push({ bed_name: rightName, side: 'Right' });
            }
          }

          if (missingBeds.length === 0) {
            summary.push({
              greenhouse_id: greenhouse.id,
              greenhouse_name: greenhouse.name,
              added_beds: 0,
              final_total_beds: existing.size,
            });
            return finishIfDone();
          }

          let inserted = 0;
          const stmt = db.prepare(
            'INSERT INTO raised_beds (greenhouse_id, bed_name, side, area_sqft, status) VALUES (?, ?, ?, ?, ?)',
          );

          missingBeds.forEach((bed) => {
            stmt.run([greenhouse.id, bed.bed_name, bed.side, areaSqft, 'available'], (insertErr) => {
              if (insertErr) {
                console.error('Error adding bed', greenhouse.name, bed.bed_name, insertErr.message);
              }

              inserted += 1;
              if (inserted === missingBeds.length) {
                stmt.finalize();
                totalAdded += missingBeds.length;

                summary.push({
                  greenhouse_id: greenhouse.id,
                  greenhouse_name: greenhouse.name,
                  added_beds: missingBeds.length,
                  final_total_beds: existing.size + missingBeds.length,
                });

                finishIfDone();
              }
            });
          });
        },
      );
    });
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
