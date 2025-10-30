const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

// Initialize database schema for Vilva Greenhouse Farm
db.serialize(() => {
  // Greenhouses table (G1, G2, G3)
  db.run(`CREATE TABLE IF NOT EXISTS greenhouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Raised beds table (L1-L10, R1-R10 per greenhouse)
  db.run(`CREATE TABLE IF NOT EXISTS raised_beds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    greenhouse_id INTEGER NOT NULL,
    bed_name TEXT NOT NULL,
    side TEXT NOT NULL CHECK(side IN ('Left', 'Right')),
    area_sqft REAL DEFAULT 32.0,
    status TEXT DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'preparation')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id),
    UNIQUE(greenhouse_id, bed_name)
  )`);

  // Spinach varieties
  db.run(`CREATE TABLE IF NOT EXISTS spinach_varieties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    days_to_harvest INTEGER,
    price_per_bunch REAL DEFAULT 0,
    price_per_kg REAL DEFAULT 0,
    price_per_100g REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Crops table - tracks each crop sowing
  db.run(`CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raised_bed_id INTEGER NOT NULL,
    variety_id INTEGER NOT NULL,
    sowing_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    quantity_sowed TEXT,
    quantity_harvested REAL,
    unit TEXT DEFAULT 'kg',
    status TEXT DEFAULT 'growing' CHECK(status IN ('sowing', 'growing', 'ready', 'harvested', 'sold')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raised_bed_id) REFERENCES raised_beds(id),
    FOREIGN KEY (variety_id) REFERENCES spinach_varieties(id)
  )`);

  // Daily activities log
  db.run(`CREATE TABLE IF NOT EXISTS daily_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    activity_date DATE NOT NULL,
    activity_type TEXT NOT NULL CHECK(activity_type IN ('watering', 'fertilizer', 'weeding', 'pest_control', 'inspection', 'other')),
    description TEXT,
    quantity TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id)
  )`);

  // Harvest records - for crops harvested multiple times
  db.run(`CREATE TABLE IF NOT EXISTS harvest_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    harvest_date DATE NOT NULL,
    quantity_harvested REAL NOT NULL,
    unit TEXT DEFAULT 'bunches',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id)
  )`);

  // Customers table
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Sales/Orders table (order header; items in separate table)
  db.run(`CREATE TABLE IF NOT EXISTS sales_orders (
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

  // Order items table (line items per order)
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
  )`);

  // Link sales to crops (which crops were used for this sale)
  db.run(`CREATE TABLE IF NOT EXISTS sales_crop_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sales_order_id INTEGER NOT NULL,
    crop_id INTEGER NOT NULL,
    quantity_used REAL NOT NULL,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
    FOREIGN KEY (crop_id) REFERENCES crops(id)
  )`);

  // Seed initial data
  db.get('SELECT COUNT(*) as count FROM greenhouses', (err, row) => {
    if (!err && row.count === 0) {
      // Create 3 greenhouses
      db.run(`INSERT INTO greenhouses (name, description) VALUES 
        ('G1', 'Greenhouse 1'),
        ('G2', 'Greenhouse 2'),
        ('G3', 'Greenhouse 3')`);

      // Create 20 raised beds per greenhouse (L1-L10, R1-R10)
      const beds = [];
      for (let g = 1; g <= 3; g++) {
        // Left side beds (L1-L10)
        for (let i = 1; i <= 10; i++) {
          beds.push(`(${g}, 'L${i}', 'Left', 32.0, 'available')`);
        }
        // Right side beds (R1-R10)
        for (let i = 1; i <= 10; i++) {
          beds.push(`(${g}, 'R${i}', 'Right', 32.0, 'available')`);
        }
      }
      db.run(`INSERT INTO raised_beds (greenhouse_id, bed_name, side, area_sqft, status) VALUES ${beds.join(', ')}`);

      // Add spinach varieties
      db.run(`INSERT INTO spinach_varieties (name, description, days_to_harvest) VALUES 
        ('All Green', 'Popular green spinach variety', 30),
        ('Malabar Spinach', 'Climbing spinach, heat tolerant', 40),
        ('Red Stem', 'Red-stemmed spinach variety', 35),
        ('Palak', 'Indian spinach variety', 30),
        ('Baby Leaf', 'Tender baby spinach', 25)`);

      // Sample customer
      db.run(`INSERT INTO customers (name, phone, whatsapp, address) VALUES 
        ('Sample Customer', '9876543210', '9876543210', 'Chennai, Tamil Nadu')`);

      // Sample crop
      db.run(`INSERT INTO crops (raised_bed_id, variety_id, sowing_date, expected_harvest_date, quantity_sowed, status) VALUES 
        (1, 1, '2025-10-01', '2025-10-31', '500g seeds', 'growing'),
        (2, 2, '2025-10-05', '2025-11-14', '300g seeds', 'growing')`);

      // Sample activity
      db.run(`INSERT INTO daily_activities (crop_id, activity_date, activity_type, description) VALUES 
        (1, '2025-10-27', 'watering', 'Morning watering - 50L'),
        (1, '2025-10-25', 'fertilizer', 'Applied organic fertilizer')`);

      console.log('✓ Vilva Greenhouse Farm database initialized with sample data');
    }
  });

  // Ensure user management tables exist and seed default admin if missing
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'public')) DEFAULT 'public',
      full_name TEXT,
      email TEXT,
      phone TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err);
    } else {
      console.log('✓ Users table ready');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating sessions table:', err);
    } else {
      console.log('✓ Sessions table ready');
    }
  });

  // Seed default admin user if not exists
  db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (err) {
      console.error('❌ User table check error:', err);
      return;
    }
    if (!row) {
      const defaultPassword = 'admin123';
      bcrypt.hash(defaultPassword, 10, (hashErr, hash) => {
        if (hashErr) {
          console.error('❌ Error hashing default admin password:', hashErr);
          return;
        }
        db.run(
          `INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, 'admin', 'Administrator')`,
          ['admin', hash],
          (insErr) => {
            if (insErr) {
              console.error('❌ Error creating default admin user:', insErr);
            } else {
              console.log('✓ Default admin user created successfully');
            }
          }
        );
      });
    } else {
      console.log('✓ Admin user already exists');
    }
  });
});

module.exports = db;
