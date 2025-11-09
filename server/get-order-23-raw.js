const db = require('./database');

db.get(`SELECT * FROM sales_orders WHERE id = 23`, [], (err, row) => {
  if (err) console.error(err);
  else {
    console.log('Order 23 raw data:');
    console.log(JSON.stringify(row, null, 2));
  }
  process.exit();
});
