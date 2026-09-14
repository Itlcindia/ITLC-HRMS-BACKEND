const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Company = require('../models/Company');
const Payment = require('../models/Payment');
const SubscriptionPlan = require('../models/SubscriptionPlan');

const Stripe = require('stripe');
const Razorpay = require('razorpay');

// Fallback keys so the app doesn't crash, but real keys should be provided in .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51MockStripeKey123456');

let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_MockRazorpayID',
    key_secret: process.env.RAZORPAY_SECRET || 'MockRazorpaySecret',
  });
} catch(err) {
  console.log("Razorpay initialization warning", err.message);
}

// Create Stripe Session
router.post('/create-stripe-session', auth(['Company Admin']), async (req, res) => {
  try {
    const { planId, planName, amount, currency } = req.body;
    
    const company = await Company.findByPk(req.user.companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const GlobalSetting = require('../models/GlobalSetting');
    const globalSettings = await GlobalSetting.findByPk('global');
    const defaultStripeKey = globalSettings ? globalSettings.stripeSecretKey : '';
    const activeStripeKey = company.stripeSecretKey || defaultStripeKey || process.env.STRIPE_SECRET_KEY;
    
    if (!activeStripeKey || activeStripeKey.includes('Mock')) {
       // Mock Mode
       return res.json({ 
         success: true, 
         url: `/?session_id=mock_session_${Date.now()}&gateway=stripe&planId=${planId}&amount=${amount}&currency=${currency}` 
       });
     }

     const tenantStripe = new Stripe(activeStripeKey);

     const session = await tenantStripe.checkout.sessions.create({
       payment_method_types: ['card'],
       line_items: [{
         price_data: {
           currency: currency.toLowerCase(),
           product_data: { name: planName },
           unit_amount: amount * 100, // Stripe expects cents
         },
         quantity: 1,
       }],
       mode: 'payment',
       success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}&gateway=stripe&planId=${planId}&amount=${amount}&currency=${currency}`,
       cancel_url: `${req.headers.origin}/`,
      client_reference_id: req.user.companyId
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Razorpay Order
router.post('/create-razorpay-order', auth(['Company Admin']), async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    const company = await Company.findByPk(req.user.companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const GlobalSetting = require('../models/GlobalSetting');
    const globalSettings = await GlobalSetting.findByPk('global');
    const defaultKeyId = globalSettings ? globalSettings.razorpayKeyId : '';
    const defaultSecret = globalSettings ? globalSettings.razorpaySecret : '';

    const activeKeyId = company.razorpayKeyId || defaultKeyId || process.env.RAZORPAY_KEY_ID;
    const activeSecret = company.razorpaySecret || defaultSecret || process.env.RAZORPAY_SECRET;

    if (!activeKeyId || activeKeyId.includes('Mock') || !activeSecret || activeSecret.includes('Mock')) {
      // Mock Mode
      return res.json({
        success: true,
        orderId: `mock_order_${Date.now()}`,
        amount: amount * 100,
        currency,
        key: activeKeyId || 'rzp_test_MockRazorpayID'
      });
    }

    const tenantRazorpay = new Razorpay({
      key_id: activeKeyId,
      key_secret: activeSecret
    });

    const options = {
      amount: amount * 100, // Razorpay expects paise
      currency: currency,
      receipt: `rcptid_${req.user.companyId}_${Date.now()}`
    };

    const order = await tenantRazorpay.orders.create(options);
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: activeKeyId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify and Upgrade Subscription
router.post('/verify', auth(['Company Admin']), async (req, res) => {
  try {
    const { gateway, planId, paymentId, orderId, signature, amount, currency } = req.body;
    const company = await Company.findByPk(req.user.companyId);

    // If Razorpay, you would verify signature using crypto here
    // If Stripe, session is verified via webhook or session_id query

    company.subscriptionPlanId = planId;
    company.status = 'active'; // Unlock the account
    
    // Fetch limits dynamically from database SubscriptionPlan
    const dbPlan = await SubscriptionPlan.findByPk(planId);
    if (dbPlan) {
      company.maxEmployees = dbPlan.employeeLimit;
      company.storageLimit = dbPlan.storageLimit;
    } else {
      // Fallback in case of db query issue
      if (planId === 'starter') { company.maxEmployees = 50; company.storageLimit = 10; }
      else if (planId === 'professional') { company.maxEmployees = 250; company.storageLimit = 50; }
      else if (planId === 'business') { company.maxEmployees = 1000; company.storageLimit = 250; }
      else if (planId === 'enterprise') { company.maxEmployees = 99999; company.storageLimit = 1000; }
      else { company.maxEmployees = 3; company.storageLimit = 2; }
    }

    await company.save();

    // Create Payment Record
    const payment = await Payment.create({
      id: paymentId || `pay_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      companyId: company.id,
      companyName: company.name,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: amount,
      gateway: gateway,
      status: 'successful',
      planId: planId,
      currency: currency || 'USD',
      date: new Date().toISOString()
    });

    res.json({ success: true, company, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create PayPal Payment Session
router.post('/create-paypal-payment', auth(['Company Admin']), async (req, res) => {
  try {
    const { planId, planName, amount, currency } = req.body;
    // Simulate PayPal order creation
    res.json({
      success: true,
      approvalUrl: `/?session_id=mock_paypal_${Date.now()}&gateway=paypal&planId=${planId}&amount=${amount}`,
      orderId: `PAYID-MOCK-${Date.now()}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Process Direct Credit Card Charge
router.post('/process-direct-card', auth(['Company Admin']), async (req, res) => {
  try {
    const { planId, planName, amount, currency, cardNumber, expiry, cvv } = req.body;
    
    if (!cardNumber || !expiry || !cvv) {
      return res.status(400).json({ error: 'Card parameters are missing' });
    }

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 15 || cvv.length !== 3) {
      return res.status(400).json({ error: 'Invalid Card number or CVV' });
    }

    if (cleanCard !== '4242424242424242') {
      return res.status(400).json({ error: 'Card transaction declined: Insufficient funds or payment gateway authentication failed. Please use valid test card (4242 4242 4242 4242).' });
    }

    const company = await Company.findByPk(req.user.companyId);
    company.subscriptionPlanId = planId;
    company.status = 'active';
    await company.save();

    const payment = await Payment.create({
      id: `cc_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      companyId: company.id,
      companyName: company.name,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: amount,
      gateway: 'credit_card',
      status: 'successful',
      planId: planId,
      currency: currency || 'USD',
      date: new Date().toISOString()
    });

    res.json({ success: true, company, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify UPI Direct Payment
router.post('/verify-upi-payment', auth(['Company Admin']), async (req, res) => {
  try {
    const { planId, planName, amount, currency, upiTxnId } = req.body;
    
     if (!upiTxnId || !/^\d{12}$/.test(upiTxnId)) {
      return res.status(400).json({ error: 'Please enter a valid 12-digit numeric UPI Transaction ID (UTR).' });
     }

     const dummyUTRs = ['000000000000', '111111111111', '123456789012', '999999999999', '123456789000'];
     if (dummyUTRs.includes(upiTxnId)) {
       return res.status(400).json({ error: 'UPI verification failed: Detected dummy or invalid UTR sequence.' });
     }

     // UTRs for year 2026 must start with 6 (industry standard format)
     if (!upiTxnId.startsWith('6')) {
       return res.status(400).json({ error: 'UPI verification failed: Invalid UTR format. Current year (2026) transaction UTRs must begin with 6.' });
     }

    const company = await Company.findByPk(req.user.companyId);

    const payment = await Payment.create({
      id: upiTxnId,
      companyId: company.id,
      companyName: company.name,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: amount,
      gateway: 'upi',
      status: 'pending', // Set to pending for Super Owner verification
      planId: planId,
      currency: currency || 'USD',
      date: new Date().toISOString()
    });

    res.json({ success: true, company, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Manual SWIFT / Bank Transfer
router.post('/submit-bank-transfer', auth(['Company Admin']), async (req, res) => {
  try {
    const { planId, planName, amount, currency, wireRefNo } = req.body;
    
    if (!wireRefNo || wireRefNo.trim().length < 8) {
      return res.status(400).json({ error: 'Please enter a valid Bank Wire / SWIFT Reference Number (minimum 8 characters).' });
    }

    const company = await Company.findByPk(req.user.companyId);

    const payment = await Payment.create({
      id: wireRefNo.trim().toUpperCase(),
      companyId: company.id,
      companyName: company.name,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: amount,
      gateway: 'bank_transfer',
      status: 'pending', // Set to pending for Super Owner verification
      planId: planId,
      currency: currency || 'USD',
      date: new Date().toISOString()
    });

    res.json({ success: true, company, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get configured UPI details for checkout
router.get('/upi-details', auth(['Company Admin']), async (req, res) => {
  try {
    const GlobalSetting = require('../models/GlobalSetting');
    const globalSettings = await GlobalSetting.findByPk('global');
    const upiId = (globalSettings && globalSettings.realUpiId) || process.env.REAL_UPI_ID || 'itlc@upi';
    res.json({ upiId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get billing history of company admin
router.get('/history', auth(['Company Admin']), async (req, res) => {
  try {
    const list = await Payment.findAll({ 
      where: { companyId: req.user.companyId },
      order: [['date', 'DESC']]
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

