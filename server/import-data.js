const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const dbPath = path.join(__dirname, 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

console.log('📥 Importing data into database...\n');

// Run migrations first to ensure schema is up to date
console.log('🔧 Running database migrations...\n');
try {
  execSync('node server/add-online-form-via.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  execSync('node server/add-variety-prices.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✓ Migrations completed\n');
} catch (err) {
  console.log('⚠️  Migrations may have already run or failed:', err.message);
  console.log('Continuing with import...\n');
}

// Read the exported JSON file
const dataPath = path.join(__dirname, 'data-export.json');

if (!fs.existsSync(dataPath)) {
  console.error('❌ data-export.json not found!');
  console.log('Please run export-data.js first to create the export file.');
  process.exit(1);
}

const exportData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
console.log(`📄 Loading data exported at: ${exportData.exported_at}\n`);

// Clear existing data (except users table to preserve admin)
const tablesToClear = [
  'sales_crop_mapping',
  'order_items',
  'sales_orders',
  'harvest_records',
  'daily_activities',
  'crops',
  'raised_beds',
  'greenhouses',
  'customers',
  'spinach_varieties'
];

db.serialize(() => {
  // Clear tables in correct order (respecting foreign keys)
  console.log('🧹 Clearing existing data...\n');
  
  tablesToClear.forEach(table => {
    db.run(`DELETE FROM ${table}`, (err) => {
      if (err) {
        console.error(`Error clearing ${table}:`, err);
      } else {
        console.log(`✓ Cleared ${table}`);
      }
    });
  });
  
  // Wait a bit for deletions to complete
  setTimeout(() => {
    console.log('\n📦 Importing data...\n');
    
    // Import in correct order (respecting foreign keys)
    const importOrder = [
      'greenhouses',
      'raised_beds',
      'spinach_varieties',
      'customers',
      'crops',
      'daily_activities',
      'harvest_records',
      'sales_orders',
      'order_items',
      'sales_crop_mapping',
      'users'
    ];
    
    importOrder.forEach(table => {
      const rows = exportData[table] || [];
      
      if (rows.length === 0) {
        console.log(`⊘ Skipping ${table} (no data)`);
        return;
      }
      
      // Special handling for users - skip if admin already exists
      if (table === 'users') {
        rows.forEach(user => {
          if (user.username === 'admin') {
            console.log(`⊘ Skipping admin user (already exists)`);
            return;
          }
          
          const columns = Object.keys(user);
          const placeholders = columns.map(() => '?').join(', ');
          const values = columns.map(col => user[col]);
          
          db.run(
            `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
            values,
            (err) => {
              if (err) {
                console.error(`Error importing user ${user.username}:`, err);
              }
            }
          );
        });
        return;
      }
      
      // Import all other tables
      rows.forEach(row => {
        // Fix any constraint violations for sales_orders
        if (table === 'sales_orders') {
          // Map old requested_via values if they don't exist in production schema
          if (row.requested_via && !['whatsapp', 'phone', 'in-person', 'online_form'].includes(row.requested_via)) {
            row.requested_via = 'whatsapp'; // default fallback
          }
          // Map old delivery_status values
          if (row.delivery_status && !['pending', 'packed', 'delivered', 'cancelled', 'unconfirmed'].includes(row.delivery_status)) {
            row.delivery_status = 'pending'; // default fallback
          }
        }
        
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => row[col]);
        
        db.run(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          values,
          (err) => {
            if (err) {
              console.error(`Error importing row in ${table}:`, err);
            }
          }
        );
      });
      
      console.log(`✓ Imported ${rows.length} rows into ${table}`);
    });
    
    setTimeout(() => {
      console.log('\n✅ Import complete!');
      console.log('\n📊 Summary:');
      console.log(`   - ${exportData.greenhouses.length} greenhouses`);
      console.log(`   - ${exportData.raised_beds.length} raised beds`);
      console.log(`   - ${exportData.spinach_varieties.length} varieties`);
      console.log(`   - ${exportData.crops.length} crops`);
      console.log(`   - ${exportData.daily_activities.length} activities`);
      console.log(`   - ${exportData.harvest_records.length} harvest records`);
      console.log(`   - ${exportData.customers.length} customers`);
      console.log(`   - ${exportData.sales_orders.length} sales orders`);
      console.log(`   - ${exportData.order_items.length} order items`);
      
      db.close();
    }, 2000);
  }, 1000);
});
