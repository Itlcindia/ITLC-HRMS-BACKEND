const { Op } = require('sequelize');
const Company = require('../models/Company');
const { sendSubscriptionWarningEmail } = require('./emailService');

/**
 * Queries database for companies expiring in exactly 2 days and emails their admins
 */
async function checkAndNotifyExpiringSubscriptions() {
  try {
    console.log("[Subscription Scheduler] Starting expiry verification scan...");
    
    // Calculate target date (exactly 2 days from today in YYYY-MM-DD format)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    console.log(`[Subscription Scheduler] Scanning for companies with expiry date: ${targetDateStr}`);
    
    const expiringCompanies = await Company.findAll({
      where: {
        subscriptionExpiresAt: targetDateStr,
        status: {
          [Op.ne]: 'expired'
        }
      }
    });
    
    console.log(`[Subscription Scheduler] Identified ${expiringCompanies.length} companies expiring on ${targetDateStr}.`);
    
    for (const company of expiringCompanies) {
      await sendSubscriptionWarningEmail(
        company.email,
        company.ownerName,
        company.name,
        company.subscriptionExpiresAt
      );
    }
    console.log("[Subscription Scheduler] Scan complete.");
  } catch (err) {
    console.error("[Subscription Scheduler] Scan failed:", err.message);
  }
}

/**
 * Initializes the background scheduler task (run immediately, then every 24 hours)
 */
function startSubscriptionScheduler() {
  // Execute scan 5 seconds after server startup
  setTimeout(checkAndNotifyExpiringSubscriptions, 5000);
  
  // Set recurring daily loop (24 hours in ms)
  setInterval(checkAndNotifyExpiringSubscriptions, 24 * 60 * 60 * 1000);
  console.log("[Subscription Scheduler] Registered successfully (Scanning interval: 24h).");
}

module.exports = {
  startSubscriptionScheduler,
  checkAndNotifyExpiringSubscriptions
};
