const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

console.log('Creating order_items table for multi-item orders...');

db.serialize(() => {
  // Create order_items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    variety_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT DEFAULT 'bunches',
    price_per_unit REAL,
    subtotal REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (variety_id) REFERENCES spinach_varieties(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating order_items table:', err);
    } else {
      console.log('✓ Created order_items table');
    }
  });

  // Migrate existing orders to order_items
  db.all('SELECT * FROM sales_orders WHERE variety_id IS NOT NULL', [], (err, orders) => {
    if (err) {
      console.error('Error reading sales_orders:', err);
      db.close();
      return;
    }

    if (orders.length === 0) {
      console.log('No existing orders to migrate');
      db.close();
      return;
    }

    let migratedCount = 0;
    const totalOrders = orders.length;

    orders.forEach((order, index) => {
      db.run(
        `INSERT INTO order_items (order_id, variety_id, quantity, unit, price_per_unit, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [order.id, order.variety_id, order.quantity, order.unit, order.price_per_unit, order.total_amount],
        (err) => {
          if (err) {
            console.error(`Error migrating order ${order.id}:`, err);
          } else {
            migratedCount++;
          }

          if (index === totalOrders - 1) {
            console.log(`✓ Migrated ${migratedCount} orders to order_items`);
            console.log('\nDatabase migration completed!');
            db.close();
          }
        }
      );
    });
  });
});
