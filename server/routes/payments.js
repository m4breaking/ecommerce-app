const express = require('express');
const router = express.Router();
const { processStripePayment, confirmStripePayment } = require('../services/paymentService');
const { createBkashPayment, executeBkashPayment, queryBkashPayment } = require('../services/bkashService');

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

// Create bKash payment
router.post('/bkash/create', async (req, res) => {
  const { amount, callbackURL, merchantInvoiceNumber } = req.body;

  if (!amount || !callbackURL) {
    return res.status(400).json({ error: 'Amount and callback URL are required' });
  }

  const result = await createBkashPayment(amount, callbackURL, merchantInvoiceNumber);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// Execute bKash payment
router.post('/bkash/execute', async (req, res) => {
  const { paymentID, token } = req.body;

  if (!paymentID || !token) {
    return res.status(400).json({ error: 'Payment ID and token are required' });
  }

  const result = await executeBkashPayment(paymentID, token);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// Query bKash payment status
router.post('/bkash/query', async (req, res) => {
  const { paymentID, token } = req.body;

  if (!paymentID || !token) {
    return res.status(400).json({ error: 'Payment ID and token are required' });
  }

  const result = await queryBkashPayment(paymentID, token);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json({ error: result.error });
  }
});

module.exports = router;
