const axios = require('axios');

// bKash configuration
const BKASH_CONFIG = {
  baseURL: process.env.BKASH_SANDBOX === 'true' 
    ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' 
    : 'https://tokenized.pay.bka.sh/v1.2.0-beta',
  username: process.env.BKASH_USERNAME,
  password: process.env.BKASH_PASSWORD,
  appKey: process.env.BKASH_APP_KEY,
  appSecret: process.env.BKASH_APP_SECRET,
  merchantAPIKey: process.env.BKASH_MERCHANT_API_KEY,
  merchantSecret: process.env.BKASH_MERCHANT_SECRET
};

// Get bKash OAuth token
const getBkashToken = async () => {
  try {
    const response = await axios.post(
      `${BKASH_CONFIG.baseURL}/tokenized/checkout/token/grant`,
      {
        app_key: BKASH_CONFIG.appKey,
        app_secret: BKASH_CONFIG.appSecret
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'username': BKASH_CONFIG.username,
          'password': BKASH_CONFIG.password
        }
      }
    );

    return response.data.id_token;
  } catch (error) {
    console.error('bKash token error:', error.response?.data || error.message);
    throw new Error('Failed to get bKash token');
  }
};

// Create bKash payment
const createBkashPayment = async (amount, callbackURL, merchantInvoiceNumber) => {
  try {
    const token = await getBkashToken();

    const response = await axios.post(
      `${BKASH_CONFIG.baseURL}/tokenized/checkout/create`,
      {
        mode: '0011',
        payerReference: ' ',
        callbackURL: callbackURL,
        amount: amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: merchantInvoiceNumber
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token,
          'X-APP-Key': BKASH_CONFIG.appKey
        }
      }
    );

    return {
      success: true,
      bkashURL: response.data.bkashURL,
      paymentID: response.data.paymentID,
      token
    };
  } catch (error) {
    console.error('bKash payment creation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Execute bKash payment (after user authorization)
const executeBkashPayment = async (paymentID, token) => {
  try {
    const response = await axios.post(
      `${BKASH_CONFIG.baseURL}/tokenized/checkout/execute`,
      { paymentID },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token,
          'X-APP-Key': BKASH_CONFIG.appKey
        }
      }
    );

    if (response.data.statusCode === '0000') {
      return {
        success: true,
        transactionId: response.data.transactionId,
        amount: response.data.amount
      };
    } else {
      return {
        success: false,
        error: response.data.statusMessage
      };
    }
  } catch (error) {
    console.error('bKash payment execution error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Query bKash payment status
const queryBkashPayment = async (paymentID, token) => {
  try {
    const response = await axios.post(
      `${BKASH_CONFIG.baseURL}/tokenized/checkout/payment/status`,
      { paymentID },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token,
          'X-APP-Key': BKASH_CONFIG.appKey
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('bKash payment query error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

module.exports = {
  createBkashPayment,
  executeBkashPayment,
  queryBkashPayment
};
