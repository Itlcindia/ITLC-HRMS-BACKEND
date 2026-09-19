const express = require('express');
const router = express.Router();
const https = require('https');

const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, '../database.json');

function getActiveRazorpayCredentials() {
  let keyId = '';
  let keySecret = '';
  try {
    if (fs.existsSync(DB_FILE)) {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (db.globalSettings?.razorpayKeyId && typeof db.globalSettings.razorpayKeyId === 'string' && db.globalSettings.razorpayKeyId.trim()) {
        keyId = db.globalSettings.razorpayKeyId.trim();
      }
      if (db.globalSettings?.razorpaySecret && typeof db.globalSettings.razorpaySecret === 'string' && db.globalSettings.razorpaySecret.trim()) {
        keySecret = db.globalSettings.razorpaySecret.trim();
      }
    }
  } catch (err) {}
  if (!keyId) {
    keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim();
  }
  if (!keySecret) {
    keySecret = (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || '').trim();
  }
  return { keyId, keySecret };
}

// 1. Create Razorpay Order
router.post('/create-order', (req, res) => {
  try {
    const { keyId, keySecret } = getActiveRazorpayCredentials();
    if (!keyId || !keySecret) {
      return res.status(400).json({
        success: false,
        error: 'Razorpay Gateway credentials are not configured in SuperOwner settings.'
      });
    }

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

    const auth = Buffer.from(keyId + ':' + keySecret).toString('base64');

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
            return res.json({ success: true, order: parsed, key: keyId });
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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, companyId, amount, currency } = req.body;
  if (!razorpay_payment_id) {
    return res.status(400).json({ success: false, message: 'Missing payment ID' });
  }

  let updatedCompany = null;
  let paymentRecord = null;
  try {
    if (fs.existsSync(DB_FILE)) {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      const compTarget = String(companyId || req.headers['x-tenant-id'] || '').toLowerCase().trim();
      let tenantIdx = (db.tenants || []).findIndex(t => 
        compTarget && (
          String(t.id || '').toLowerCase().trim() === compTarget ||
          String(t.adminEmail || '').toLowerCase().trim() === compTarget ||
          String(t.companyName || '').toLowerCase().trim() === compTarget ||
          String(t.name || '').toLowerCase().trim() === compTarget
        )
      );
      if (tenantIdx === -1 && (db.tenants || []).length > 0) {
        tenantIdx = 0;
      }
      const paidDateIso = new Date().toISOString();
      const activePlanId = planId || 'starter';
      if (tenantIdx !== -1) {
        db.tenants[tenantIdx] = {
          ...db.tenants[tenantIdx],
          status: 'active',
          subscriptionStatus: 'active',
          subscriptionPlanId: activePlanId,
          planId: activePlanId,
          plan: activePlanId,
          paidAt: paidDateIso,
          lastPayment: paidDateIso,
          transactionId: razorpay_payment_id,
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
        };
        updatedCompany = db.tenants[tenantIdx];

        const tId = String(db.tenants[tenantIdx].id);
        const tEmail = String(db.tenants[tenantIdx].adminEmail || db.tenants[tenantIdx].email || '').toLowerCase().trim();
        (db.users || []).forEach(u => {
          if (String(u.tenantId) === tId || String(u.companyId) === tId || (u.email && u.email.toLowerCase().trim() === tEmail)) {
            u.subscriptionStatus = 'active';
            u.subscriptionPlanId = activePlanId;
          }
        });
      }

      paymentRecord = {
        id: razorpay_payment_id,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        companyId: updatedCompany?.id || compTarget || 'comp_active',
        companyName: updatedCompany?.companyName || updatedCompany?.name || 'ITLC Client',
        amount: Number(amount || 499),
        currency: currency || 'INR',
        gateway: 'razorpay',
        status: 'successful',
        planId: activePlanId,
        transactionId: razorpay_payment_id,
        date: paidDateIso,
        createdAt: paidDateIso
      };
      db.payments = db.payments || [];
      db.payments.unshift(paymentRecord);
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Payment verify persistence error:', err);
  }

  return res.json({
    success: true,
    verified: true,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    company: updatedCompany,
    payment: paymentRecord,
    message: 'Payment verified and subscription unlocked successfully!'
  });
});

module.exports = router;
