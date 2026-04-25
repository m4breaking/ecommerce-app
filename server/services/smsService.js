const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
const sendSMS = async (to, message) => {
  if (!to || !message) {
    console.log('Missing phone number or message, skipping SMS');
    return;
  }

  // Format phone number if needed (add country code if missing)
  const formattedPhone = to.startsWith('+') ? to : `+88${to}`; // Assuming Bangladesh

  try {
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    console.log('SMS sent successfully:', response.sid);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    return { success: false, error: error.message };
  }
};

// Send order confirmation SMS
const sendOrderConfirmationSMS = async (phone, name, orderId, totalAmount) => {
  if (!phone) {
    console.log('No phone number provided, skipping order confirmation SMS');
    return;
  }

  const message = `Dear ${name}, Your order #${orderId} has been received. Total: $${totalAmount.toFixed(2)}. Thank you for shopping with us!`;

  return await sendSMS(phone, message);
};

// Send order status update SMS
const sendOrderStatusUpdateSMS = async (phone, name, orderId, status) => {
  if (!phone) {
    console.log('No phone number provided, skipping status update SMS');
    return;
  }

  const statusMessages = {
    pending: 'Your order has been received and is pending processing.',
    processing: 'Your order is being processed and will be shipped soon.',
    shipped: 'Your order has been shipped and is on its way to you!',
    delivered: 'Your order has been delivered. Thank you for shopping with us!',
    cancelled: 'Your order has been cancelled. Contact us if you have questions.'
  };

  const message = `Dear ${name}, Order #${orderId} status: ${status.toUpperCase()}. ${statusMessages[status] || 'Your order status has been updated.'}`;

  return await sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendOrderConfirmationSMS,
  sendOrderStatusUpdateSMS
};
