const db = require('./database');

db.all(`
  SELECT c.id, c.status, sv.name as variety, rb.bed_name, g.name as greenhouse, 
         c.actual_harvest_date, c.sowing_date
  FROM crops c 
  JOIN spinach_varieties sv ON c.variety_id = sv.id 
  JOIN raised_beds rb ON c.raised_bed_id = rb.id 
  JOIN greenhouses g ON rb.greenhouse_id = g.id 
  ORDER BY g.name, rb.bed_name, c.id
`, [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('All crops in database:\n');
  rows.forEach(crop => {
    console.log(`${crop.greenhouse} ${crop.bed_name} - ${crop.variety}`);
    console.log(`  ID: ${crop.id}, Status: ${crop.status}, Harvested: ${crop.actual_harvest_date || 'No'}`);
    console.log('');
  });
  
  console.log('\nSummary:');
  console.log(`Total crops: ${rows.length}`);
  console.log(`Growing: ${rows.filter(c => c.status === 'growing').length}`);
  console.log(`Harvested: ${rows.filter(c => c.status === 'harvested').length}`);
  console.log(`Sold: ${rows.filter(c => c.status === 'sold').length}`);
  
  db.close();
  process.exit(0);
});
