const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

console.log('Migrating sales_orders to header-only schema (multi-item orders)...');

db.serialize(() => {
  db.run('PRAGMA foreign_keys=off');

  // Create new table with desired schema
  db.run(`CREATE TABLE IF NOT EXISTS sales_orders_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    requested_via TEXT DEFAULT 'whatsapp' CHECK(requested_via IN ('whatsapp', 'phone', 'in-person')),
    total_amount REAL,
    delivery_date DATE,
    delivery_address TEXT,
    delivery_status TEXT DEFAULT 'pending' CHECK(delivery_status IN ('pending', 'packed', 'delivered', 'cancelled')),
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'partial')),
    payment_method TEXT CHECK(payment_method IN ('cash', 'online', 'upi', 'bank_transfer', 'card')),
    payment_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`);

  // Copy data from old table, mapping requested_via 'direct' -> 'in-person'
  db.run(`INSERT INTO sales_orders_new (
      id, customer_id, order_date, requested_via, total_amount, delivery_date,
      delivery_address, delivery_status, payment_status, payment_method, payment_date,
      notes, created_at
    )
    SELECT 
      id, customer_id, order_date,
      CASE requested_via WHEN 'direct' THEN 'in-person' ELSE requested_via END AS requested_via,
      total_amount, delivery_date, delivery_address, delivery_status, payment_status, payment_method, payment_date,
      notes, created_at
    FROM sales_orders`, (err) => {
      if (err) {
        console.error('Error copying data to sales_orders_new:', err.message);
        process.exit(1);
      }

      // Drop old table
      db.run('DROP TABLE sales_orders', (err) => {
        if (err) {
          console.error('Error dropping old sales_orders:', err.message);
          process.exit(1);
        }

        // Rename new table
        db.run('ALTER TABLE sales_orders_new RENAME TO sales_orders', (err) => {
          if (err) {
            console.error('Error renaming sales_orders_new:', err.message);
            process.exit(1);
          }

          db.run('PRAGMA foreign_keys=on');
          console.log('✓ sales_orders migrated to header-only schema');
          console.log('Migration complete.');
          db.close();
        });
      });
    });
});
