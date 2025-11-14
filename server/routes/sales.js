const express = require('express');
const router = express.Router();
const db = require('../database');
const emailService = require('../services/emailService');

// Get all sales orders with items
router.get('/', (req, res) => {
  const { status, customer_id } = req.query;
  let query = `
    SELECT so.*, 
      c.name as customer_name, c.phone, c.whatsapp, c.address as customer_address
    FROM sales_orders so
    JOIN customers c ON so.customer_id = c.id
  `;
  const params = [];

  const conditions = [];
  if (status) {
    conditions.push('so.delivery_status = ?');
    params.push(status);
  }
  if (customer_id) {
    conditions.push('so.customer_id = ?');
    params.push(customer_id);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
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
              // Send email notification for new order
              db.get(
                `SELECT c.name as customer_name, c.phone 
                 FROM customers c WHERE c.id = ?`,
                [customer_id],
                (err, customer) => {
                  if (!err && customer) {
                    // Fetch order items with variety names for email
                    db.all(
                      `SELECT oi.*, sv.name as variety_name 
                       FROM order_items oi 
                       JOIN spinach_varieties sv ON oi.variety_id = sv.id 
                       WHERE oi.order_id = ?`,
                      [orderId],
                      async (err, orderItems) => {
                        if (!err && orderItems) {
                          const orderData = {
                            order_id: orderId,
                            customer_name: customer.customer_name,
                            phone: customer.phone,
                            delivery_date: delivery_date || 'Not specified',
                            delivery_address: delivery_address || 'Not specified',
                            total_amount: total_amount,
                            items: orderItems,
                            notes: notes || ''
                          };
                          
                          console.log(`📧 Sending email notification for new order #${orderId}`);
                          await emailService.sendNewOrderNotification(orderData);
                        }
                      }
                    );
                  }
                }
              );
              
              res.status(201).json({ id: orderId, message: 'Sales order created' });
            }
          }
        );
      });
    }
  );
});

// Get crop demand report (aggregated quantities from pending orders)
// This must come BEFORE /:id routes to avoid being matched as an ID
router.get('/crop-demand', (req, res) => {
  const { start_date, end_date, status } = req.query;
  
  let query = `
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
  `;
  
  const params = [];
  
  // Filter by status (default to pending and packed)
  if (status) {
    query += ` AND so.delivery_status = ?`;
    params.push(status);
  } else {
    query += ` AND so.delivery_status IN ('pending', 'packed', 'unconfirmed')`;
  }
  
  // Filter by date range
  if (start_date) {
    query += ` AND so.delivery_date >= ?`;
    params.push(start_date);
  }
  if (end_date) {
    query += ` AND so.delivery_date <= ?`;
    params.push(end_date);
  }
  
  query += ` GROUP BY sv.id, sv.name, oi.unit ORDER BY sv.name, oi.unit`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Crop demand report error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
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
      
      // Send email notifications for status updates
      const sendNotifications = () => {
        if (delivery_status || payment_status) {
          // Fetch order details with customer info
          db.get(
            `SELECT so.*, c.name as customer_name, c.email as customer_email
             FROM sales_orders so
             JOIN customers c ON so.customer_id = c.id
             WHERE so.id = ?`,
            [req.params.id],
            async (err, order) => {
              if (!err && order && order.customer_email) {
                // Fetch order items
                db.all(
                  `SELECT oi.*, sv.name as variety_name 
                   FROM order_items oi 
                   JOIN spinach_varieties sv ON oi.variety_id = sv.id 
                   WHERE oi.order_id = ?`,
                  [req.params.id],
                  async (err, orderItems) => {
                    if (!err && orderItems) {
                      order.items = orderItems;
                      
                      // Send order confirmation email when status changes from unconfirmed
                      if (delivery_status === 'confirmed') {
                        await emailService.sendOrderConfirmation(order);
                      }
                      // Send status update for packed or delivered
                      else if (delivery_status === 'packed' || delivery_status === 'delivered') {
                        await emailService.sendOrderStatusUpdate(order, delivery_status);
                      }
                      
                      // Send payment receipt when payment is received
                      if (payment_status === 'paid' && payment_date) {
                        order.payment_method = payment_method || 'Cash';
                        order.payment_date = payment_date;
                        await emailService.sendPaymentReceipt(order);
                      }
                    }
                  }
                );
              }
            }
          );
        }
      };
      
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
            sendNotifications();
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
                  sendNotifications();
                  res.json({ message: 'Order updated' });
                }
              }
            );
          });
        });
      } else {
        sendNotifications();
        res.json({ message: 'Order updated' });
      }
    }
  );
});

// Delete sales order (cascades to order_items via ON DELETE CASCADE)
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM sales_orders WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  });
});

// Get all feedback
router.get('/feedback', (req, res) => {
  db.all(
    `SELECT 
      f.*, 
      so.order_date,
      so.delivery_date,
      c.name as customer_name,
      c.phone
     FROM order_feedback f
     JOIN sales_orders so ON f.order_id = so.id
     JOIN customers c ON so.customer_id = c.id
     ORDER BY f.submitted_at DESC`,
    (err, rows) => {
      if (err) {
        console.error('Feedback fetch error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get feedback for a specific order
router.get('/feedback/:orderId', (req, res) => {
  const { orderId } = req.params;
  
  db.get(
    `SELECT f.*, c.name as customer_name
     FROM order_feedback f
     JOIN sales_orders so ON f.order_id = so.id
     JOIN customers c ON so.customer_id = c.id
     WHERE f.order_id = ?`,
    [orderId],
    (err, row) => {
      if (err) {
        console.error('Feedback fetch error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Feedback not found' });
      }
      
      res.json(row);
    }
  );
});

module.exports = router;
