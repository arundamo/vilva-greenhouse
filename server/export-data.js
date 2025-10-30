const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'vilva-farm.db');
const db = new sqlite3.Database(dbPath);

console.log('📦 Exporting data from local database...\n');

const exportData = {
  greenhouses: [],
  raised_beds: [],
  spinach_varieties: [],
  crops: [],
  daily_activities: [],
  harvest_records: [],
  customers: [],
  sales_orders: [],
  order_items: [],
  sales_crop_mapping: [],
  users: [],
  // sessions excluded - they're temporary
  exported_at: new Date().toISOString()
};

const tables = [
  'greenhouses',
  'raised_beds',
  'spinach_varieties',
  'crops',
  'daily_activities',
  'harvest_records',
  'customers',
  'sales_orders',
  'order_items',
  'sales_crop_mapping',
  'users'
];

let completed = 0;

tables.forEach(table => {
  db.all(`SELECT * FROM ${table}`, (err, rows) => {
    if (err) {
      console.error(`❌ Error exporting ${table}:`, err);
    } else {
      exportData[table] = rows;
      console.log(`✓ Exported ${rows.length} rows from ${table}`);
    }
    
    completed++;
    
    if (completed === tables.length) {
      // Write to JSON file
      const outputPath = path.join(__dirname, 'data-export.json');
      fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
      console.log(`\n✅ Export complete!`);
      console.log(`📄 Data saved to: ${outputPath}`);
      console.log(`\n📊 Summary:`);
      console.log(`   - ${exportData.greenhouses.length} greenhouses`);
      console.log(`   - ${exportData.raised_beds.length} raised beds`);
      console.log(`   - ${exportData.spinach_varieties.length} varieties`);
      console.log(`   - ${exportData.crops.length} crops`);
      console.log(`   - ${exportData.daily_activities.length} activities`);
      console.log(`   - ${exportData.harvest_records.length} harvest records`);
      console.log(`   - ${exportData.customers.length} customers`);
      console.log(`   - ${exportData.sales_orders.length} sales orders`);
      console.log(`   - ${exportData.order_items.length} order items`);
      console.log(`   - ${exportData.users.length} users`);
      
      db.close();
    }
  });
});
