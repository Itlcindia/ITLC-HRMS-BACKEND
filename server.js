require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const sequelize = require('./config/db');
const { xssSanitizer } = require('./middleware/security');

const { swaggerSpec, getSwaggerHtml, getDashboardHtml, printServerBanner } = require('./utils/swaggerDocs');

const app = express();

// Anti-Hacking HTTP Security Headers (XSS, CSP, HSTS, Sniffing prevention)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: '*', // Allow all origins or specify domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// JSON body parser with size limit to prevent payload flood attacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parameter pollution protection
app.use(hpp());

// XSS & Script Injection Sanitizer for all incoming payloads
app.use(xssSanitizer);

// Global API Rate Limiter (600 requests per 15 mins per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', globalLimiter);

// Strict Auth Rate Limiter to stop brute force & dictionary attacks (30 attempts per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Rate limit exceeded. Please try again after 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register-superowner', authLimiter);
app.use('/api/auth/register-company', authLimiter);

// Load models to ensure sync
require('./models/Attendance');
require('./models/Task');
require('./models/PerformanceReview');
require('./models/Meeting');
require('./models/Asset');
require('./models/Announcement');
require('./models/CorrectionRequest');

// Synchronize database
sequelize.sync({ force: false })
  .then(async () => {
    console.log('🔒 Database schemas synchronized with Security Layer');
    
    // Alter employees table
    try {
      await sequelize.query("ALTER TABLE employees MODIFY COLUMN company_id VARCHAR(255) NULL;");
    } catch (err) {}

    // Security alters for encrypted fields
    const securityColumnAlters = [
      "ALTER TABLE employees MODIFY COLUMN salary TEXT;",
      "ALTER TABLE employees MODIFY COLUMN phone TEXT;",
      "ALTER TABLE employees MODIFY COLUMN dob TEXT;",
      "ALTER TABLE employees MODIFY COLUMN address TEXT;",
      "ALTER TABLE companies MODIFY COLUMN phone TEXT;",
      "ALTER TABLE companies MODIFY COLUMN gst TEXT;",
      "ALTER TABLE companies MODIFY COLUMN address TEXT;"
    ];

    for (const q of securityColumnAlters) {
      try {
        await sequelize.query(q);
      } catch (err) {}
    }

    // Alter support_tickets table
    try {
      await sequelize.query("ALTER TABLE support_tickets ADD COLUMN company_id VARCHAR(255) DEFAULT '';");
    } catch (err) {}

    // Alter leave_requests table
    try {
      await sequelize.query("ALTER TABLE leave_requests ADD COLUMN company_id VARCHAR(255) DEFAULT '';");
    } catch (err) {}

    // Alter expense_claims table
    try {
      await sequelize.query("ALTER TABLE expense_claims ADD COLUMN company_id VARCHAR(255) DEFAULT '';");
    } catch (err) {}

    // Alter companies table with new SaaS columns
    const companyAlters = [
      "ALTER TABLE companies ADD COLUMN gst VARCHAR(255) DEFAULT '';",
      "ALTER TABLE companies ADD COLUMN address TEXT;",
      "ALTER TABLE companies ADD COLUMN country VARCHAR(255) DEFAULT '';",
      "ALTER TABLE companies ADD COLUMN state VARCHAR(255) DEFAULT '';",
      "ALTER TABLE companies ADD COLUMN city VARCHAR(255) DEFAULT '';",
      "ALTER TABLE companies ADD COLUMN timezone VARCHAR(255) DEFAULT 'UTC';",
      "ALTER TABLE companies ADD COLUMN currency VARCHAR(255) DEFAULT 'USD';",
      "ALTER TABLE companies ADD COLUMN subscription_plan_id VARCHAR(255) DEFAULT 'starter';",
      "ALTER TABLE companies ADD COLUMN max_employees INT DEFAULT 100;",
      "ALTER TABLE companies ADD COLUMN storage_limit FLOAT DEFAULT 50.0;",
      "ALTER TABLE companies ADD COLUMN storage_used FLOAT DEFAULT 0.0;",
      "ALTER TABLE companies ADD COLUMN status ENUM('active', 'suspended', 'trial', 'expired') DEFAULT 'trial';",
      "ALTER TABLE companies ADD COLUMN created_date VARCHAR(255);"
    ];

    for (const q of companyAlters) {
      try {
        await sequelize.query(q);
      } catch (err) {}
    }

    // Alter leave_requests table with manager_status and manager_comment columns
    const leaveAlters = [
      "ALTER TABLE leave_requests ADD COLUMN manager_status VARCHAR(255) DEFAULT 'Pending';",
      "ALTER TABLE leave_requests ADD COLUMN manager_comment TEXT;"
    ];
    for (const q of leaveAlters) {
      try {
        await sequelize.query(q);
      } catch (err) {}
    }
  })
  .catch(err => console.error('Database sync error:', err));

// Routes Configuration
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/employee', require('./routes/employee'));
app.use('/api/superowner', require('./routes/superowner'));
app.use('/api/manager', require('./routes/manager'));
app.use('/api/payments', require('./routes/payments'));

const PORT = process.env.PORT || 5000;

// System Health & Diagnostics
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ITLC Enterprise HRMS & CRM Platform',
    version: '4.0-ENTERPRISE-PRO',
    uptime: `${((process.uptime() || 0) / 60).toFixed(1)}m`,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Swagger OpenAPI 3.0 Specification JSON
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// Interactive Swagger UI API Docs
app.get(['/api-docs', '/docs'], (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getSwaggerHtml('/api/swagger.json'));
});

// Interactive Enterprise API Dashboard
app.get(['/', '/api/dashboard'], (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getDashboardHtml({ port: PORT }));
});

app.listen(PORT, () => {
  printServerBanner(PORT);
});
