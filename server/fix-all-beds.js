const db = require('./database');

// Find all beds that are marked occupied but have no active crops
db.all(`
  SELECT rb.id, rb.bed_name, rb.status, g.name as greenhouse
  FROM raised_beds rb 
  JOIN greenhouses g ON rb.greenhouse_id = g.id 
  WHERE rb.status = 'occupied'
`, [], (err, beds) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log(`Found ${beds.length} beds marked as occupied`);
  
  let checked = 0;
  let fixed = 0;
  
  beds.forEach((bed) => {
    db.all(`
      SELECT COUNT(*) as count 
      FROM crops 
      WHERE raised_bed_id = ? AND status IN ('growing', 'ready')
    `, [bed.id], (err, result) => {
      if (err) {
        console.error('Error checking bed:', err);
      } else {
        const cropCount = result[0].count;
        console.log(`${bed.greenhouse} ${bed.bed_name}: ${cropCount} active crops`);
        
        if (cropCount === 0) {
          // No active crops, mark as available
          db.run('UPDATE raised_beds SET status = ? WHERE id = ?', ['available', bed.id], (err) => {
            if (err) {
              console.error(`Error updating ${bed.greenhouse} ${bed.bed_name}:`, err);
            } else {
              console.log(`  ✓ Fixed ${bed.greenhouse} ${bed.bed_name} -> available`);
              fixed++;
            }
          });
        }
      }
      
      checked++;
      if (checked === beds.length) {
        setTimeout(() => {
          console.log(`\nChecked ${checked} beds, fixed ${fixed} beds`);
          db.close();
          process.exit(0);
        }, 500);
      }
    });
  });
  
  if (beds.length === 0) {
    console.log('No occupied beds found');
    db.close();
    process.exit(0);
  }
});
