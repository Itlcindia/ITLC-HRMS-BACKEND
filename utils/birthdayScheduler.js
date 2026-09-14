const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const NotificationHistory = require('../models/NotificationHistory');
const { sendBirthdayWishEmail, sendAdminBirthdayNotificationEmail } = require('./emailService');

const LOG_FILE_PATH = path.join(__dirname, '../birthday_sent_log.json');

/**
 * Helper to load the birthday log
 */
function loadBirthdayLog() {
  try {
    if (fs.existsSync(LOG_FILE_PATH)) {
      const data = fs.readFileSync(LOG_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("[Birthday Scheduler] Failed to load birthday log:", err.message);
  }
  return {};
}

/**
 * Helper to save the birthday log
 */
function saveBirthdayLog(log) {
  try {
    // Keep only the last 7 days of logs to keep the file small
    const keys = Object.keys(log).sort();
    if (keys.length > 7) {
      const excessKeys = keys.slice(0, keys.length - 7);
      excessKeys.forEach(k => delete log[k]);
    }
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(log, null, 2), 'utf8');
  } catch (err) {
    console.error("[Birthday Scheduler] Failed to save birthday log:", err.message);
  }
}

/**
 * Parse date of birth and check if it matches today's month and day
 */
function isTodayBirthday(dobStr) {
  if (!dobStr) return false;
  
  const today = new Date();
  const tMonth = today.getMonth() + 1; // 1-12
  const tDay = today.getDate(); // 1-31
  
  // Clean string and split by common delimiters (- or /)
  const parts = dobStr.split(/[-/]/);
  if (parts.length < 2) return false;
  
  // Case 1: YYYY-MM-DD
  if (parts[0].length === 4) {
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return month === tMonth && day === tDay;
  }
  
  // Case 2: DD-MM-YYYY
  if (parts[parts.length - 1].length === 4) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    return month === tMonth && day === tDay;
  }

  // Fallback matching: check if formatted strings exist
  const formattedT1 = `${String(tDay).padStart(2, '0')}-${String(tMonth).padStart(2, '0')}`;
  const formattedT2 = `${String(tMonth).padStart(2, '0')}-${String(tDay).padStart(2, '0')}`;
  return dobStr.includes(formattedT1) || dobStr.includes(formattedT2);
}

/**
 * Scan active employees and automatically send birthday wishes and admin alerts
 */
async function checkAndSendBirthdayWishes() {
  try {
    console.log("[Birthday Scheduler] Starting daily birthday scan...");
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Load sent log
    const log = loadBirthdayLog();
    if (!log[todayStr]) {
      log[todayStr] = [];
    }
    
    // Fetch all active employees
    const activeEmployees = await Employee.findAll({
      where: {
        status: 'Active',
        dob: {
          [Op.ne]: null
        }
      }
    });

    console.log(`[Birthday Scheduler] Scanning ${activeEmployees.length} active employees with registered DOBs.`);

    for (const emp of activeEmployees) {
      if (isTodayBirthday(emp.dob)) {
        // Check if already sent today
        if (log[todayStr].includes(emp.id)) {
          console.log(`[Birthday Scheduler] Birthday wish already sent today to: ${emp.name} (${emp.id}). Skipping.`);
          continue;
        }

        console.log(`🎉 [Birthday Scheduler] Today is ${emp.name}'s birthday! (${emp.dob})`);

        // Fetch company name
        let companyName = "ITLC HRMS";
        if (emp.companyId) {
          const comp = await Company.findByPk(emp.companyId);
          if (comp) companyName = comp.name;
        }

        // 1. Send Birthday Wish to Employee
        await sendBirthdayWishEmail(emp.email, emp.name, companyName);

        // 2. Notify Company Admin(s)
        if (emp.companyId) {
          const admins = await Employee.findAll({
            where: {
              companyId: emp.companyId,
              role: 'Company Admin',
              status: 'Active'
            }
          });

          for (const admin of admins) {
            await sendAdminBirthdayNotificationEmail(
              admin.email,
              admin.name,
              emp.name,
              emp.id,
              companyName
            );
          }

          // 3. Create an In-App Notification history entry
          try {
            await NotificationHistory.create({
              id: `notif_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
              title: `Today is ${emp.name}'s Birthday! 🎂`,
              target: 'All Employees',
              channels: ['email', 'in_app'],
              senderName: 'System HR',
              companyId: emp.companyId
            });
          } catch (notifErr) {
            console.error("[Birthday Scheduler] Failed to write in-app notification:", notifErr.message);
          }
        }

        // Update log
        log[todayStr].push(emp.id);
        saveBirthdayLog(log);
      }
    }
    
    console.log("[Birthday Scheduler] Birthday scan complete.");
  } catch (err) {
    console.error("[Birthday Scheduler] Birthday scan failed:", err.message);
  }
}

/**
 * Register background birthday task
 */
function startBirthdayScheduler() {
  // Run 10 seconds after server startup
  setTimeout(checkAndSendBirthdayWishes, 10000);

  // Set daily interval check (24 hours)
  setInterval(checkAndSendBirthdayWishes, 24 * 60 * 60 * 1000);
  console.log("[Birthday Scheduler] Registered successfully (Scanning interval: 24h).");
}

module.exports = {
  startBirthdayScheduler,
  checkAndSendBirthdayWishes
};
