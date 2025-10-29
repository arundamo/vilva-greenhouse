const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking database schema...\n');

db.serialize(() => {
  // Get all table names
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err);
      db.close();
      return;
    }
    
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    console.log('\n');
    
    // Get sales_orders schema if it exists
    db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='sales_orders'", (err, rows) => {
      if (err) {
        console.error('Error getting sales_orders schema:', err);
      } else if (rows.length > 0) {
        console.log('sales_orders table schema:');
        console.log(rows[0].sql);
      } else {
        console.log('sales_orders table does not exist');
      }
      
      db.close();
    });
  });
});
