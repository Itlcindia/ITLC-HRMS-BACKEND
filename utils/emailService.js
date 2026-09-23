const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

let dbSettings = {};
try {
  const dbPath = path.join(__dirname, '..', 'database.json');
  if (fs.existsSync(dbPath)) {
    const raw = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    dbSettings = raw.globalSettings || {};
  }
} catch {}

// Load environment credentials or default to database.json / Hostinger settings
const smtpHost = (process.env.SMTP_HOST || dbSettings.smtpHost || dbSettings.smtpServer || 'smtp.hostinger.com').trim();
const smtpPort = parseInt(process.env.SMTP_PORT || dbSettings.smtpPort || '465');
const smtpUser = (process.env.SMTP_USER || dbSettings.smtpUser || dbSettings.smtpEmail || 'no-reply@itlcindia.com').trim();
const smtpPass = (process.env.SMTP_PASS || dbSettings.smtpPass || dbSettings.smtpPassword || 'Itlc@122').trim();
const smtpFrom = (process.env.SMTP_FROM || dbSettings.smtpFrom || `"ITLC Enterprise HRMS" <${smtpUser}>`).trim();

let transporter;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
  console.log("Email Service initialized with Hostinger SMTP settings.");
} else {
  console.log("Email Service: No SMTP credentials found. Falling back to console logger.");
}

/**
 * Send subscription expiry warning email to the company sub-admin
 * @param {string} toEmail Email of the sub-admin/owner
 * @param {string} ownerName Name of the owner
 * @param {string} companyName Name of the company
 * @param {string} expiryDate Date the subscription ends
 */
async function sendSubscriptionWarningEmail(toEmail, ownerName, companyName, expiryDate) {
  const mailOptions = {
    from: `"ITLC HRMS Support" <${smtpFrom}>`,
    to: toEmail,
    subject: 'Action Required: Your ITLC HRMS Subscription Expires in 2 Days!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin: 0;">ITLC HRMS Portal</h2>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888888;">Subscription Expiration Notice</span>
        </div>
        
        <p>Dear <strong>${ownerName}</strong>,</p>
        
        <p>We are writing to inform you that the subscription plan for <strong>${companyName}</strong> is scheduled to expire on <strong>${expiryDate}</strong> (in exactly 2 days).</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <strong style="color: #991b1b; display: block; font-size: 14px; margin-bottom: 4px;">⚠️ Action Required</strong>
          <span style="color: #7f1d1d; font-size: 13px;">To prevent any disruption to your company's HR workflow and employee login access, please purchase or renew your subscription plan today.</span>
        </div>
        
        <p>You can upgrade or renew directly from the <strong>Billing & Subscriptions</strong> tab in your Company Admin Dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="#" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);">Renew Subscription Now</a>
        </div>
        
        <p style="font-size: 12px; color: #666666; margin-top: 30px; border-t: 1px solid #eeeeee; padding-top: 15px;">
          Thank you for choosing ITLC HRMS.<br />
          <em>ITLC Support Team</em>
        </p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Warning email sent successfully to sub-admin at: ${toEmail}`);
      return true;
    } catch (err) {
      console.error(`Failed to send warning email to ${toEmail}:`, err.message);
      return false;
    }
  } else {
    console.log("============= EMAIL MOCK SENT =============");
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Content Body:\n${mailOptions.html.replace(/<[^>]*>/g, '')}`);
    console.log("===========================================");
    return true;
  }
}

/**
 * Send a generic broadcast announcement email to an employee
 * @param {string} toEmail Recipient email
 * @param {string} subject Email subject
 * @param {string} content Message content
 * @param {string} adminName Sender display name
 * @param {string} adminEmail Sender email address (used as Reply-To)
 */
async function sendBroadcastEmail(toEmail, subject, content, adminName, adminEmail) {
  const fromHeader = adminName ? `"${adminName} via ITLC HRMS" <${smtpFrom}>` : `"ITLC HRMS Support" <${smtpFrom}>`;
  const mailOptions = {
    from: fromHeader,
    to: toEmail,
    replyTo: adminEmail || smtpFrom,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin: 0;">ITLC HRMS Announcement</h2>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-wrap;">${content}</p>
        
        <p style="font-size: 12px; color: #666666; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px;">
          Best regards,<br />
          <strong>${adminName || 'ITLC HRMS Support'}</strong>
        </p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (err) {
      console.error(`Failed to send broadcast email to ${toEmail}:`, err.message);
      return false;
    }
  } else {
    console.log("============= BROADCAST EMAIL MOCK SENT =============");
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Sender: ${fromHeader}`);
    console.log(`Body: ${content}`);
    console.log("===========================================");
    return true;
  }
}

/**
 * Send welcome email to a newly onboarded employee with login credentials
 * @param {string} toEmail Employee email
 * @param {string} empName Employee name
 * @param {string} companyName Company name
 * @param {string} empId Employee ID (Username)
 * @param {string} password Temporary password
 * @param {string} adminName Sender display name
 * @param {string} adminEmail Sender email address (used as Reply-To)
 */
async function sendEmployeeWelcomeEmail(toEmail, empName, companyName, empId, password, adminName, adminEmail) {
  const fromHeader = adminName ? `"${adminName} via ${companyName}" <${smtpFrom}>` : `"ITLC HRMS Support" <${smtpFrom}>`;
  const mailOptions = {
    from: fromHeader,
    to: toEmail,
    replyTo: adminEmail || smtpFrom,
    subject: `Welcome to ${companyName} - Your HRMS Login Credentials`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin: 0;">Welcome to ${companyName}</h2>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888888;">Employee HRMS Account Initialized</span>
        </div>
        
        <p>Dear <strong>${empName}</strong>,</p>
        
        <p>Your employee account has been created on the HRMS portal for <strong>${companyName}</strong>. You can now log in to view your attendance, manage leaves, download payslips, and check expenses.</p>
        
        <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 18px; margin: 20px 0; border-radius: 8px;">
          <strong style="color: #1f2937; display: block; font-size: 14px; margin-bottom: 10px;">🔑 Your Login Credentials:</strong>
          <table style="width: 100%; font-size: 13px; color: #4b5563; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; width: 140px;">Employee ID:</td>
              <td style="padding: 6px 0; font-family: monospace; font-size: 14px; color: #111827;">${empId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Registered Email:</td>
              <td style="padding: 6px 0; font-family: monospace; font-size: 14px; color: #111827;">${toEmail}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Password:</td>
              <td style="padding: 6px 0; font-family: monospace; font-size: 14px; color: #059669; font-weight: bold;">${password}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 12px; color: #ef4444; font-weight: bold; margin-top: 15px;">
          ⚠️ Note: For security reasons, please log in and change your password immediately after your first sign-in.
        </p>
        
        <p style="font-size: 12px; color: #666666; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px;">
          Best regards,<br />
          <strong>${companyName} Support Team</strong>
        </p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Welcome email with credentials sent to: ${toEmail}`);
      return true;
    } catch (err) {
      console.error(`Failed to send welcome email to ${toEmail}:`, err.message);
      return false;
    }
  } else {
    console.log("============= WELCOME EMAIL MOCK SENT =============");
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Credentials: ID=${empId}, Pass=${password}`);
    console.log("===========================================");
    return false;
  }
}

/**
 * Send an OTP code to a user for login verification
 * @param {string} toEmail Recipient email address
 * @param {string} userName Recipient name
 * @param {string} otpCode 6-digit numeric OTP code
 */
async function sendLoginOtpEmail(toEmail, userName, otpCode) {
  const mailOptions = {
    from: `"ITLC HRMS Verification" <${smtpFrom}>`,
    to: toEmail,
    subject: `Your ITLC HRMS Login OTP: ${otpCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin: 0;">ITLC HRMS Verification</h2>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888888;">Two-Factor Login Authentication</span>
        </div>
        
        <p>Dear <strong>${userName}</strong>,</p>
        
        <p>You have requested to sign in to the ITLC HRMS portal. Please use the following One-Time Password (OTP) to complete your login verification:</p>
        
        <div style="text-align: center; background-color: #f3f4f6; border: 1px dashed #6366f1; padding: 18px; margin: 25px 0; border-radius: 12px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #1e1b4b;">${otpCode}</span>
        </div>
        
        <p style="font-size: 13px; color: #ef4444; font-weight: bold;">
          ⚠️ This OTP is valid for the next 10 minutes. Do not share this code with anyone.
        </p>
        
        <p style="font-size: 12px; color: #666666; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px;">
          If you did not request this login attempt, please change your password immediately.<br />
          <em>ITLC HRMS Security Team</em>
        </p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Login OTP email successfully sent to: ${toEmail}`);
      return true;
    } catch (err) {
      console.error(`Failed to send login OTP email to ${toEmail}:`, err.message);
      return false;
    }
  } else {
    console.log("============= OTP EMAIL MOCK SENT =============");
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`OTP Code: ${otpCode}`);
    console.log("===========================================");
    return true;
  }
}

/**
 * Send a welcome email to a newly registered company admin
 * @param {string} toEmail Admin email
 * @param {string} ownerName Admin/Owner name
 * @param {string} companyName Company name
 * @param {string} adminId Admin employee ID
 */
async function sendCompanyWelcomeEmail(toEmail, ownerName, companyName, adminId) {
  const mailOptions = {
    from: `"ITLC HRMS Welcome" <${smtpFrom}>`,
    to: toEmail,
    subject: `Welcome to ITLC HRMS - ${companyName} Registered Successfully! 🎉`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
        
        <!-- Header Banner with Gradient -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">Welcome to ITLC HRMS</h2>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #e0e7ff; font-weight: 700; display: block; margin-top: 6px;">Company Workspace Initialized</span>
        </div>
        
        <!-- Main Body -->
        <div style="padding: 32px 24px;">
          <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-top: 0;">Dear <strong>${ownerName}</strong>,</p>
          
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">Congratulations! Your company, <strong style="color: #4f46e5;">${companyName}</strong>, has been successfully registered on the ITLC HRMS platform. Your digital workspace is now live and fully prepared for onboarding.</p>
          
          <!-- Credentials Box -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; margin: 28px 0; border-radius: 12px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <span style="font-size: 18px; margin-right: 8px;">🔑</span>
              <strong style="color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Admin Login Credentials:</strong>
            </div>
            
            <table style="width: 100%; font-size: 14px; color: #475569; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #64748b;">Admin ID:</td>
                <td style="padding: 8px 0; font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 800; color: #0f172a;">${adminId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Registered Email:</td>
                <td style="padding: 8px 0; font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 800; color: #0f172a;">${toEmail}</td>
              </tr>
            </table>
          </div>

          <!-- Call to Action Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://gold-stork-993357.hostingersite.com/" target="_blank" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);">
              Access Workspace Dashboard
            </a>
          </div>
          
          <!-- Security Notice -->
          <div style="border-left: 4px solid #f59e0b; background-color: #fffbeb; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
            <p style="font-size: 13px; color: #b45309; line-height: 1.5; margin: 0;">
              <strong>🛡️ Security Authentication:</strong> When you sign in for the first time (and every time you log in), a secure verification OTP code will be dispatched to this registered email address to verify your identity.
            </p>
          </div>
          
          <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 0;">If you did not request this registration, please contact our support team immediately.</p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center;">
          <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
            Thank you for choosing ITLC HRMS.<br />
            <strong>ITLC Support & Engineering Team</strong>
          </p>
          <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 12px;">© ${new Date().getFullYear()} ITLC. All rights reserved.</span>
        </div>

      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Company welcome email sent successfully to: ${toEmail}`);
      return true;
    } catch (err) {
      console.error(`Failed to send company welcome email to ${toEmail}:`, err.message);
      return false;
    }
  } else {
    console.log("============= COMPANY WELCOME EMAIL MOCK SENT =============");
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Admin ID: ${adminId}`);
    console.log("===========================================");
    return true;
  }
}

/**
 * Send a birthday wish email to an employee
 */
async function sendBirthdayWishEmail(toEmail, userName, companyName) {
  const mailOptions = {
    from: `"ITLC HRMS Celebrations" <${smtpFrom}>`,
    to: toEmail,
    subject: `Happy Birthday, ${userName}! 🎂✨`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="text-align: center; border-bottom: 2px solid #ec4899; padding-bottom: 20px; margin-bottom: 25px;">
          <h2 style="color: #ec4899; margin: 0; font-size: 26px;">🎉 Happy Birthday! 🎉</h2>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888888;">Warm Wishes from ${companyName}</span>
        </div>
        
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">Dear <strong>${userName}</strong>,</p>
        
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">On behalf of everyone at <strong>${companyName}</strong>, we wish you a very happy birthday filled with joy, laughter, and success!</p>
        
        <div style="background-color: #fdf2f8; border-left: 4px solid #ec4899; padding: 15px 20px; margin: 25px 0; border-radius: 0 12px 12px 0;">
          <p style="color: #9d174d; margin: 0; font-size: 16px; font-weight: bold; line-height: 1.5;">✨ May this year bring you closer to your dreams, success in your endeavors, and endless moments of happiness. We appreciate your dedication and are proud to have you on our team! ✨</p>
        </div>
        
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">Have a wonderful day and a spectacular year ahead!</p>
        
        <p style="font-size: 13px; color: #64748b; margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          Best wishes,<br />
          <strong>The Team at ${companyName}</strong>
        </p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Birthday wish email sent successfully to: ${toEmail}`);
      return true;
    } catch (err) {
      console.error(`Failed to send birthday wish email to ${toEmail}:`, err.message);
      return false;
    }
  } else {
    console.log("============= BIRTHDAY WISH EMAIL MOCK SENT =============");
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log("===========================================");
    return true;
  }
}

/**
 * Send a notification to the Company Admin about an employee's birthday
 */
async function sendAdminBirthdayNotificationEmail(adminEmail, adminName, employeeName, employeeId, companyName) {
  const mailOptions = {
    from: `"ITLC HRMS Celebrations" <${smtpFrom}>`,
    to: adminEmail,
    subject: `Alert: Today is ${employeeName}'s Birthday! 🎂`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 25px;">
          <h2 style="color: #3b82f6; margin: 0; font-size: 22px;">🎂 Team Birthday Alert 🎂</h2>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888888;">HRMS Automated Event Alert</span>
        </div>
        
        <p style="font-size: 15px; color: #334155;">Dear <strong>${adminName}</strong>,</p>
        
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">This is a friendly reminder that today is the birthday of your team member:</p>
        
        <div style="background-color: #eff6ff; border: 1px dashed #3b82f6; padding: 18px; margin: 20px 0; border-radius: 12px;">
          <table style="width: 100%; font-size: 14px; color: #1e3a8a; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; width: 140px;">Employee Name:</td>
              <td style="padding: 6px 0; font-weight: 500;">${employeeName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Employee ID:</td>
              <td style="padding: 6px 0; font-family: monospace;">${employeeId}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">The system has automatically dispatched a warm birthday wish email to them. Make sure to wish them personally and celebrate this special occasion with your team!</p>
        
        <p style="font-size: 13px; color: #64748b; margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          Warm regards,<br />
          <em>ITLC HRMS Celebrations</em>
        </p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Admin birthday notification sent successfully to: ${adminEmail}`);
      return true;
    } catch (err) {
      console.error(`Failed to send admin birthday notification to ${adminEmail}:`, err.message);
      return false;
    }
  } else {
    console.log("============= ADMIN BIRTHDAY NOTIFICATION MOCK SENT =============");
    console.log(`To: ${adminEmail}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log("===========================================");
    return true;
  }
}

module.exports = {
  sendSubscriptionWarningEmail,
  sendEmployeeWelcomeEmail,
  sendBroadcastEmail,
  sendLoginOtpEmail,
  sendCompanyWelcomeEmail,
  sendBirthdayWishEmail,
  sendAdminBirthdayNotificationEmail
};
