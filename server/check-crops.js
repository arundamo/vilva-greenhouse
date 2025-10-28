const db = require('./database');

// Check what crops are showing for G2, R1
db.all(`
  SELECT c.id, c.status, sv.name as variety, c.sowing_date, c.actual_harvest_date
  FROM crops c
  JOIN spinach_varieties sv ON c.variety_id = sv.id
  JOIN raised_beds rb ON c.raised_bed_id = rb.id
  JOIN greenhouses g ON rb.greenhouse_id = g.id
  WHERE g.name = 'G2' AND rb.bed_name = 'R1'
  ORDER BY c.id
`, [], (err, crops) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('All crops in G2, R1:');
  console.log(JSON.stringify(crops, null, 2));
  
  console.log('\n\nCrops that SHOULD show (growing/ready):');
  const visible = crops.filter(c => c.status === 'growing' || c.status === 'ready');
  console.log(JSON.stringify(visible, null, 2));
  
  console.log('\n\nCrops that should NOT show (harvested/sold):');
  const hidden = crops.filter(c => c.status === 'harvested' || c.status === 'sold');
  console.log(JSON.stringify(hidden, null, 2));
  
  db.close();
  process.exit(0);
});
