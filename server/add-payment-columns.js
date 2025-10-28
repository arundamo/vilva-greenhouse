const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding payment_method and payment_date columns to sales_orders table...');

db.serialize(() => {
  // Check if columns exist
  db.all("PRAGMA table_info(sales_orders)", (err, columns) => {
    if (err) {
      console.error('Error checking table:', err);
      db.close();
      return;
    }

    const hasPaymentMethod = columns.some(col => col.name === 'payment_method');
    const hasPaymentDate = columns.some(col => col.name === 'payment_date');

    let pendingOperations = 0;

    const checkComplete = () => {
      pendingOperations--;
      if (pendingOperations === 0) {
        console.log('\nDatabase migration completed!');
        db.close();
      }
    };

    if (!hasPaymentMethod) {
      pendingOperations++;
      db.run('ALTER TABLE sales_orders ADD COLUMN payment_method TEXT', (err) => {
        if (err) {
          console.error('Error adding payment_method:', err);
        } else {
          console.log('✓ Added payment_method column');
        }
        checkComplete();
      });
    } else {
      console.log('✓ payment_method column already exists');
    }

    if (!hasPaymentDate) {
      pendingOperations++;
      db.run('ALTER TABLE sales_orders ADD COLUMN payment_date DATE', (err) => {
        if (err) {
          console.error('Error adding payment_date:', err);
        } else {
          console.log('✓ Added payment_date column');
        }
        checkComplete();
      });
    } else {
      console.log('✓ payment_date column already exists');
    }

    if (pendingOperations === 0) {
      console.log('\nAll columns already exist. No migration needed.');
      db.close();
    }
  });
});
