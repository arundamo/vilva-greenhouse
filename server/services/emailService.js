const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // Debug: Log what we're getting from env
  console.log('Email config check:', {
    hasUser: !!process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASSWORD,
    hasSMTPHost: !!process.env.SMTP_HOST,
    emailUser: process.env.EMAIL_USER,
    smtpHost: process.env.SMTP_HOST
  });

  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
    return null;
  }

  // Support both service-based (Gmail, etc) and SMTP configuration
  let transportConfig;
  
  if (process.env.SMTP_HOST) {
    // Custom SMTP configuration (for Brevo, SendGrid, etc.)
    console.log('Using SMTP configuration');
    transportConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };
  } else {
    // Service-based configuration (Gmail, etc.)
    console.log('Using service-based configuration');
    transportConfig = {
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };
  }

  return nodemailer.createTransport(transportConfig);
};

// Format currency for emails
const formatCAD = (amount) => {
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return `$${safe.toFixed(2)} CAD`;
};

// Email Templates
const templates = {
  // Admin notification for new orders
  newOrderAdmin: (orderData) => ({
    subject: `🆕 New Order #${orderData.order_id} - ${orderData.customer_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">New Order Received!</h2>
        <p>A new order has been submitted through the online form.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Order #:</strong> ${orderData.order_id}</p>
          <p><strong>Customer:</strong> ${orderData.customer_name}</p>
          <p><strong>Phone:</strong> ${orderData.phone}</p>
          <p><strong>Delivery Date:</strong> ${orderData.delivery_date}</p>
          <p><strong>Delivery Address:</strong> ${orderData.delivery_address}</p>
        </div>

        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Items</h3>
          ${orderData.items.map(item => `
            <p>• ${item.variety_name} - ${item.quantity} ${item.unit} @ ${formatCAD(item.price_per_unit)} = ${formatCAD(item.subtotal)}</p>
          `).join('')}
          <hr style="border: 1px solid #e5e7eb; margin: 10px 0;">
          <p style="font-size: 18px;"><strong>Total: ${formatCAD(orderData.total_amount)}</strong></p>
        </div>

        ${orderData.notes ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Special Notes</h3>
            <p>${orderData.notes}</p>
          </div>
        ` : ''}

        <p style="color: #6b7280; font-size: 14px;">
          Please log in to the admin dashboard to confirm this order.
        </p>
      </div>
    `,
    text: `
New Order Received!

Order #: ${orderData.order_id}
Customer: ${orderData.customer_name}
Phone: ${orderData.phone}
Delivery Date: ${orderData.delivery_date}

Order Items:
${orderData.items.map(item => `• ${item.variety_name} - ${item.quantity} ${item.unit} @ ${formatCAD(item.price_per_unit)} = ${formatCAD(item.subtotal)}`).join('\n')}

Total: ${formatCAD(orderData.total_amount)}

${orderData.notes ? `Notes: ${orderData.notes}` : ''}
    `
  }),

  // Customer order confirmation
  orderConfirmation: (orderData) => ({
    subject: `✅ Order Confirmed #${orderData.order_id} - Vilva Greenhouse`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Thank You for Your Order!</h2>
        <p>Hi ${orderData.customer_name},</p>
        <p>Your order has been confirmed and is being prepared.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Summary</h3>
          <p><strong>Order #:</strong> ${orderData.order_id}</p>
          <p><strong>Order Date:</strong> ${orderData.order_date}</p>
          <p><strong>Delivery Date:</strong> ${orderData.delivery_date}</p>
          <p><strong>Delivery Address:</strong> ${orderData.delivery_address}</p>
        </div>

        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Items</h3>
          ${orderData.items.map(item => `
            <p>• ${item.variety_name} - ${item.quantity} ${item.unit} @ ${formatCAD(item.price_per_unit)} = ${formatCAD(item.subtotal)}</p>
          `).join('')}
          <hr style="border: 1px solid #e5e7eb; margin: 10px 0;">
          <p style="font-size: 18px;"><strong>Total: ${formatCAD(orderData.total_amount)}</strong></p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          We'll contact you if there are any updates. For questions, please call us or reply to this email.
        </p>

        <p style="color: #16a34a; font-weight: bold;">
          🌱 Fresh • Organic • Locally Grown 🌱
        </p>
      </div>
    `,
    text: `
Thank You for Your Order!

Hi ${orderData.customer_name},

Your order has been confirmed.

Order #: ${orderData.order_id}
Order Date: ${orderData.order_date}
Delivery Date: ${orderData.delivery_date}

Items:
${orderData.items.map(item => `• ${item.variety_name} - ${item.quantity} ${item.unit} @ ${formatCAD(item.price_per_unit)} = ${formatCAD(item.subtotal)}`).join('\n')}

Total: ${formatCAD(orderData.total_amount)}

🌱 Vilva Greenhouse Farm
    `
  }),

  // Order status update
  orderStatusUpdate: (orderData, status) => {
    const statusMessages = {
      packed: {
        emoji: '📦',
        title: 'Order Packed',
        message: 'Your order has been packed and is ready for delivery.'
      },
      delivered: {
        emoji: '🚚',
        title: 'Order Delivered',
        message: 'Your order has been delivered. We hope you enjoy your fresh produce!'
      }
    };

    const statusInfo = statusMessages[status] || { emoji: '📋', title: 'Order Update', message: 'Your order status has been updated.' };

    return {
      subject: `${statusInfo.emoji} ${statusInfo.title} - Order #${orderData.order_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">${statusInfo.emoji} ${statusInfo.title}</h2>
          <p>Hi ${orderData.customer_name},</p>
          <p>${statusInfo.message}</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order #:</strong> ${orderData.order_id}</p>
            <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Thank you for choosing Vilva Greenhouse Farm!
          </p>

          <p style="color: #16a34a; font-weight: bold;">
            🌱 Fresh • Organic • Locally Grown 🌱
          </p>
        </div>
      `,
      text: `
${statusInfo.title}

Hi ${orderData.customer_name},

${statusInfo.message}

Order #: ${orderData.order_id}
Status: ${status}

Thank you for choosing Vilva Greenhouse Farm!
      `
    };
  },

  // Payment receipt
  paymentReceipt: (orderData) => ({
    subject: `💰 Payment Received - Order #${orderData.order_id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Payment Received</h2>
        <p>Hi ${orderData.customer_name},</p>
        <p>We have received your payment for Order #${orderData.order_id}.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payment Details</h3>
          <p><strong>Order #:</strong> ${orderData.order_id}</p>
          <p><strong>Amount Paid:</strong> ${formatCAD(orderData.total_amount)}</p>
          <p><strong>Payment Method:</strong> ${orderData.payment_method}</p>
          <p><strong>Payment Date:</strong> ${orderData.payment_date}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          This email serves as your payment receipt. Thank you for your business!
        </p>

        <p style="color: #16a34a; font-weight: bold;">
          🌱 Vilva Greenhouse Farm 🌱
        </p>
      </div>
    `,
    text: `
Payment Received

Hi ${orderData.customer_name},

We have received your payment for Order #${orderData.order_id}.

Amount Paid: ${formatCAD(orderData.total_amount)}
Payment Method: ${orderData.payment_method}
Payment Date: ${orderData.payment_date}

Thank you!
    `
  })
};

// Send email function
const sendEmail = async (to, templateName, data) => {
  try {
    console.log('=== Attempting to send email ===');
    console.log('To:', to);
    console.log('Template:', templateName);
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('❌ Email not configured, skipping email:', templateName);
      return { success: false, error: 'Email service not configured' };
    }

    console.log('✅ Transporter created successfully');

    if (!to || !to.includes('@')) {
      console.log('❌ Invalid email address:', to);
      return { success: false, error: 'Invalid email address' };
    }

    const template = templates[templateName](data);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: template.subject,
      html: template.html,
      text: template.text
    };

    console.log('📧 Sending email with subject:', template.subject);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
};

// Exported functions
module.exports = {
  sendNewOrderNotification: async (orderData) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      return await sendEmail(adminEmail, 'newOrderAdmin', orderData);
    }
    return { success: false, error: 'No admin email configured' };
  },

  sendOrderConfirmation: async (orderData) => {
    if (orderData.customer_email) {
      return await sendEmail(orderData.customer_email, 'orderConfirmation', orderData);
    }
    return { success: false, error: 'No customer email' };
  },

  sendOrderStatusUpdate: async (orderData, status) => {
    if (orderData.customer_email) {
      return await sendEmail(orderData.customer_email, 'orderStatusUpdate', orderData, status);
    }
    return { success: false, error: 'No customer email' };
  },

  sendPaymentReceipt: async (orderData) => {
    if (orderData.customer_email) {
      return await sendEmail(orderData.customer_email, 'paymentReceipt', orderData);
    }
    return { success: false, error: 'No customer email' };
  },

  // Test email function
  sendTestEmail: async (to) => {
    return await sendEmail(to, 'orderConfirmation', {
      order_id: 'TEST123',
      customer_name: 'Test Customer',
      customer_email: to,
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date().toISOString().split('T')[0],
      delivery_address: 'Test Address',
      total_amount: 100.00,
      items: [
        { variety_name: 'Test Spinach', quantity: 5, unit: 'bunches', price_per_unit: 20, subtotal: 100 }
      ]
    });
  }
};
