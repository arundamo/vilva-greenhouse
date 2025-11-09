const db = require('./database');

console.log('Checking for duplicate Methi order items...\n');

// Get detailed breakdown
db.all(`
  SELECT 
    so.id as order_id,
    so.order_date,
    so.delivery_status,
    c.name as customer,
    oi.id as item_id,
    oi.quantity,
    oi.unit,
    sv.name as variety
  FROM order_items oi
  JOIN sales_orders so ON oi.order_id = so.id
  JOIN spinach_varieties sv ON oi.variety_id = sv.id
  JOIN customers c ON so.customer_id = c.id
  WHERE sv.name = 'Methi'
    AND so.delivery_status IN ('pending', 'packed', 'unconfirmed')
  ORDER BY so.id, oi.id
`, [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('All Methi order items (pending/packed/unconfirmed):');
    console.table(rows);
    
    console.log('\n\nSummary:');
    console.log(`Total rows: ${rows.length}`);
    console.log(`Unique orders: ${new Set(rows.map(r => r.order_id)).size}`);
    console.log(`Total quantity: ${rows.reduce((sum, r) => sum + r.quantity, 0)}`);
  }
  process.exit();
});
