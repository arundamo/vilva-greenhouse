const db = require('./database');

console.log('Checking order 23 details...\n');

db.get(`
  SELECT 
    so.*,
    c.name as customer_name
  FROM sales_orders so
  JOIN customers c ON so.customer_id = c.id
  WHERE so.id = 23
`, [], (err, order) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Order 23 details:');
    console.table([order]);
    
    // Get all items in order 23
    db.all(`
      SELECT 
        oi.*,
        sv.name as variety_name
      FROM order_items oi
      JOIN spinach_varieties sv ON oi.variety_id = sv.id
      WHERE oi.order_id = 23
    `, [], (err, items) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('\n\nOrder 23 items:');
        console.table(items);
      }
      process.exit();
    });
  }
});
