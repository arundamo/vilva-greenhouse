const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Creating order_feedback table...');
  
  db.run(`
    CREATE TABLE IF NOT EXISTS order_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comments TEXT,
      delivery_quality INTEGER CHECK(delivery_quality >= 1 AND delivery_quality <= 5),
      product_freshness INTEGER CHECK(product_freshness >= 1 AND product_freshness <= 5),
      customer_name TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating order_feedback table:', err);
    } else {
      console.log('✓ order_feedback table created successfully');
    }
  });

  // Create index for faster lookups
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_feedback_order_id ON order_feedback(order_id)
  `, (err) => {
    if (err) {
      console.error('Error creating index:', err);
    } else {
      console.log('✓ Index created successfully');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Migration completed successfully!');
  }
});
