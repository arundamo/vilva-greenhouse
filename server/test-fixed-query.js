const db = require('./database');

console.log('Testing FIXED crop demand query...\n');

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
    AND so.customer_id IS NOT NULL 
    AND so.customer_id != ''
    AND so.delivery_status IN ('pending', 'packed', 'unconfirmed')
  GROUP BY sv.id, sv.name, oi.unit 
  ORDER BY sv.name, oi.unit
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Fixed crop demand results:');
    console.table(rows);
    
    console.log('\n\nMethi only:');
    const methi = rows.filter(r => r.variety_name.includes('Methi'));
    console.table(methi);
    
    if (methi.length > 0) {
      console.log(`\n✓ Methi shows ${methi[0].total_quantity} bunches from ${methi[0].order_count} order(s)`);
    }
  }
  process.exit();
});
