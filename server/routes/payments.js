const express = require('express');
const router = express.Router();
const { processStripePayment, confirmStripePayment } = require('../services/paymentService');

// Create payment intent for Stripe
router.post('/stripe/create-intent', async (req, res) => {
  const { amount, currency = 'usd', description } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  const result = await processStripePayment(amount, currency, description);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// Confirm Stripe payment
router.post('/stripe/confirm', async (req, res) => {
  const { paymentIntentId, paymentMethodId } = req.body;

  if (!paymentIntentId || !paymentMethodId) {
    return res.status(400).json({ error: 'Payment intent ID and payment method ID are required' });
  }

  const result = await confirmStripePayment(paymentIntentId, paymentMethodId);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json({ error: result.error });
  }
});

module.exports = router;
