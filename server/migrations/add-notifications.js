const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../vilva-farm.db');
const db = new sqlite3.Database(dbPath);

console.log('Running notification system migrations...');

db.serialize(() => {
  // Add email column to customers table if it doesn't exist
  db.run(`
    ALTER TABLE customers 
    ADD COLUMN email TEXT
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding email column to customers:', err);
    } else {
      console.log('✓ Added email column to customers table');
    }
  });

  // Create notification_settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating notification_settings table:', err);
    } else {
      console.log('✓ Created notification_settings table');
    }
  });

  // Insert default notification settings
  const defaultSettings = [
    ['email_enabled', 'true'],
    ['admin_email', process.env.ADMIN_EMAIL || ''],
    ['notify_new_orders', 'true'],
    ['notify_order_status', 'true'],
    ['notify_payments', 'true'],
    ['whatsapp_enabled', 'true'],
    ['whatsapp_number', '']
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO notification_settings (setting_key, setting_value)
    VALUES (?, ?)
  `);

  defaultSettings.forEach(([key, value]) => {
    stmt.run(key, value, (err) => {
      if (err) {
        console.error(`Error inserting setting ${key}:`, err);
      }
    });
  });

  stmt.finalize(() => {
    console.log('✓ Inserted default notification settings');
  });

  // Create notification_log table (optional - for tracking sent notifications)
  db.run(`
    CREATE TABLE IF NOT EXISTS notification_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notification_type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      order_id INTEGER,
      status TEXT NOT NULL,
      message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES sales_orders(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating notification_log table:', err);
    } else {
      console.log('✓ Created notification_log table');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set EMAIL_USER, EMAIL_PASSWORD, ADMIN_EMAIL in .env file');
    console.log('2. Update customer emails in the Settings page');
    console.log('3. Configure notification preferences in Settings');
  }
});
