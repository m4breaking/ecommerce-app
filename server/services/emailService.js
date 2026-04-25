const nodemailer = require('nodemailer');

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send order confirmation email
const sendOrderConfirmation = async (email, name, orderId, totalAmount, items) => {
  if (!email) {
    console.log('No email provided, skipping order confirmation');
    return;
  }

  try {
    const itemsList = items.map(item => 
      `<li>${item.product_name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`
    ).join('');

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Your Store" <noreply@yourstore.com>',
      to: email,
      subject: `Order Confirmation - Order #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Order Confirmation</h2>
          <p>Dear ${name},</p>
          <p>Thank you for your order! We've received your order #${orderId} and it's being processed.</p>
          
          <h3 style="color: #374151; margin-top: 20px;">Order Details</h3>
          <ul style="list-style: none; padding: 0;">
            ${itemsList}
          </ul>
          
          <p style="font-weight: bold; margin-top: 20px;">Total: $${totalAmount.toFixed(2)}</p>
          
          <p style="color: #6b7280; margin-top: 30px;">
            You can track your order status in your account or contact us if you have any questions.
          </p>
          
          <p style="color: #6b7280;">Best regards,<br>Your Store Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent to:', email);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};

// Send order status update email
const sendOrderStatusUpdate = async (email, name, orderId, status) => {
  if (!email) {
    console.log('No email provided, skipping status update');
    return;
  }

  try {
    const statusMessages = {
      pending: 'Your order has been received and is pending processing.',
      processing: 'Your order is being processed and will be shipped soon.',
      shipped: 'Your order has been shipped and is on its way to you!',
      delivered: 'Your order has been delivered. Thank you for shopping with us!',
      cancelled: 'Your order has been cancelled. If you have any questions, please contact us.'
    };

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Your Store" <noreply@yourstore.com>',
      to: email,
      subject: `Order Status Update - Order #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Order Status Update</h2>
          <p>Dear ${name},</p>
          <p>Your order #${orderId} status has been updated to: <strong>${status.toUpperCase()}</strong></p>
          <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
          
          <p style="color: #6b7280; margin-top: 30px;">
            If you have any questions, please don't hesitate to contact us.
          </p>
          
          <p style="color: #6b7280;">Best regards,<br>Your Store Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Order status update email sent to:', email);
  } catch (error) {
    console.error('Error sending status update email:', error);
  }
};

module.exports = {
  sendOrderConfirmation,
  sendOrderStatusUpdate
};
