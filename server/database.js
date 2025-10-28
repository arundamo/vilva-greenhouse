const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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
});

module.exports = db;
