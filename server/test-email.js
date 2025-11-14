const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const emailService = require('./services/emailService');

console.log('=== Email Configuration Test ===');
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('================================\n');

// Test sending a new order notification
const testOrderData = {
  order_id: 999,
  customer_name: 'Test Customer',
  phone: '1234567890',
  delivery_date: '2025-11-15',
  delivery_address: '123 Test Street',
  total_amount: 50.00,
  items: [
    {
      variety_name: 'Test Spinach',
      quantity: 5,
      unit: 'bunches',
      price_per_unit: 10.00,
      subtotal: 50.00
    }
  ],
  notes: 'This is a test email notification'
};

console.log('Sending test email notification...\n');

emailService.sendNewOrderNotification(testOrderData)
  .then(result => {
    console.log('\n=== Email Send Result ===');
    console.log('Success:', result.success);
    if (result.success) {
      console.log('Message ID:', result.messageId);
      console.log('\n✅ Test email sent successfully!');
      console.log(`Check ${process.env.ADMIN_EMAIL} inbox`);
    } else {
      console.log('Error:', result.error);
      console.log('\n❌ Failed to send test email');
    }
    console.log('========================');
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('\n❌ Unexpected error:', err);
    process.exit(1);
  });
