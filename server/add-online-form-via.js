const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding "online_form" to requested_via CHECK constraint...');

db.serialize(() => {
  // Check if sales_orders_new already exists and drop it
  db.run('DROP TABLE IF EXISTS sales_orders_new', (err) => {
    if (err) {
      console.error('Error dropping sales_orders_new:', err);
      db.close();
      return;
    }
    
    // Create new table with updated constraint
    db.run(`
      CREATE TABLE sales_orders_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      order_date DATE NOT NULL,
      requested_via TEXT DEFAULT 'whatsapp' CHECK(requested_via IN ('whatsapp', 'phone', 'in-person', 'online_form')),
      total_amount REAL,
      delivery_date DATE,
      delivery_address TEXT,
      delivery_status TEXT DEFAULT 'pending' CHECK(delivery_status IN ('pending', 'packed', 'delivered', 'cancelled', 'unconfirmed')),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'partial')),
      payment_method TEXT CHECK(payment_method IN ('cash', 'online', 'upi', 'bank_transfer', 'card')),
      payment_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating new table:', err);
      db.close();
      return;
    }
    
    console.log('Created new table with updated constraint');
    
    // Copy data from old table
    db.run(`
      INSERT INTO sales_orders_new (id, customer_id, order_date, requested_via, total_amount, 
                                     delivery_date, delivery_address, delivery_status, 
                                     payment_status, payment_method, payment_date, notes, created_at)
      SELECT id, customer_id, order_date, requested_via, total_amount,
             delivery_date, delivery_address, delivery_status,
             payment_status, payment_method, payment_date, notes, created_at
      FROM sales_orders
    `, (err) => {
      if (err) {
        console.error('Error copying data:', err);
        db.close();
        return;
      }
      
      console.log('Copied all data from old table');
      
      // Drop old table
      db.run('DROP TABLE sales_orders', (err) => {
        if (err) {
          console.error('Error dropping old table:', err);
          db.close();
          return;
        }
        
        console.log('Dropped old table');
        
        // Rename new table
        db.run('ALTER TABLE sales_orders_new RENAME TO sales_orders', (err) => {
          if (err) {
            console.error('Error renaming table:', err);
            db.close();
            return;
          }
          
          console.log('Renamed new table to sales_orders');
          console.log('✓ Migration completed successfully!');
          console.log('✓ "online_form" is now an allowed value for requested_via');
          console.log('✓ "unconfirmed" is now an allowed value for delivery_status');
          
          db.close();
        });
      });
    });
  });
  });
});
