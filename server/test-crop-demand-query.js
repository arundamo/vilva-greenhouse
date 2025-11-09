const db = require('./database');

console.log('Testing crop demand query...\n');

const query = `
  SELECT 
    sv.id as variety_id,
    sv.name as variety_name,
    oi.unit,
    SUM(oi.quantity) as total_quantity,
    COUNT(DISTINCT so.id) as order_count,
    GROUP_CONCAT(DISTINCT c.name) as customers
  FROM order_items oi
  JOIN sales_orders so ON oi.order_id = so.id
  JOIN spinach_varieties sv ON oi.variety_id = sv.id
  LEFT JOIN customers c ON so.customer_id = c.id
  WHERE 1=1
    AND so.delivery_status IN ('pending', 'packed', 'unconfirmed')
  GROUP BY sv.id, sv.name, oi.unit 
  ORDER BY sv.name, oi.unit
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Crop demand results:');
    console.table(rows);
    
    console.log('\n\nMethi only:');
    const methi = rows.filter(r => r.variety_name.includes('Methi'));
    console.table(methi);
  }
  process.exit();
});
