const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Process Stripe payment
const processStripePayment = async (amount, currency = 'usd', description = 'Order payment') => {
  try {
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency,
      description,
      metadata: {
        integration_check: 'accept_a_payment'
      }
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Stripe payment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Confirm Stripe payment (called from frontend with payment method)
const confirmStripePayment = async (paymentIntentId, paymentMethodId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(
      paymentIntentId,
      { payment_method: paymentMethodId }
    );

    if (paymentIntent.status === 'succeeded') {
      return {
        success: true,
        paymentIntentId: paymentIntent.id
      };
    } else {
      return {
        success: false,
        error: 'Payment not successful',
        status: paymentIntent.status
      };
    }
  } catch (error) {
    console.error('Stripe payment confirmation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  processStripePayment,
  confirmStripePayment
};
