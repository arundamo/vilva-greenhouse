const db = require('./database');

// Check G2, L1 bed and any crops on it
db.all(`
  SELECT rb.id, rb.bed_name, rb.status, g.name as greenhouse 
  FROM raised_beds rb 
  JOIN greenhouses g ON rb.greenhouse_id = g.id 
  WHERE g.name = 'G2' AND rb.bed_name = 'L1'
`, [], (err, beds) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('Bed info:', JSON.stringify(beds, null, 2));
  
  if (beds.length > 0) {
    const bedId = beds[0].id;
    
    // Check if there are any crops in this bed
    db.all(`
      SELECT c.id, c.status, sv.name as variety 
      FROM crops c 
      JOIN spinach_varieties sv ON c.variety_id = sv.id 
      WHERE c.raised_bed_id = ?
    `, [bedId], (err, crops) => {
      if (err) {
        console.error('Error:', err);
        process.exit(1);
      }
      
      console.log('Crops in G2, L1:', JSON.stringify(crops, null, 2));
      
      if (crops.length === 0) {
        // No crops, so set bed to available
        db.run('UPDATE raised_beds SET status = ? WHERE id = ?', ['available', bedId], (err) => {
          if (err) {
            console.error('Error updating bed:', err);
          } else {
            console.log('Successfully set G2, L1 to available');
          }
          db.close();
          process.exit(0);
        });
      } else {
        console.log('Bed has crops, not changing status');
        db.close();
        process.exit(0);
      }
    });
  } else {
    console.log('Bed not found');
    db.close();
    process.exit(0);
  }
});
