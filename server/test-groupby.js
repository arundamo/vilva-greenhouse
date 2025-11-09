const db = require('./database');

console.log('Testing GROUP BY behavior...\n');

// First, raw data
db.all(`
  SELECT 
    oi.id as item_id,
    so.id as order_id,
    sv.id as variety_id,
    sv.name as variety_name,
    oi.unit,
    oi.quantity,
    so.delivery_status
  FROM order_items oi
  JOIN sales_orders so ON oi.order_id = so.id
  JOIN spinach_varieties sv ON oi.variety_id = sv.id
  WHERE sv.name = 'Methi'
    AND so.delivery_status IN ('pending', 'packed', 'unconfirmed')
`, [], (err, rawRows) => {
  if (err) {
    console.error('Error:', err);
    process.exit();
  }
  
  console.log('Raw data before GROUP BY:');
  console.table(rawRows);
  
  // Now with GROUP BY
  db.all(`
    SELECT 
      sv.id as variety_id,
      sv.name as variety_name,
      oi.unit,
      SUM(oi.quantity) as total_quantity,
      COUNT(DISTINCT so.id) as order_count,
      COUNT(*) as row_count,
      GROUP_CONCAT(oi.id) as item_ids,
      GROUP_CONCAT(so.id) as order_ids
    FROM order_items oi
    JOIN sales_orders so ON oi.order_id = so.id
    JOIN spinach_varieties sv ON oi.variety_id = sv.id
    WHERE sv.name = 'Methi'
      AND so.delivery_status IN ('pending', 'packed', 'unconfirmed')
    GROUP BY sv.id, sv.name, oi.unit
  `, [], (err, groupedRows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('\n\nGrouped data:');
      console.table(groupedRows);
    }
    process.exit();
  });
});
