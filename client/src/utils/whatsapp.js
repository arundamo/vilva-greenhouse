// WhatsApp click-to-chat utility functions

/**
 * Generates a WhatsApp click-to-chat URL
 * @param {string} phone - Phone number with country code (e.g., '12345678901')
 * @param {string} message - Pre-filled message (optional)
 * @returns {string} WhatsApp URL
 */
export const generateWhatsAppUrl = (phone, message = '') => {
  // Remove all non-numeric characters from phone
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Encode the message for URL
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  // Generate WhatsApp URL
  return `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
};

/**
 * Opens WhatsApp chat in a new window
 * @param {string} phone - Phone number with country code
 * @param {string} message - Pre-filled message (optional)
 */
export const sendWhatsAppMessage = (phone, message = '') => {
  const url = generateWhatsAppUrl(phone, message);
  window.open(url, '_blank');
};

/**
 * Format currency for WhatsApp messages
 */
const formatCAD = (amount) => {
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return `$${safe.toFixed(2)} CAD`;
};

// WhatsApp Message Templates

/**
 * Order confirmation message template
 */
export const getOrderConfirmationMessage = (order) => {
  const itemsList = order.items
    .map(item => `• ${item.variety_name} - ${item.quantity} ${item.unit} @ ${formatCAD(item.price_per_unit)}`)
    .join('\n');

  return `🌱 *Vilva Greenhouse Farm* 🌱

Hello ${order.customer_name}!

Your order has been confirmed:

*Order #${order.order_id}*
*Delivery Date:* ${order.delivery_date}

*Items:*
${itemsList}

*Total:* ${formatCAD(order.total_amount)}

We'll keep you updated on your order status. Thank you for choosing Vilva Greenhouse Farm!`;
};

/**
 * Order packed notification message
 */
export const getOrderPackedMessage = (order) => {
  return `📦 Hello ${order.customer_name}!

Your order #${order.order_id} has been packed and is ready for delivery on ${order.delivery_date}.

*Total Amount:* ${formatCAD(order.total_amount)}

🌱 Fresh • Organic • Locally Grown

- Vilva Greenhouse Farm`;
};

/**
 * Delivery reminder message
 */
export const getDeliveryReminderMessage = (order) => {
  return `🚚 Hello ${order.customer_name}!

This is a reminder that your order #${order.order_id} is scheduled for delivery today.

*Delivery Address:* ${order.delivery_address}
*Total Amount:* ${formatCAD(order.total_amount)}

Please ensure someone is available to receive the delivery.

Thank you!
🌱 Vilva Greenhouse Farm`;
};

/**
 * Payment follow-up message
 */
export const getPaymentFollowUpMessage = (order) => {
  return `💰 Hello ${order.customer_name}!

This is a friendly reminder about the payment for order #${order.order_id}.

*Amount Due:* ${formatCAD(order.total_amount)}
*Delivery Date:* ${order.delivery_date}

Please let us know if you have any questions.

Thank you!
🌱 Vilva Greenhouse Farm`;
};

/**
 * Payment received thank you message
 */
export const getPaymentReceivedMessage = (order) => {
  return `✅ Hello ${order.customer_name}!

We have received your payment of ${formatCAD(order.total_amount)} for order #${order.order_id}.

Thank you for your business! We look forward to serving you again.

🌱 Fresh • Organic • Locally Grown

- Vilva Greenhouse Farm`;
};

/**
 * General inquiry message template
 */
export const getGeneralInquiryMessage = (customerName = '') => {
  const greeting = customerName ? `Hello ${customerName}` : 'Hello';
  return `${greeting}! 🌱

I'm contacting you from Vilva Greenhouse Farm regarding `;
};

/**
 * Custom message with order details
 */
export const getCustomOrderMessage = (order, customText) => {
  return `🌱 *Vilva Greenhouse Farm* 🌱

Hello ${order.customer_name}!

*Order #${order.order_id}*

${customText}

If you have any questions, please feel free to reply.

Thank you!`;
};
