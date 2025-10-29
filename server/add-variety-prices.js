const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding price columns to spinach_varieties table...\n');

db.serialize(() => {
  // Check if columns already exist
  db.all("PRAGMA table_info(spinach_varieties)", (err, columns) => {
    if (err) {
      console.error('Error getting table info:', err);
      db.close();
      return;
    }
    
    const hasPriceBunch = columns.some(col => col.name === 'price_per_bunch');
    const hasPriceKg = columns.some(col => col.name === 'price_per_kg');
    const hasPriceGram = columns.some(col => col.name === 'price_per_100g');
    
    if (hasPriceBunch && hasPriceKg && hasPriceGram) {
      console.log('✓ Price columns already exist. No migration needed.');
      db.close();
      return;
    }
    
    // Add price columns
    const queries = [];
    
    if (!hasPriceBunch) {
      queries.push(
        new Promise((resolve, reject) => {
          db.run('ALTER TABLE spinach_varieties ADD COLUMN price_per_bunch REAL DEFAULT 0', (err) => {
            if (err) reject(err);
            else {
              console.log('✓ Added price_per_bunch column');
              resolve();
            }
          });
        })
      );
    }
    
    if (!hasPriceKg) {
      queries.push(
        new Promise((resolve, reject) => {
          db.run('ALTER TABLE spinach_varieties ADD COLUMN price_per_kg REAL DEFAULT 0', (err) => {
            if (err) reject(err);
            else {
              console.log('✓ Added price_per_kg column');
              resolve();
            }
          });
        })
      );
    }
    
    if (!hasPriceGram) {
      queries.push(
        new Promise((resolve, reject) => {
          db.run('ALTER TABLE spinach_varieties ADD COLUMN price_per_100g REAL DEFAULT 0', (err) => {
            if (err) reject(err);
            else {
              console.log('✓ Added price_per_100g column');
              resolve();
            }
          });
        })
      );
    }
    
    Promise.all(queries)
      .then(() => {
        console.log('\n✓ Migration completed successfully!');
        console.log('✓ You can now set prices for each spinach variety');
        db.close();
      })
      .catch((err) => {
        console.error('Error during migration:', err);
        db.close();
      });
  });
});
