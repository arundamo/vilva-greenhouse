# Email & WhatsApp Integration Setup Guide

## Overview

This guide covers the setup of email notifications and WhatsApp click-to-chat integration for the Vilva Greenhouse Farm management system.

## Features Implemented

### Phase 1: Email Notifications
- ✅ Admin notifications for new orders from public form
- ✅ Customer order confirmation emails
- ✅ Order status update notifications (packed, delivered)
- ✅ Payment receipt emails
- ✅ Settings UI for managing notification preferences
- ✅ Test email functionality

### Phase 2: WhatsApp Click-to-Chat
- ✅ WhatsApp utility functions with message templates
- ✅ Pre-filled messages for various scenarios
- ⏳ UI buttons in Sales and Dashboard (next step)

---

## Email Setup

### Step 1: Configure Gmail for SMTP

1. **Enable 2-Factor Authentication** (if not already enabled):
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App-Specific Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password (no spaces)

### Step 2: Update Environment Variables

Create or update `server/.env` file:

```bash
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=Vilva Greenhouse Farm <your-email@gmail.com>
ADMIN_EMAIL=admin@example.com

# Database
DATABASE_PATH=./vilva-farm.db

# Server
PORT=3000
```

**Important Notes:**
- Use the app-specific password, NOT your regular Gmail password
- Gmail free tier limits: 500 emails/day
- For production with higher volume, consider SendGrid or AWS SES

### Step 3: Configure Settings in Admin Panel

1. Log in to the admin dashboard
2. Go to **Settings** → **Notifications** tab
3. Enable email notifications
4. Enter your admin email address
5. Select notification types:
   - ✅ New order submissions (admin notifications)
   - ✅ Order status updates (customer notifications)
   - ✅ Payment receipts (customer notifications)
6. Click "Send Test Email" to verify configuration
7. Click "Save Changes"

### Step 4: Update Customer Emails

Customers need email addresses to receive notifications:

1. Go to **Settings** → **Manage Users** (or edit customer records)
2. Add email addresses for existing customers
3. New customers from the public order form won't have emails initially - add them manually

---

## WhatsApp Click-to-Chat Setup

### Step 1: Configure WhatsApp Number

1. Go to **Settings** → **Notifications** tab
2. Enable WhatsApp click-to-chat buttons
3. Enter your business WhatsApp number with country code
   - Format: `14165551234` (Canada)
   - Include country code without + or spaces
4. Click "Save Changes"

### Step 2: How It Works

- **No API Required**: Uses WhatsApp's `wa.me` URL format
- **Pre-filled Messages**: Opens WhatsApp with order details pre-filled
- **Free to Use**: No costs, works with regular WhatsApp Business account

### Step 3: Message Templates Available

The system includes pre-built message templates for:
- Order confirmations
- Order packed notifications
- Delivery reminders
- Payment follow-ups
- Payment received confirmations
- General inquiries
- Custom messages

### Step 4: Using WhatsApp Buttons (Once Implemented)

In Sales and Dashboard pages:
1. Find an order card
2. Click "📱 WhatsApp Customer" button
3. WhatsApp opens with pre-filled message
4. Edit message if needed
5. Send to customer

---

## Email Notification Flow

### 1. New Order Submitted (Public Form)
- **Trigger**: Customer submits order via `/order-form`
- **Email Sent To**: Admin email (configured in settings)
- **Contains**: Order details, customer info, items, total amount
- **Purpose**: Alert admin to confirm new order

### 2. Order Confirmed
- **Trigger**: Admin changes order status from "unconfirmed" to "confirmed"
- **Email Sent To**: Customer email (if available)
- **Contains**: Order summary, delivery date, items, total
- **Purpose**: Confirm order acceptance

### 3. Order Status Updates
- **Trigger**: Admin changes order status to "packed" or "delivered"
- **Email Sent To**: Customer email (if available)
- **Contains**: Status update, order details
- **Purpose**: Keep customer informed

### 4. Payment Receipt
- **Trigger**: Admin marks payment as "paid"
- **Email Sent To**: Customer email (if available)
- **Contains**: Payment details, order info, receipt
- **Purpose**: Confirm payment received

---

## Testing

### Test Email Functionality

1. Go to **Settings** → **Notifications**
2. Enter a valid email address
3. Click "📧 Send Test Email"
4. Check inbox (and spam folder)
5. Verify email formatting and content

### Test Order Flow

1. Submit a test order via public form: `/order-form`
2. Check admin email for new order notification
3. Add customer email in database
4. Change order status to "confirmed"
5. Check customer email for confirmation
6. Update status to "packed" or "delivered"
7. Check customer email for status update
8. Mark payment as "paid"
9. Check customer email for receipt

### Test WhatsApp (When Buttons Added)

1. Ensure WhatsApp number is configured
2. Click WhatsApp button on an order
3. Verify WhatsApp opens with correct number
4. Verify message is pre-filled correctly
5. Test on mobile and desktop

---

## Troubleshooting

### Email Issues

**Problem**: Test email not sending
- **Solution**: 
  - Verify app-specific password is correct
  - Check EMAIL_USER and EMAIL_PASSWORD in .env
  - Ensure 2FA is enabled on Gmail
  - Check server console for error messages

**Problem**: Emails going to spam
- **Solution**:
  - Add sender email to contacts
  - Mark as "Not Spam" in Gmail
  - For production, set up SPF/DKIM records

**Problem**: "Email service not configured" message
- **Solution**:
  - Verify .env file exists in server directory
  - Restart server after updating .env
  - Check environment variables are loaded

### WhatsApp Issues

**Problem**: WhatsApp button opens but number is wrong
- **Solution**:
  - Check WhatsApp number format (country code without +)
  - Verify settings saved correctly
  - Reload page after updating settings

**Problem**: Message not pre-filled
- **Solution**:
  - Check browser allows URL parameters
  - Try on different browser
  - Ensure WhatsApp Web or app is installed

---

## Database Schema Changes

### New Tables

**notification_settings**
```sql
CREATE TABLE notification_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

**notification_log** (Optional - for tracking sent notifications)
```sql
CREATE TABLE notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  order_id INTEGER,
  status TEXT NOT NULL,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES sales_orders(id)
)
```

### Modified Tables

**customers** - Added email column:
```sql
ALTER TABLE customers ADD COLUMN email TEXT
```

---

## API Endpoints

### Admin Settings API

**GET /api/admin/settings**
- Get all notification settings
- Requires authentication
- Returns: Object with setting key-value pairs

**POST /api/admin/settings**
- Update notification settings
- Requires authentication
- Body: Object with settings to update
- Returns: Success message

**POST /api/admin/test-email**
- Send test email
- Requires authentication
- Body: `{ email: "test@example.com" }`
- Returns: Success/error message

---

## Deployment Considerations

### Render.com Environment Variables

Add these to your Render dashboard:

```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Vilva Greenhouse Farm <your-email@gmail.com>
ADMIN_EMAIL=admin@example.com
```

### Security Best Practices

1. **Never commit .env files** - Already in .gitignore
2. **Use app-specific passwords** - Never use main account password
3. **Rotate passwords regularly** - Generate new app password periodically
4. **Limit access** - Only authorized admins should access settings
5. **Monitor usage** - Gmail free tier has 500/day limit

### Alternative Email Services

**SendGrid** (Recommended for high volume):
- Free tier: 100 emails/day
- Paid: $19.95/month for 40,000 emails
- Better deliverability than Gmail
- Setup: Replace nodemailer-gmail with nodemailer-sendgrid

**AWS SES** (Enterprise):
- $0.10 per 1,000 emails
- Requires AWS account
- Best for large-scale operations

---

## Future Enhancements (Phase 3)

- [ ] WhatsApp Business API integration (automated sending)
- [ ] SMS notifications via Twilio
- [ ] Push notifications for mobile app
- [ ] Notification scheduling (reminders)
- [ ] Email templates customization in UI
- [ ] Notification logs and analytics
- [ ] Unsubscribe functionality for customers
- [ ] Email verification for new customers

---

## Support

For issues or questions:
1. Check server console logs for detailed error messages
2. Verify environment variables are set correctly
3. Test with different email addresses
4. Review this documentation
5. Check Gmail account security settings

---

**Last Updated**: January 2025
**Version**: 1.0
