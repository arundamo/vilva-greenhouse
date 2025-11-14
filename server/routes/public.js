const express = require('express')
const router = express.Router()
const db = require('../database')
const emailService = require('../services/emailService')

// Submit public order (no authentication required)
router.post('/orders', (req, res) => {
  const { customer_name, phone, delivery_address, delivery_date, notes, items } = req.body

  // Validate required fields
  if (!customer_name || !phone || !delivery_address || !delivery_date || !items || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Validate phone number (basic validation)
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Invalid phone number' })
  }

  // Check if customer exists, if not create one
  db.get('SELECT * FROM customers WHERE phone = ?', [phone], (err, customer) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: 'Database error' })
    }

    const handleCustomer = (customerId) => {
      // First, fetch variety prices to calculate total
      const varietyIds = items.map(item => item.variety_id).join(',')
      
      db.all(
        `SELECT id, price_per_bunch, price_per_kg, price_per_100g FROM spinach_varieties WHERE id IN (${varietyIds})`,
        (err, varieties) => {
          if (err) {
            console.error(err)
            return res.status(500).json({ error: 'Failed to fetch prices' })
          }
          
          // Create a price lookup map
          const priceMap = {}
          varieties.forEach(v => {
            priceMap[v.id] = {
              price_per_bunch: parseFloat(v.price_per_bunch) || 0,
              price_per_kg: parseFloat(v.price_per_kg) || 0,
              price_per_100g: parseFloat(v.price_per_100g) || 0
            }
          })
          
          // Calculate total amount and item prices
          let totalAmount = 0
          const itemsWithPrices = items.map(item => {
            const variety = priceMap[item.variety_id]
            let pricePerUnit = 0
            let subtotal = 0
            const quantity = parseFloat(item.quantity) || 0
            
            if (variety) {
              switch(item.unit) {
                case 'bunches':
                  pricePerUnit = variety.price_per_bunch
                  break
                case 'kg':
                  pricePerUnit = variety.price_per_kg
                  break
                case 'grams':
                  pricePerUnit = variety.price_per_100g
                  subtotal = (quantity / 100) * pricePerUnit
                  break
              }
              
              if (item.unit !== 'grams') {
                subtotal = quantity * pricePerUnit
              }
            }
            
            totalAmount += subtotal
            
            return {
              variety_id: item.variety_id,
              quantity: item.quantity,
              unit: item.unit,
              price_per_unit: pricePerUnit,
              subtotal: subtotal
            }
          })

          // Create sales order with calculated total
          db.run(
            `INSERT INTO sales_orders (
              customer_id, order_date, delivery_date, delivery_address,
              total_amount, payment_status, delivery_status, requested_via, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              customerId,
              new Date().toISOString().split('T')[0],
              delivery_date,
              delivery_address,
              totalAmount,
              'pending',
              'unconfirmed', // Special status for public orders
              'online_form',
              notes || null
            ],
            function(err) {
              if (err) {
                console.error(err)
                return res.status(500).json({ error: 'Failed to create order' })
              }

              const orderId = this.lastID

              // Insert order items with actual prices
              const stmt = db.prepare(`
                INSERT INTO order_items (order_id, variety_id, quantity, unit, price_per_unit, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
              `)

              let itemsInserted = 0
              itemsWithPrices.forEach(item => {
                stmt.run([orderId, item.variety_id, item.quantity, item.unit, item.price_per_unit, item.subtotal], (err) => {
                  if (err) {
                    console.error('Error inserting item:', err)
                  }
                  itemsInserted++
                  
                  if (itemsInserted === itemsWithPrices.length) {
                    stmt.finalize()
                    
                    // Log the new order for admin notification
                    console.log(`📦 NEW PUBLIC ORDER #${orderId} from ${customer_name} (${phone})`)
                    console.log(`   Delivery: ${delivery_date}`)
                    console.log(`   Items: ${itemsWithPrices.length}`)
                    console.log(`   Total: $${totalAmount.toFixed(2)}`)
                    
                    // Fetch variety names for email notification
                    db.all(
                      `SELECT oi.*, sv.name as variety_name 
                       FROM order_items oi 
                       JOIN spinach_varieties sv ON oi.variety_id = sv.id 
                       WHERE oi.order_id = ?`,
                      [orderId],
                      async (err, orderItems) => {
                        if (!err && orderItems) {
                          // Send admin notification email
                          const orderData = {
                            order_id: orderId,
                            customer_name,
                            phone,
                            delivery_date,
                            delivery_address,
                            total_amount: totalAmount,
                            items: orderItems,
                            notes
                          }
                          
                          await emailService.sendNewOrderNotification(orderData)
                        }
                      }
                    )
                    
                    res.json({
                      success: true,
                      message: 'Order submitted successfully',
                      order_id: orderId
                    })
                  }
                })
              })
            }
          )
        }
      )
    }

    if (customer) {
      // Customer exists, update name and address if provided
      db.run(
        'UPDATE customers SET name = ?, address = ? WHERE id = ?',
        [customer_name, delivery_address, customer.id],
        (err) => {
          if (err) console.error('Error updating customer:', err)
          handleCustomer(customer.id)
        }
      )
    } else {
      // Create new customer
      db.run(
        'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)',
        [customer_name, phone, delivery_address],
        function(err) {
          if (err) {
            console.error(err)
            return res.status(500).json({ error: 'Failed to create customer' })
          }
          handleCustomer(this.lastID)
        }
      )
    }
  })
})

// Get available varieties (public endpoint)
router.get('/varieties', (req, res) => {
  db.all(
    'SELECT id, name, days_to_harvest, price_per_bunch, price_per_kg, price_per_100g FROM spinach_varieties ORDER BY name',
    (err, rows) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ error: 'Database error' })
      }
      res.json(rows)
    }
  )
})

// Get order details for feedback (public endpoint)
router.get('/feedback/:orderId', (req, res) => {
  const { orderId } = req.params
  
  db.get(
    `SELECT so.id, so.order_date, so.delivery_date, c.name as customer_name, so.total_amount
     FROM sales_orders so
     JOIN customers c ON so.customer_id = c.id
     WHERE so.id = ? AND so.delivery_status = 'delivered'`,
    [orderId],
    (err, order) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found or not delivered yet' })
      }
      
      // Check if feedback already submitted
      db.get(
        'SELECT id FROM order_feedback WHERE order_id = ?',
        [orderId],
        (err, feedback) => {
          if (err) {
            console.error(err)
            return res.status(500).json({ error: 'Database error' })
          }
          
          if (feedback) {
            return res.status(400).json({ error: 'Feedback already submitted for this order' })
          }
          
          // Get order items
          db.all(
            `SELECT oi.*, sv.name as variety_name
             FROM order_items oi
             JOIN spinach_varieties sv ON oi.variety_id = sv.id
             WHERE oi.order_id = ?`,
            [orderId],
            (err, items) => {
              if (err) {
                console.error(err)
                return res.status(500).json({ error: 'Database error' })
              }
              
              res.json({ ...order, items })
            }
          )
        }
      )
    }
  )
})

// Submit feedback for an order (public endpoint)
router.post('/feedback/:orderId', (req, res) => {
  const { orderId } = req.params
  const { rating, comments, delivery_quality, product_freshness, customer_name } = req.body
  
  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' })
  }
  
  // Verify order exists and is delivered
  db.get(
    'SELECT id FROM sales_orders WHERE id = ? AND delivery_status = "delivered"',
    [orderId],
    (err, order) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found or not delivered yet' })
      }
      
      // Check if feedback already exists
      db.get(
        'SELECT id FROM order_feedback WHERE order_id = ?',
        [orderId],
        (err, existingFeedback) => {
          if (err) {
            console.error(err)
            return res.status(500).json({ error: 'Database error' })
          }
          
          if (existingFeedback) {
            return res.status(400).json({ error: 'Feedback already submitted for this order' })
          }
          
          // Insert feedback
          db.run(
            `INSERT INTO order_feedback 
             (order_id, rating, comments, delivery_quality, product_freshness, customer_name)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, rating, comments || '', delivery_quality, product_freshness, customer_name],
            function(err) {
              if (err) {
                console.error(err)
                return res.status(500).json({ error: 'Failed to submit feedback' })
              }
              
              res.status(201).json({ 
                message: 'Thank you for your feedback!',
                feedbackId: this.lastID
              })
            }
          )
        }
      )
    }
  )
})

module.exports = router
