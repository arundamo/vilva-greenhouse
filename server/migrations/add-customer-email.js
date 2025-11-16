const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking customers table for email column...');

db.serialize(() => {
  // Check if email column exists
  db.all("PRAGMA table_info(customers)", [], (err, columns) => {
    if (err) {
      console.error('Error checking table:', err);
      db.close();
      return;
    }

    const hasEmail = columns.some(col => col.name === 'email');

    if (hasEmail) {
      console.log('✓ Email column already exists in customers table');
      db.close();
      return;
    }

    console.log('Adding email column to customers table...');
    
    db.run(`ALTER TABLE customers ADD COLUMN email TEXT`, (err) => {
      if (err) {
        console.error('❌ Error adding email column:', err.message);
      } else {
        console.log('✓ Email column added successfully to customers table');
      }
      db.close();
    });
  });
});
