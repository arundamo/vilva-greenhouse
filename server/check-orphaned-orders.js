const db = require('./database');

console.log('Checking for orphaned orders (orders without valid customer_id)...\n');

db.all(`
  SELECT 
    so.id,
    so.order_date,
    so.delivery_date,
    so.delivery_status,
    so.total_amount,
    so.customer_id,
    COUNT(oi.id) as item_count
  FROM sales_orders so
  LEFT JOIN order_items oi ON oi.order_id = so.id
  WHERE so.customer_id IS NULL OR so.customer_id = ''
  GROUP BY so.id
  ORDER BY so.order_date DESC
`, [], (err, orders) => {
  if (err) {
    console.error('Error:', err);
    process.exit();
  }
  
  if (orders.length === 0) {
    console.log('✓ No orphaned orders found!');
    process.exit();
  }
  
  console.log(`Found ${orders.length} orphaned order(s):`);
  console.table(orders);
  
  // Get items for each orphaned order
  orders.forEach((order, index) => {
    db.all(`
      SELECT 
        oi.id,
        oi.quantity,
        oi.unit,
        sv.name as variety,
        oi.price_per_unit,
        oi.subtotal
      FROM order_items oi
      JOIN spinach_varieties sv ON oi.variety_id = sv.id
      WHERE oi.order_id = ?
    `, [order.id], (err, items) => {
      if (err) {
        console.error(`Error fetching items for order ${order.id}:`, err);
      } else {
        console.log(`\n--- Order ${order.id} items (${order.order_date}): ---`);
        console.table(items);
      }
      
      if (index === orders.length - 1) {
        console.log('\n\nRECOMMENDATION:');
        console.log('You have 3 options:');
        console.log('1. Delete orphaned orders: node server/delete-orphaned-orders.js');
        console.log('2. Assign customer manually in the database');
        console.log('3. Leave them (they won\'t affect crop demand report now)');
        process.exit();
      }
    });
  });
});
