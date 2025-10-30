const express = require('express')
const router = express.Router()
const db = require('../database')

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
      // Calculate total amount (will be 0 since we don't have prices yet)
      const totalAmount = 0

      // Create sales order with status "unconfirmed" for public orders
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

          // Insert order items
          const stmt = db.prepare(`
            INSERT INTO order_items (order_id, variety_id, quantity, unit, price_per_unit)
            VALUES (?, ?, ?, ?, ?)
          `)

          let itemsInserted = 0
          items.forEach(item => {
            stmt.run([orderId, item.variety_id, item.quantity, item.unit, 0], (err) => {
              if (err) {
                console.error('Error inserting item:', err)
              }
              itemsInserted++
              
              if (itemsInserted === items.length) {
                stmt.finalize()
                
                // Log the new order for admin notification
                console.log(`📦 NEW PUBLIC ORDER #${orderId} from ${customer_name} (${phone})`)
                console.log(`   Delivery: ${delivery_date}`)
                console.log(`   Items: ${items.length}`)
                
                res.json({
                  success: true,
                  message: 'Order submitted successfully',
                  order_id: orderId,
                  customer_name,
                  phone
                })
              }
            })
          })
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

module.exports = router
