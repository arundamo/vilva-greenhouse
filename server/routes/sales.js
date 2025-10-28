const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all sales orders with items
router.get('/', (req, res) => {
  const status = req.query.status;
  let query = `
    SELECT so.*, 
      c.name as customer_name, c.phone, c.whatsapp
    FROM sales_orders so
    JOIN customers c ON so.customer_id = c.id
  `;
  const params = [];
  
  if (status) {
    query += ' WHERE so.delivery_status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY so.order_date DESC';
  
  db.all(query, params, (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Fetch items for each order
    const ordersWithItems = [];
    let processed = 0;
    
    if (orders.length === 0) {
      return res.json([]);
    }
    
    orders.forEach(order => {
      db.all(
        `SELECT oi.*, sv.name as variety_name 
         FROM order_items oi
         JOIN spinach_varieties sv ON oi.variety_id = sv.id
         WHERE oi.order_id = ?
         ORDER BY oi.id`,
        [order.id],
        (err, items) => {
          if (err) {
            console.error('Error fetching items:', err);
            items = [];
          }
          
          ordersWithItems.push({
            ...order,
            items: items || []
          });
          
          processed++;
          if (processed === orders.length) {
            // Sort by order date descending
            ordersWithItems.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
            res.json(ordersWithItems);
          }
        }
      );
    });
  });
});

// Create sales order with multiple items
router.post('/', (req, res) => {
  let { customer_id, order_date, requested_via, items, delivery_date, delivery_address, notes, variety_id, quantity, unit, price_per_unit } = req.body;
  
  // Validate items array
  if (!items || !Array.isArray(items) || items.length === 0) {
    // Fallback for legacy single-item payloads
    if (variety_id && quantity) {
      items = [{ variety_id, quantity, unit: unit || 'bunches', price_per_unit: price_per_unit || 0 }]
    } else {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }
  }
  
  // Calculate total amount from items
  const total_amount = items.reduce((sum, item) => {
    return sum + (item.quantity * (item.price_per_unit || 0));
  }, 0);
  
  // Create the order
  db.run(
    `INSERT INTO sales_orders (customer_id, order_date, requested_via, total_amount, delivery_date, delivery_address, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [customer_id, order_date, requested_via, total_amount, delivery_date, delivery_address, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const orderId = this.lastID;
      
      // Insert order items
      let inserted = 0;
      items.forEach(item => {
        const subtotal = item.quantity * (item.price_per_unit || 0);
        db.run(
          `INSERT INTO order_items (order_id, variety_id, quantity, unit, price_per_unit, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.variety_id, item.quantity, item.unit, item.price_per_unit, subtotal],
          (err) => {
            if (err) console.error('Error inserting order item:', err);
            inserted++;
            if (inserted === items.length) {
              res.status(201).json({ id: orderId, message: 'Sales order created' });
            }
          }
        );
      });
    }
  );
});

// Update sales order with multiple items
router.patch('/:id', (req, res) => {
  const { 
    customer_id, order_date, requested_via, items,
    delivery_date, delivery_address, notes,
    delivery_status, payment_status, payment_method, payment_date 
  } = req.body;
  const updates = [];
  const params = [];
  
  // Allow updating order details
  if (customer_id !== undefined) {
    updates.push('customer_id = ?');
    params.push(customer_id);
  }
  if (order_date !== undefined) {
    updates.push('order_date = ?');
    params.push(order_date);
  }
  if (requested_via !== undefined) {
    updates.push('requested_via = ?');
    params.push(requested_via);
  }
  if (delivery_date !== undefined) {
    updates.push('delivery_date = ?');
    params.push(delivery_date);
  }
  if (delivery_address !== undefined) {
    updates.push('delivery_address = ?');
    params.push(delivery_address);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }
  
  // Status updates
  if (delivery_status) {
    updates.push('delivery_status = ?');
    params.push(delivery_status);
  }
  if (payment_status) {
    updates.push('payment_status = ?');
    params.push(payment_status);
  }
  if (payment_method) {
    updates.push('payment_method = ?');
    params.push(payment_method);
  }
  if (payment_date) {
    updates.push('payment_date = ?');
    params.push(payment_date);
  }
  
  // Handle items update
  if (items && Array.isArray(items)) {
    const total_amount = items.reduce((sum, item) => {
      return sum + (item.quantity * (item.price_per_unit || 0));
    }, 0);
    updates.push('total_amount = ?');
    params.push(total_amount);
  }
  
  if (updates.length === 0 && !items) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  params.push(req.params.id);
  
  // Update the order
  db.run(
    `UPDATE sales_orders SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Order not found' });
      
      // Update items if provided
      if (items && Array.isArray(items)) {
        // Delete existing items
        db.run('DELETE FROM order_items WHERE order_id = ?', [req.params.id], (err) => {
          if (err) {
            console.error('Error deleting order items:', err);
            return res.status(500).json({ error: 'Failed to update items' });
          }
          
          // Insert new items
          let inserted = 0;
          if (items.length === 0) {
            return res.json({ message: 'Order updated' });
          }
          
          items.forEach(item => {
            const subtotal = item.quantity * (item.price_per_unit || 0);
            db.run(
              `INSERT INTO order_items (order_id, variety_id, quantity, unit, price_per_unit, subtotal)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [req.params.id, item.variety_id, item.quantity, item.unit, item.price_per_unit, subtotal],
              (err) => {
                if (err) console.error('Error inserting order item:', err);
                inserted++;
                if (inserted === items.length) {
                  res.json({ message: 'Order updated' });
                }
              }
            );
          });
        });
      } else {
        res.json({ message: 'Order updated' });
      }
    }
  );
});

module.exports = router;
