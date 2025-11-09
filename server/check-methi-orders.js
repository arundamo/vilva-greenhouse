const db = require('./database');

console.log('Checking Methi orders...\n');

// Query all Methi orders
db.all(`
  SELECT 
    so.id as order_id,
    so.order_date,
    so.delivery_status,
    c.name as customer,
    oi.quantity,
    oi.unit,
    sv.name as variety
  FROM sales_orders so
  JOIN customers c ON so.customer_id = c.id
  JOIN order_items oi ON oi.order_id = so.id
  JOIN spinach_varieties sv ON oi.variety_id = sv.id
  WHERE sv.name LIKE '%Methi%'
  ORDER BY so.order_date DESC
`, [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('All Methi orders:');
    console.table(rows);
    
    console.log('\n\nFiltered by status (pending, packed, unconfirmed):');
    const filtered = rows.filter(r => ['pending', 'packed', 'unconfirmed'].includes(r.delivery_status));
    console.table(filtered);
    
    const total = filtered.reduce((sum, r) => sum + r.quantity, 0);
    console.log(`\nTotal Methi quantity (pending/packed/unconfirmed): ${total}`);
  }
  process.exit();
});
