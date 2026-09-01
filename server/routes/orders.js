const express = require('express');
const router = express.Router();
const db = require('../database');

// Get orders for currently logged-in user
router.get('/my', (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const identities = [];

  if (user.phone) {
    const normalizedPhone = String(user.phone).replace(/\D/g, '');
    if (normalizedPhone) {
      identities.push({ type: 'phone', value: normalizedPhone });
    }
  }

  if (user.full_name && String(user.full_name).trim()) {
    identities.push({ type: 'name', value: String(user.full_name).trim().toLowerCase() });
  }

  if (user.username && String(user.username).trim()) {
    identities.push({ type: 'username', value: String(user.username).trim().toLowerCase() });
  }

  if (identities.length === 0) {
    return res.json([]);
  }

  const conditions = [];
  const params = [];

  identities.forEach((identity) => {
    if (identity.type === 'phone') {
      // Compare digits only to handle stored formatting differences
      conditions.push("REPLACE(REPLACE(REPLACE(REPLACE(IFNULL(c.phone, ''), '-', ''), ' ', ''), '(', ''), ')', '') = ?");
      params.push(identity.value);
      return;
    }

    if (identity.type === 'name') {
      conditions.push('LOWER(TRIM(IFNULL(c.name, \"\"))) = ?');
      params.push(identity.value);
      return;
    }

    if (identity.type === 'username') {
      conditions.push('LOWER(TRIM(IFNULL(c.name, \"\"))) = ?');
      params.push(identity.value);
    }
  });

  const query = `
    SELECT
      so.*,
      c.name as customer_name,
      c.phone,
      c.address as customer_address
    FROM sales_orders so
    JOIN customers c ON so.customer_id = c.id
    WHERE ${conditions.join(' OR ')}
    ORDER BY so.order_date DESC, so.id DESC
  `;

  db.all(query, params, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    let processed = 0;
    const ordersWithItems = [];

    orders.forEach((order) => {
      db.all(
        `SELECT oi.*, sv.name as variety_name
         FROM order_items oi
         JOIN spinach_varieties sv ON oi.variety_id = sv.id
         WHERE oi.order_id = ?
         ORDER BY oi.id`,
        [order.id],
        (itemsErr, items) => {
          if (itemsErr) {
            console.error('Error fetching order items:', itemsErr);
          }

          ordersWithItems.push({
            ...order,
            items: items || []
          });

          processed += 1;
          if (processed === orders.length) {
            ordersWithItems.sort((a, b) => {
              const dateDiff = new Date(b.order_date) - new Date(a.order_date);
              if (dateDiff !== 0) return dateDiff;
              return b.id - a.id;
            });
            res.json(ordersWithItems);
          }
        }
      );
    });
  });
});

module.exports = router;
