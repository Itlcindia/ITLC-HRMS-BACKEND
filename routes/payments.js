const express = require('express');
const router = express.Router();
const https = require('https');

const KEY_ID = process.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TZtOW3aeVNZT0s';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '6rG2BpqWUfYt7Buiz492jNCl';

// 1. Create Razorpay Order
router.post('/create-order', (req, res) => {
  try {
    const { amount, currency = 'INR', planId, companyName } = req.body;
    const amountInPaise = Math.round((parseFloat(amount) || 1) * 100);

    const postData = JSON.stringify({
      amount: amountInPaise < 100 ? 100 : amountInPaise,
      currency,
      receipt: 'rcpt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      payment_capture: 1,
      notes: {
        company: companyName || 'ITLC Enterprise',
        plan: planId || 'standard'
      }
    });

    const auth = Buffer.from(KEY_ID + ':' + KEY_SECRET).toString('base64');

    const options = {
      hostname: 'api.razorpay.com',
      port: 443,
      path: '/v1/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + auth,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const razorpayReq = https.request(options, (razorpayRes) => {
      let body = '';
      razorpayRes.on('data', (chunk) => body += chunk);
      razorpayRes.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (razorpayRes.statusCode >= 200 && razorpayRes.statusCode < 300) {
            return res.json({ success: true, order: parsed });
          } else {
            console.error('Razorpay order creation error:', parsed);
            return res.status(razorpayRes.statusCode || 400).json({ success: false, error: parsed });
          }
        } catch (e) {
          return res.status(500).json({ success: false, error: 'Failed to parse Razorpay response' });
        }
      });
    });

    razorpayReq.on('error', (e) => {
      console.error('Razorpay request failed:', e);
      res.status(500).json({ success: false, error: e.message });
    });

    razorpayReq.write(postData);
    razorpayReq.end();
  } catch (err) {
    console.error('Create order exception:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Verify Razorpay Payment
router.post('/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_payment_id) {
    return res.status(400).json({ success: false, message: 'Missing payment ID' });
  }
  return res.json({
    success: true,
    verified: true,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id
  });
});

module.exports = router;
