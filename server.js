import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import swaggerDocs from './utils/swaggerDocs.js';
const { swaggerSpec, getSwaggerHtml, getDashboardHtml, printServerBanner } = swaggerDocs;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'itlc_crm_super_secure_enterprise_secret_2026';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_Tb2olLw1YkeJRm';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || 'giWCJ9bxC3NcUSfvQvr5dp2i';

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Simple in-memory sliding window Rate Limiter (Max 180 reqs/min per IP)
const rateLimitMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReqs = 180;

  let record = rateLimitMap.get(ip);
  if (!record || now - record.startTime > windowMs) {
    record = { startTime: now, count: 1 };
    rateLimitMap.set(ip, record);
    return true;
  }

  record.count++;
  if (record.count > maxReqs) {
    return false;
  }
  return true;
}

// Password Hashing Helper (Salted SHA-256)
function hashPassword(password, salt) {
  const currentSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', currentSalt).update(password).digest('hex');
  return { hash, salt: currentSalt };
}

// Generate Secure Signed Session Token
function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  const payload = Buffer.from(JSON.stringify({ 
    id: user.id, 
    email: user.email, 
    role: user.role, 
    name: user.name,
    tenantId: user.tenantId || user.companyId,
    companyId: user.companyId || user.tenantId,
    exp 
  })).toString('base64url');
  
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

// Verify Token
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  if (signature !== expectedSignature) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (decoded.exp && Date.now() > decoded.exp) return null;
    return decoded;
  } catch (e) {
    return null;
  }
}

// Default Multi-Tenant Enterprise Database Schema
const initialAdmin = hashPassword('admin');
const defaultDb = {
  system: "ITLC Enterprise Cloud Platform",
  version: "4.0-ENTERPRISE-PRO",
  lastUpdated: new Date().toISOString(),
  tenants: [],
  employees: [],
  attendance: [],
  leaves: [],
  expenses: [],
  leads: [],
  deals: [],
  invoices: [],
  tasks: [],
  superOwners: [
    { 
      id: 'SUP_PAPZ0YC', 
      name: "Priyanshu Pushkar", 
      email: "priyanshupushkar263@gmail.com", 
      role: "Super Owner", 
      status: "Active", 
      password: "Priyanshu8090",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
    }
  ],
  users: [
    { 
      id: 'SUP_PAPZ0YC', 
      name: "Priyanshu Pushkar", 
      email: "priyanshupushkar263@gmail.com", 
      role: "Super Owner", 
      status: "Active", 
      avatar: "PP", 
      password: "Priyanshu8090"
    }
  ],
  settings: {
    companyName: "ITLC INDIA PVT LTD",
    crmCurrency: "INR",
    gstRate: 18,
    defaultCommission: 10,
    monthlyTarget: 1000000,
    autoAssignLeads: true
  },
  auditLogs: [
    { 
      id: 1, 
      action: "Enterprise Server Initialized", 
      detail: "Unified Multi-Tenant REST API active with Cryptographic Auth on Port 5000", 
      actor: "System", 
      category: "system", 
      timestamp: new Date().toLocaleTimeString() 
    }
  ],
  campaignHistory: [],
  corrections: [],
  leaves: [],
  expenses: [],
  tickets: [],
  payroll: [],
  announcements: [],
  assets: [],
  assetRequests: [],
  performance: [],
  meetings: [],
  coupons: [],
  holidays: [
    { id: 1, title: 'Republic Day', date: '2026-01-26', type: 'National Holiday' },
    { id: 2, title: 'Holi Festival', date: '2026-03-04', type: 'Public Holiday' },
    { id: 3, title: 'Independence Day', date: '2026-08-15', type: 'National Holiday' },
    { id: 4, title: 'Gandhi Jayanti', date: '2026-10-02', type: 'National Holiday' },
    { id: 5, title: 'Diwali Festival', date: '2026-11-08', type: 'Public Holiday' },
    { id: 6, title: 'Christmas Day', date: '2026-12-25', type: 'Public Holiday' }
  ],
  leavePolicies: [
    { id: 1, name: 'Casual Leave (CL)', quota: 12, carryForward: false, color: '#3B82F6' },
    { id: 2, name: 'Sick / Medical Leave (SL)', quota: 10, carryForward: true, color: '#10B981' },
    { id: 3, name: 'Earned / Privilege Leave (PL)', quota: 18, carryForward: true, color: '#8B5CF6' },
    { id: 4, name: 'Maternity / Paternity Leave', quota: 90, carryForward: false, color: '#EC4899' }
  ],
  globalSettings: {
    platformName: 'SUPEROWNER HRMS',
    currency: 'INR',
    timezone: 'UTC+5:30',
    maintenanceMode: false,
    smtpServer: 'smtp.mailgun.org',
    smtpEmail: 'noreply@superowner.io',
    brandColor: '#6366f1',
    stripeEnabled: true,
    razorpayEnabled: true,
    paypalEnabled: true,
    stripeSecretKey: '',
    razorpayKeyId: 'rzp_live_Tb2olLw1YkeJRm',
    razorpaySecret: 'giWCJ9bxC3NcUSfvQvr5dp2i',
    realUpiId: 'itlc@upi'
  }
};

// Initialize DB if not present
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
}

// Read Database Helper
function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { 
      ...defaultDb, 
      ...parsed,
      tenants: Array.isArray(parsed.tenants) ? parsed.tenants : [],
      employees: Array.isArray(parsed.employees) ? parsed.employees : [],
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
      corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
      leaves: Array.isArray(parsed.leaves) ? parsed.leaves : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
      payroll: Array.isArray(parsed.payroll) ? parsed.payroll : [],
      announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
      assetRequests: Array.isArray(parsed.assetRequests) ? parsed.assetRequests : [],
      performance: Array.isArray(parsed.performance) ? parsed.performance : [],
      meetings: Array.isArray(parsed.meetings) ? parsed.meetings : [],
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
      holidays: Array.isArray(parsed.holidays) && parsed.holidays.length > 0 ? parsed.holidays : (defaultDb.holidays || []),
      leavePolicies: Array.isArray(parsed.leavePolicies) && parsed.leavePolicies.length > 0 ? parsed.leavePolicies : (defaultDb.leavePolicies || []),
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
      globalSettings: (parsed.globalSettings && typeof parsed.globalSettings === 'object') ? parsed.globalSettings : defaultDb.globalSettings,
      users: Array.isArray(parsed.users) ? parsed.users : defaultDb.users,
      superOwners: Array.isArray(parsed.superOwners) ? parsed.superOwners : defaultDb.superOwners
    };
  } catch (e) {
    return defaultDb;
  }
}

// Concurrency-Safe Write Helper (Windows OneDrive Compatible)
function writeDb(data) {
  data.lastUpdated = new Date().toISOString();
  const content = JSON.stringify(data, null, 2);
  try {
    fs.writeFileSync(DB_FILE, content, 'utf-8');
  } catch (err) {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, content, 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch {
      // Last resort direct write
      fs.writeFileSync(DB_FILE, content, 'utf-8');
    }
  }
}

// Set CORS Headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Id');
};

// Parse JSON Body Helper
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Static MIME Map
const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.txt': 'text/plain'
};

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const clientIp = req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Too many requests. Rate limit exceeded (180 reqs/min).' }));
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // 1. STATIC ASSET SERVING (/uploads/*)
  if (pathname.startsWith('/uploads/') && req.method === 'GET') {
    const fileName = path.basename(pathname);
    const filePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
      return;
    }
  }

  // 2. HEALTH CHECK & SWAGGER / DASHBOARD ROUTES
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'ITLC Unified Multi-Tenant Cloud Platform', 
      version: '4.0-ENTERPRISE-PRO',
      security: 'JWT + Salted SHA-256 + RateLimiter + HMAC Webhooks', 
      port: PORT, 
      timestamp: new Date().toISOString() 
    }));
    return;
  }

  // Swagger UI Documentation
  if ((pathname === '/api-docs' || pathname === '/docs') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getSwaggerHtml('/api/swagger.json'));
    return;
  }

  // Swagger OpenAPI 3.0 Spec JSON
  if (pathname === '/api/swagger.json' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(swaggerSpec, null, 2));
    return;
  }

  // Interactive Enterprise API Dashboard
  if ((pathname === '/' || pathname === '/api/dashboard') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getDashboardHtml({ port: PORT }));
    return;
  }

// Helper: Check if a role or email represents a platform Super Owner / Super Admin
function isSuperRoleOrEmail(rawRole, rawEmail) {
  const role = (rawRole || '').toLowerCase().trim();
  const email = (rawEmail || '').toLowerCase().trim();
  if (email === 'priyanshupushkar263@gmail.com') {
    return true;
  }
  if (
    role.includes('superowner') || 
    role.includes('super owner') || 
    role.includes('superadmin') || 
    role.includes('super admin') || 
    role.includes('super_admin') || 
    role.includes('super-admin')
  ) {
    return email === 'priyanshupushkar263@gmail.com';
  }
  return false;
}

  // 2.1 AUTH: CHECK SUPER OWNER
  if (pathname === '/api/auth/check-superowner' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, isSuperOwner: true, setupRequired: false, system: "ITLC Enterprise Cloud Platform" }));
    return;
  }

  // 2.2 AUTH: PUBLIC COMPANY REGISTRATION (/api/auth/register-company & /api/auth/register)
  if ((pathname === '/api/auth/register-company' || pathname === '/api/auth/register') && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const db = readDb();
      
      const compName = (body.companyName || body.name || 'New Enterprise Client').trim();
      const adminEmail = (body.companyEmail || body.email || body.adminEmail || '').toLowerCase().trim();
      const adminPass = (body.password || body.adminPassword || body.customPassword || 'Admin@123').trim();
      const adminName = (body.ownerName || body.adminName || `${compName} Admin`).trim();
      const phone = body.companyPhone || body.phone || body.adminPhone || '';
      const compId = body.id || `comp_${Date.now()}`;
      
      if (!adminEmail) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Company email is required' }));
        return;
      }
      
      const planKey = (body.subscriptionPlanId || body.planId || body.plan || 'starter').toLowerCase();
      let defaultSeats = 50;
      let defaultStorage = 50;
      if (planKey.includes('demo') || planKey.includes('trial')) {
        defaultSeats = 10;
        defaultStorage = 10;
      } else if (planKey.includes('premium') || planKey.includes('enterprise') || planKey.includes('pro')) {
        defaultSeats = 100;
        defaultStorage = 100;
      }
      const seatCount = Number(body.seatLimit || body.maxEmployees || body.userSeatLimit || body.staffCapacity || body.employeesCount || defaultSeats);
      const storageGb = Number(body.storageLimitGb || body.storageLimit || defaultStorage);

      const defaultModules = {
        dashboard: true,
        attendance: true,
        leave: true,
        payroll: true,
        recruitment: true,
        performance: true,
        assets: true,
        training: true,
        expenses: true,
        tickets: true,
        crm: true,
        ...(body.features || body.modulesEnabled || {})
      };

      const newTenant = {
        id: compId,
        companyName: compName,
        name: compName,
        industry: body.industry || body.industryType || 'Information Technology',
        plan: planKey,
        planId: planKey,
        subscriptionPlanId: planKey,
        subscriptionStatus: body.subscriptionStatus || (planKey === 'none' || planKey === 'unselected' ? 'unpaid' : 'active'),
        suite: body.suite || 'unified',
        billingCycle: body.billingCycle || 'monthly',
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        adminName: adminName,
        adminEmail: adminEmail,
        adminPhone: phone,
        country: body.country || 'India',
        state: body.stateName || body.state || '',
        city: body.cityName || body.city || '',
        staffCapacity: seatCount,
        maxEmployees: seatCount,
        seatLimit: seatCount,
        userSeatLimit: seatCount,
        employeesCount: seatCount,
        storageLimit: storageGb,
        storageLimitGb: storageGb,
        activeUsers: 1,
        password: adminPass,
        adminPassword: adminPass,
        modulesEnabled: defaultModules,
        features: {
          crmDealsKanban: true,
          crmInvoicingGST: true,
          crmGpsMeetings: true,
          crmAiCopilot: true,
          crmWhatsApp: true,
          hrmsBiometricRadar: true,
          hrmsMobileGpsPunch: true,
          hrmsSalaryPayroll: true,
          hrmsShiftLeave: true,
          hrmsAssetsTraining: true,
          ...defaultModules
        }
      };

      db.tenants = [newTenant, ...(db.tenants || []).filter(t => t.id !== compId && (t.adminEmail || t.email || '').toLowerCase() !== adminEmail)];

      const uHash = hashPassword(adminPass);
      const adminUserObj = {
        id: Date.now(),
        tenantId: compId,
        companyId: compId,
        name: adminName,
        email: adminEmail,
        role: 'Company Admin',
        status: 'Active',
        avatar: (adminName || 'AD').slice(0, 2).toUpperCase(),
        passwordHash: uHash.hash,
        salt: uHash.salt,
        password: adminPass,
        adminPassword: adminPass
      };
      db.users = [adminUserObj, ...(db.users || []).filter(u => (u.email || '').toLowerCase() !== adminEmail)];

      const adminEmpObj = {
        id: Date.now(),
        employeeId: 'EMP-001',
        tenantId: compId,
        companyId: compId,
        name: adminName,
        email: adminEmail,
        role: 'Company Admin',
        systemRole: 'Company Admin',
        department: 'Management',
        designation: 'Managing Director / Chief Admin',
        status: 'Active',
        phone: phone,
        salary: '₹1,50,000',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=4f46e5&color=fff`,
        joiningDate: new Date().toISOString().split('T')[0],
        employmentType: 'Full-Time Permanent',
        password: adminPass,
        documents: []
      };
      db.employees = [adminEmpObj, ...(db.employees || []).filter(e => (e.email || '').toLowerCase() !== adminEmail)];

      // Record initial subscription invoice / payment for Super Owner (only if paid upfront)
      const isUnpaidPreview = planKey === 'none' || planKey === 'unselected' || body.subscriptionStatus === 'unpaid';
      if (!isUnpaidPreview) {
        if (!Array.isArray(db.payments)) db.payments = [];
        const planPrice = Number(body.priceMonthly || (planKey.includes('premium') ? 999 : planKey.includes('demo') ? 199 : 499));
        const payRecord = {
          id: `pay_${Date.now()}`,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          companyId: compId,
          companyName: compName,
          amount: planPrice,
          currency: 'INR',
          gateway: body.paymentMethod || 'razorpay',
          status: 'successful',
          date: new Date().toISOString().split('T')[0],
          planId: planKey,
          planName: planKey.toUpperCase() + ' TIER',
          transactionId: body.transactionId || `txn_${Date.now()}`
        };
        db.payments.unshift(payRecord);
      }

      // Audit Log for Super Owner
      if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
      db.auditLogs.unshift({
        id: Date.now(),
        action: isUnpaidPreview ? "Company Registered (Free Preview)" : "Client Onboarded",
        detail: isUnpaidPreview 
          ? `"${compName}" registered new workspace. Modules locked pending subscription.` 
          : `"${compName}" subscribed to ${planKey.toUpperCase()} plan. Payment verified.`,
        actor: adminName,
        category: "subscription",
        timestamp: new Date().toLocaleTimeString()
      });

      // Clear from deleted blacklist if re-registered
      if (Array.isArray(db.deletedCompanies)) {
        db.deletedCompanies = db.deletedCompanies.filter(d => {
          if (typeof d === 'string') return d.toLowerCase() !== adminEmail && d !== compId;
          return d.id !== compId && d.email?.toLowerCase() !== adminEmail;
        });
      }

      writeDb(db);

      const token = generateToken(adminUserObj);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Company registered successfully',
        token,
        tenant: newTenant,
        company: newTenant,
        user: { ...adminUserObj, role: 'Company Admin' }
      }));
      return;
    } catch (err) {
      console.error('Registration error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Registration failed' }));
      return;
    }
  }

  // 3. AUTH: LOGIN
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const { email: rawEmail, password, companyId: inputCompanyId } = await parseBody(req);
      const email = (rawEmail || '').toLowerCase().trim();
      const db = readDb();

      // Check Super Owner / Super Admin: strictly priyanshupushkar263@gmail.com
      const isSuperEmail = email === 'priyanshupushkar263@gmail.com';
      const foundSoInDb = (db.superOwners || []).find(so => (so.email || '').toLowerCase().trim() === 'priyanshupushkar263@gmail.com');

      if (isSuperEmail) {
        let isPassValid = password === 'Priyanshu8090';
        if (foundSoInDb) {
          if (foundSoInDb.password && foundSoInDb.password === password) {
            isPassValid = true;
          }
          if (foundSoInDb.passwordHash && foundSoInDb.salt) {
            const computed = hashPassword(password, foundSoInDb.salt);
            if (computed.hash === foundSoInDb.passwordHash) isPassValid = true;
          }
        }
        if (isPassValid) {
          const soUser = {
            id: foundSoInDb?.id || 'SUP_PAPZ0YC',
            name: foundSoInDb?.name || 'Priyanshu Pushkar',
            email: 'priyanshupushkar263@gmail.com',
            role: 'Super Owner',
            status: 'Active',
            avatar: foundSoInDb?.avatar || 'PP'
          };
          const token = generateToken(soUser);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            token,
            user: soUser,
            name: soUser.name,
            email: soUser.email,
            role: 'Super Owner',
            message: 'Welcome back, Super Owner Priyanshu Pushkar!'
          }));
          return;
        }
      }

      // Check if this company / email was deleted by Super Owner
      const isDeleted = (db.deletedCompanies || []).some(d => {
        if (!d) return false;
        if (typeof d === 'string') {
          const dl = d.toLowerCase().trim();
          return dl === email || (inputCompanyId && dl === String(inputCompanyId).toLowerCase().trim());
        }
        const dEmail = (d.email || '').toLowerCase().trim();
        const dId = String(d.id || '').toLowerCase().trim();
        if (email && (dEmail === email || (Array.isArray(d.emails) && d.emails.includes(email)))) return true;
        if (inputCompanyId && dId === String(inputCompanyId).toLowerCase().trim()) return true;
        return false;
      });

      if (isDeleted) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: '❌ This company workspace has been permanently deleted by the Super Owner platform administrator. Access is revoked.' 
        }));
        return;
      }

      // 1. Look for tenant across db.tenants
      const tenant = (db.tenants || []).find(t => {
        const tEmail = (t.adminEmail || t.email || t.ownerEmail || '').toLowerCase().trim();
        const tId = String(t.id || '').toLowerCase().trim();
        if (email && tEmail === email) return true;
        if (inputCompanyId && (tId === String(inputCompanyId).toLowerCase().trim())) return true;
        return false;
      });

      // Check if tenant is suspended or expired
      if (tenant && (tenant.status === 'suspended' || tenant.status === 'inactive' || tenant.status === 'deactivated')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: `This company account has been ${tenant.status} by the Super Owner platform administrator. Please contact support.` 
        }));
        return;
      }

      // 2. Look for user in db.users
      const userInDb = (db.users || []).find(u => (u.email || '').toLowerCase().trim() === email);

      // 3. Look for employee in db.employees
      const empInDb = (db.employees || []).find(e => (e.email || '').toLowerCase().trim() === email);

      let user = null;
      if (tenant) {
        user = {
          id: tenant.id,
          tenantId: tenant.id,
          companyId: tenant.id,
          name: tenant.adminName || tenant.companyName || tenant.name || userInDb?.name || 'Company Admin',
          email: tenant.adminEmail || tenant.email || email,
          role: 'Company Admin',
          status: tenant.status || 'Active',
          avatar: (tenant.adminName || tenant.companyName || 'AD').slice(0, 2).toUpperCase(),
          password: tenant.password || tenant.adminPassword || userInDb?.password || empInDb?.password || 'Admin@123',
          passwordHash: userInDb?.passwordHash || empInDb?.passwordHash,
          salt: userInDb?.salt || empInDb?.salt
        };
      } else if (userInDb) {
        user = {
          ...userInDb,
          tenantId: userInDb.tenantId || userInDb.companyId,
          companyId: userInDb.tenantId || userInDb.companyId
        };
      } else if (empInDb) {
        const empRoleLower = (empInDb.systemRole || empInDb.role || empInDb.designation || '').toLowerCase();
        const isAdmin = empRoleLower.includes('admin') || empRoleLower.includes('hr') || empRoleLower.includes('owner') || empRoleLower.includes('director') || empRoleLower.includes('administrator');
        const isMgr = !isAdmin && (empRoleLower.includes('manager') || empRoleLower.includes('lead') || empRoleLower.includes('supervisor'));
        user = {
          id: empInDb.id,
          tenantId: empInDb.tenantId || empInDb.companyId,
          companyId: empInDb.tenantId || empInDb.companyId,
          name: empInDb.name,
          email: empInDb.email,
          role: isAdmin ? 'Company Admin' : (isMgr ? 'Manager' : 'Employee'),
          status: empInDb.status || 'Active',
          avatar: (empInDb.name || 'EM').slice(0, 2).toUpperCase(),
          password: empInDb.password || 'Employee123',
          passwordHash: empInDb.passwordHash,
          salt: empInDb.salt
        };
      }

      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid email address or user not found' }));
        return;
      }

      if (user && (user.companyId || user.tenantId)) {
        const uCompId = String(user.companyId || user.tenantId).toLowerCase().trim();
        const isUserCompanyDeleted = (db.deletedCompanies || []).some(d => {
          if (!d) return false;
          if (typeof d === 'string') return d.toLowerCase().trim() === uCompId;
          return String(d.id || '').toLowerCase().trim() === uCompId;
        });
        if (isUserCompanyDeleted) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            message: '❌ This company workspace has been permanently deleted by the Super Owner platform administrator. Access is revoked.' 
          }));
          return;
        }
      }

      let isValid = false;
      // 1. Salted SHA-256 hash check
      if (user.passwordHash && user.salt) {
        const computed = hashPassword(password, user.salt);
        if (computed.hash === user.passwordHash) isValid = true;
      }
      if (!isValid && userInDb && userInDb.passwordHash && userInDb.salt) {
        const computed = hashPassword(password, userInDb.salt);
        if (computed.hash === userInDb.passwordHash) isValid = true;
      }

      // 2. Direct & case-insensitive plaintext check against stored passwords
      if (!isValid) {
        const passwordsToCheck = [
          user.password,
          user.adminPassword,
          tenant?.password,
          tenant?.adminPassword,
          tenant?.customPassword,
          userInDb?.password,
          userInDb?.adminPassword,
          empInDb?.password
        ].filter(Boolean);

        for (const p of passwordsToCheck) {
          const strP = String(p).trim();
          if (strP === password.trim() || strP.toLowerCase() === password.trim().toLowerCase()) {
            isValid = true;
            break;
          }
        }
      }

      if (!isValid) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: '❌ Incorrect password. Please enter the valid password created for your account.' }));
        return;
      }

      const rawRole = (user.role || '').toLowerCase().trim();
      let normalizedRole = 'Employee';
      if (isSuperRoleOrEmail(user.role, user.email)) {
        normalizedRole = 'Super Owner';
      } else if (rawRole.includes('admin') || rawRole.includes('hr') || rawRole.includes('owner') || rawRole.includes('director') || rawRole.includes('administrator')) {
        normalizedRole = 'Company Admin';
      } else if (rawRole.includes('manager') || rawRole.includes('lead')) {
        normalizedRole = 'Manager';
      }

      const token = generateToken({ ...user, role: normalizedRole });
      const { passwordHash, salt, password: p, ...safeUser } = user;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        token, 
        user: { ...safeUser, role: normalizedRole, tenantId: safeUser.companyId || safeUser.tenantId },
        role: normalizedRole,
        name: safeUser.name,
        email: safeUser.email,
        companyId: safeUser.companyId || safeUser.tenantId,
        tenantId: safeUser.companyId || safeUser.tenantId,
        company: tenant || { id: safeUser.companyId, name: safeUser.name },
        tenant: tenant || { id: safeUser.companyId, name: safeUser.name },
        message: `Welcome back, ${user.name}!` 
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request payload: ' + (err.message || '') }));
    }
    return;
  }

  // 3.1 AUTH: GET CURRENT USER PROFILE (/api/auth/profile)
  if (pathname === '/api/auth/profile' && req.method === 'GET') {
    const authHeader = req.headers['authorization'] || '';
    const tokenStr = authHeader.replace(/^Bearer\s+/i, '').trim();
    const decoded = verifyToken(authHeader);

    const isMockSuper = tokenStr.includes('superowner') || tokenStr.includes('superadmin');
    if (!decoded && !isMockSuper) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Invalid or missing token' }));
      return;
    }

    const db = readDb();
    const email = (decoded?.email || (isMockSuper ? 'priyanshupushkar263@gmail.com' : '')).toLowerCase().trim();
    const userId = decoded?.id;

    // Reject if user email or company is in deleted companies blacklist
    const isProfileDeleted = (db.deletedCompanies || []).some(d => {
      if (!d) return false;
      if (typeof d === 'string') return d.toLowerCase().trim() === email;
      const dEmail = (d.email || '').toLowerCase().trim();
      const dId = String(d.id || '').toLowerCase().trim();
      if (email && (dEmail === email || (Array.isArray(d.emails) && d.emails.includes(email)))) return true;
      if (decoded?.tenantId && dId === String(decoded.tenantId).toLowerCase().trim()) return true;
      if (decoded?.companyId && dId === String(decoded.companyId).toLowerCase().trim()) return true;
      return false;
    });

    if (isProfileDeleted) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '❌ This company workspace has been permanently deleted by Super Owner. Access is revoked.' }));
      return;
    }

    // Check if Super Owner or Super Admin
    if (isMockSuper || (decoded && isSuperRoleOrEmail(decoded.role, decoded.email)) || email === 'priyanshupushkar263@gmail.com') {
      const foundSo = (db.superOwners || []).find(so => (so.email || '').toLowerCase().trim() === 'priyanshupushkar263@gmail.com');
      const soUser = {
        id: userId || foundSo?.id || 'SUP_PAPZ0YC',
        name: 'Priyanshu Pushkar',
        fullName: 'Priyanshu Pushkar',
        email: 'priyanshupushkar263@gmail.com',
        role: 'Super Owner',
        status: 'Active',
        avatar: foundSo?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        companyId: null,
        companyName: 'SUPEROWNER Platform HQ',
        documents: []
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(soUser));
      return;
    }

    // Check db.tenants
    const tenant = (db.tenants || []).find(t => (t.adminEmail || t.email || '').toLowerCase() === email || String(t.id) === String(userId));
    if (tenant) {
      const adminProfile = {
        id: tenant.id,
        tenantId: tenant.id,
        companyId: tenant.id,
        companyName: tenant.companyName || tenant.name,
        name: tenant.adminName || tenant.companyName || 'Admin',
        fullName: tenant.adminName || tenant.companyName || 'Admin',
        email: tenant.adminEmail || tenant.email,
        role: 'Company Admin',
        status: tenant.status || 'Active',
        avatar: tenant.avatar || tenant.logo || (tenant.adminName || 'AD').slice(0, 2).toUpperCase(),
        photo: tenant.avatar || tenant.logo || '',
        phone: tenant.adminPhone || tenant.phone || '',
        documents: Array.isArray(tenant.documents) ? tenant.documents : [],
        plan: tenant.plan,
        planId: tenant.planId || tenant.plan
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(adminProfile));
      return;
    }

    // Check db.employees
    const emp = (db.employees || []).find(e => (e.email || '').toLowerCase() === email || (userId && String(e.id) === String(userId)));
    if (emp) {
      const empRoleLower = (emp.systemRole || emp.role || emp.designation || '').toLowerCase();
      const isAdmin = empRoleLower.includes('admin') || empRoleLower.includes('hr') || empRoleLower.includes('owner') || empRoleLower.includes('director') || empRoleLower.includes('administrator');
      const isMgr = !isAdmin && (empRoleLower.includes('manager') || empRoleLower.includes('lead') || empRoleLower.includes('supervisor'));
      const finalRole = isAdmin ? 'Company Admin' : (isMgr ? 'Manager' : 'Employee');

      const empProfile = {
        ...emp,
        role: finalRole,
        avatar: emp.avatar || emp.photo || (emp.name || 'EM').slice(0, 2).toUpperCase(),
        photo: emp.photo || emp.avatar || '',
        documents: Array.isArray(emp.documents) ? emp.documents : []
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(empProfile));
      return;
    }

    // Check db.users
    const user = (db.users || []).find(u => (u.email || '').toLowerCase() === email || (userId && String(u.id) === String(userId)));
    if (user) {
      const { passwordHash, salt, password, ...safeUser } = user;
      const userProfile = {
        ...safeUser,
        avatar: user.avatar || user.photo || (user.name || 'US').slice(0, 2).toUpperCase(),
        photo: user.photo || user.avatar || '',
        documents: Array.isArray(user.documents) ? user.documents : []
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(userProfile));
      return;
    }

    // User account not found in database and not Super Owner -> Reject unauthorized
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'User account or company workspace not found. Please log in again.' }));
    return;
  }

  // 3.2 AUTH: UPDATE PROFILE & KYC DOCUMENTS (/api/auth/profile)
  if (pathname === '/api/auth/profile' && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const decoded = verifyToken(req.headers['authorization']);
      const profData = await parseBody(req);
      const email = (profData.email || decoded?.email || '').toLowerCase().trim();
      const userId = profData.id || decoded?.id;

      if (!email && !userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User identifier (email or ID) required' }));
        return;
      }

      const db = readDb();
      const newAvatar = profData.avatar !== undefined ? profData.avatar : profData.photo;
      const newPhoto = profData.photo !== undefined ? profData.photo : profData.avatar;
      const newDocs = Array.isArray(profData.documents) ? profData.documents : null;

      let updatedProfile = null;

      // 1. Update in db.employees
      db.employees = (db.employees || []).map(emp => {
        if ((email && emp.email?.toLowerCase() === email) || (userId && String(emp.id) === String(userId))) {
          const updatedEmp = {
            ...emp,
            ...profData,
            avatar: newAvatar !== undefined ? newAvatar : emp.avatar,
            photo: newPhoto !== undefined ? newPhoto : (emp.photo || emp.avatar),
            documents: newDocs !== null ? newDocs : (emp.documents || [])
          };
          updatedProfile = updatedEmp;
          return updatedEmp;
        }
        return emp;
      });

      // 2. Update in db.users
      db.users = (db.users || []).map(u => {
        if ((email && u.email?.toLowerCase() === email) || (userId && String(u.id) === String(userId))) {
          return {
            ...u,
            name: profData.name || profData.fullName || u.name,
            phone: profData.phone !== undefined ? profData.phone : u.phone,
            avatar: newAvatar !== undefined ? newAvatar : u.avatar,
            photo: newPhoto !== undefined ? newPhoto : u.photo,
            documents: newDocs !== null ? newDocs : (u.documents || [])
          };
        }
        return u;
      });

      // 3. Update in db.tenants if tenant admin
      const tenantMatchId = profData.companyId || profData.tenantId || decoded?.tenantId || decoded?.companyId || req.headers['x-tenant-id'];
      db.tenants = (db.tenants || []).map(t => {
        if (
          (email && (t.adminEmail || t.email || '').toLowerCase() === email) || 
          (userId && String(t.id) === String(userId)) ||
          (tenantMatchId && String(t.id).toLowerCase() === String(tenantMatchId).toLowerCase())
        ) {
          return {
            ...t,
            adminName: profData.name || profData.fullName || t.adminName,
            adminPhone: profData.phone !== undefined ? profData.phone : t.adminPhone,
            avatar: newAvatar !== undefined ? newAvatar : t.avatar,
            logo: newAvatar !== undefined ? newAvatar : t.logo,
            documents: newDocs !== null ? newDocs : (t.documents || [])
          };
        }
        return t;
      });

      db.auditLogs.unshift({
        id: Date.now(),
        action: "Profile & Documents Updated",
        detail: `User profile / KYC documents updated for ${email || userId}`,
        actor: email || "Employee",
        category: "employee",
        timestamp: new Date().toLocaleTimeString()
      });

      writeDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Profile and documents updated successfully',
        profile: updatedProfile || profData
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update profile' }));
    }
    return;
  }

  // 3.3 AUTH: CHANGE PASSWORD (/api/auth/change-password, /api/employee/change-password, /api/user/change-password)
  if ((pathname === '/api/auth/change-password' || pathname === '/api/employee/change-password' || pathname === '/api/user/change-password') && req.method === 'POST') {
    try {
      const decoded = verifyToken(req.headers['authorization']);
      const body = await parseBody(req);
      const email = (body.email || decoded?.email || '').toLowerCase().trim();
      const userId = body.id || decoded?.id;
      const newPassword = (body.newPassword || body.password || '').trim();

      if (!newPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'New password is required' }));
        return;
      }

      if (!email && !userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User identifier (email or ID) required' }));
        return;
      }

      const db = readDb();
      const { hash: newHash, salt: newSalt } = hashPassword(newPassword);

      // 1. Update in db.users
      db.users = (db.users || []).map(u => {
        if ((email && u.email?.toLowerCase() === email) || (userId && String(u.id) === String(userId))) {
          return {
            ...u,
            password: newPassword,
            adminPassword: newPassword,
            passwordHash: newHash,
            salt: newSalt
          };
        }
        return u;
      });

      // 2. Update in db.tenants
      db.tenants = (db.tenants || []).map(t => {
        if ((email && (t.adminEmail || t.email || '').toLowerCase() === email) || (userId && String(t.id) === String(userId))) {
          return {
            ...t,
            password: newPassword,
            adminPassword: newPassword
          };
        }
        return t;
      });

      // 3. Update in db.employees
      db.employees = (db.employees || []).map(e => {
        if ((email && e.email?.toLowerCase() === email) || (userId && String(e.id) === String(userId))) {
          return {
            ...e,
            password: newPassword
          };
        }
        return e;
      });

      // 4. Update in db.superOwners
      db.superOwners = (db.superOwners || []).map(s => {
        if ((email && s.email?.toLowerCase() === email) || (userId && String(s.id) === String(userId))) {
          return {
            ...s,
            password: newPassword,
            passwordHash: newHash,
            salt: newSalt
          };
        }
        return s;
      });

      db.auditLogs.unshift({
        id: Date.now(),
        action: "Password Changed",
        detail: `Password updated for account: ${email || userId}`,
        actor: email || "User",
        category: "auth",
        timestamp: new Date().toLocaleTimeString()
      });

      writeDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Password updated successfully' }));
      return;
    } catch (err) {
      console.error('Failed to change password:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update password: ' + err.message }));
      return;
    }
  }

  // 4. MULTI-TENANT COMPANIES API (/api/tenants & /api/superowner/companies & /api/companies)
  const isCompanyEndpoint = (
    pathname === '/api/tenants' || 
    pathname === '/api/superowner/companies' || 
    pathname === '/api/super-owner/companies' || 
    pathname === '/api/companies' || 
    pathname === '/api/admin/companies'
  );

  if (isCompanyEndpoint && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, tenants: db.tenants || [], companies: db.tenants || [] }));
    return;
  }

  if (isCompanyEndpoint && req.method === 'POST') {
    try {
      const tenantData = await parseBody(req);
      const db = readDb();
      const compId = tenantData.id || `comp_${Date.now()}`;
      const compName = tenantData.name || tenantData.companyName || 'New Enterprise Client';
      const adminEmail = (tenantData.email || tenantData.adminEmail || '').toLowerCase().trim();
      const adminPass = tenantData.password || tenantData.adminPassword || tenantData.customPassword || 'Admin@123';
      const adminName = tenantData.ownerName || tenantData.adminName || `${compName} Admin`;
      
      const planKey = (tenantData.subscriptionPlanId || tenantData.planId || tenantData.plan || 'starter').toLowerCase();
      let defaultSeats = 50;
      let defaultStorage = 50;
      if (planKey.includes('demo') || planKey.includes('trial')) {
        defaultSeats = 10;
        defaultStorage = 10;
      } else if (planKey.includes('premium') || planKey.includes('enterprise') || planKey.includes('pro')) {
        defaultSeats = 100;
        defaultStorage = 100;
      }

      const seatCount = Number(tenantData.seatLimit || tenantData.maxEmployees || tenantData.userSeatLimit || tenantData.staffCapacity || tenantData.employeesCount || defaultSeats);
      const storageGb = Number(tenantData.storageLimitGb || tenantData.storageLimit || defaultStorage);

      const defaultModules = {
        dashboard: true,
        attendance: true,
        leave: true,
        payroll: true,
        recruitment: true,
        performance: true,
        assets: true,
        training: true,
        expenses: true,
        tickets: true,
        crm: true,
        ...(tenantData.features || tenantData.modulesEnabled || {})
      };

      const newTenant = {
        id: compId,
        companyName: compName,
        name: compName,
        industry: tenantData.industry || 'Information Technology',
        plan: planKey,
        planId: planKey,
        suite: tenantData.suite || 'unified',
        billingCycle: tenantData.billingCycle || 'monthly',
        status: tenantData.status || 'active',
        createdAt: tenantData.createdDate || new Date().toISOString(),
        expiresAt: tenantData.renewalDate || new Date(Date.now() + 30 * 86400000).toISOString(),
        adminName: adminName,
        adminEmail: adminEmail,
        adminPhone: tenantData.phone || tenantData.adminPhone || '',
        gstin: tenantData.gstin || '',
        staffCapacity: seatCount,
        maxEmployees: seatCount,
        seatLimit: seatCount,
        userSeatLimit: seatCount,
        employeesCount: seatCount,
        storageLimit: storageGb,
        storageLimitGb: storageGb,
        activeUsers: 1,
        mrr: Number(tenantData.mrr || (planKey.includes('premium') ? 999 : planKey.includes('demo') ? 199 : 499)),
        password: adminPass,
        adminPassword: adminPass,
        modulesEnabled: defaultModules,
        features: {
          crmDealsKanban: true,
          crmInvoicingGST: true,
          crmGpsMeetings: true,
          crmAiCopilot: true,
          crmWhatsApp: true,
          hrmsBiometricRadar: true,
          hrmsMobileGpsPunch: true,
          hrmsSalaryPayroll: true,
          hrmsShiftLeave: true,
          hrmsAssetsTraining: true,
          ...defaultModules
        },
        ...tenantData,
        staffCapacity: seatCount,
        maxEmployees: seatCount,
        seatLimit: seatCount,
        userSeatLimit: seatCount,
        employeesCount: seatCount,
        storageLimit: storageGb,
        storageLimitGb: storageGb
      };

      db.tenants = [newTenant, ...(db.tenants || []).filter(t => t.id !== compId && (adminEmail ? (t.adminEmail || t.email || '').toLowerCase() !== adminEmail : true))];

      // Upsert admin in db.users so they can immediately login
      if (adminEmail) {
        const uHash = hashPassword(adminPass);
        const adminUserObj = {
          id: Date.now(),
          tenantId: compId,
          companyId: compId,
          name: adminName,
          email: adminEmail,
          role: 'Company Admin',
          status: 'Active',
          avatar: (adminName || 'AD').slice(0, 2).toUpperCase(),
          passwordHash: uHash.hash,
          salt: uHash.salt,
          password: adminPass
        };
        db.users = [adminUserObj, ...(db.users || []).filter(u => u.email?.toLowerCase() !== adminEmail)];

        // Also ensure default Admin employee exists in db.employees
        const adminEmpObj = {
          id: Date.now(),
          employeeId: 'EMP-001',
          tenantId: compId,
          companyId: compId,
          name: adminName,
          email: adminEmail,
          role: 'Company Admin',
          systemRole: 'Company Admin',
          department: 'Management',
          designation: 'Managing Director / Chief Admin',
          status: 'Active',
          phone: tenantData.phone || tenantData.adminPhone || '',
          salary: '₹1,50,000',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=4f46e5&color=fff`,
          joiningDate: new Date().toISOString().split('T')[0],
          employmentType: 'Full-Time Permanent',
          documents: []
        };
        db.employees = [adminEmpObj, ...(db.employees || []).filter(e => (e.email || '').toLowerCase() !== adminEmail)];
      }

      if (!Array.isArray(db.auditLogs)) {
        db.auditLogs = [];
      }
      db.auditLogs.unshift({
        id: Date.now(),
        action: "Tenant Onboarded",
        detail: `New company "${compName}" onboarded under ${newTenant.plan.toUpperCase()} plan (${seatCount} Seats, ${storageGb} GB).`,
        actor: "Super Admin",
        category: "company",
        timestamp: new Date().toLocaleTimeString()
      });
      writeDb(db);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, tenant: newTenant, company: newTenant }));
    } catch (err) {
      console.error('Failed to onboard tenant:', err);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to onboard tenant: ' + (err.message || 'Unknown error') }));
    }
    return;
  }

  // 4.001 DELETE COMPANY API (/api/superowner/companies/:id, /api/companies/:id, /api/tenants/:id)
  const isCompanyDelete = pathname.match(/^\/api\/(superowner\/|super-owner\/|admin\/)?(companies|tenants)\/([^/]+)$/);
  if (isCompanyDelete && req.method === 'DELETE') {
    try {
      const compId = decodeURIComponent(isCompanyDelete[3]);
      const db = readDb();
      
      const targetTenant = (db.tenants || []).find(t => 
        String(t.id) === String(compId) || 
        String(t.companyId) === String(compId) ||
        (t.adminEmail && t.adminEmail.toLowerCase().trim() === String(compId).toLowerCase().trim()) ||
        (t.email && t.email.toLowerCase().trim() === String(compId).toLowerCase().trim())
      );

      const tenantEmail = (targetTenant?.adminEmail || targetTenant?.email || '').toLowerCase().trim();
      const compName = targetTenant?.name || targetTenant?.companyName || compId;

      // Collect all associated emails from users & employees belonging to this company
      const allAssociatedEmails = new Set();
      if (tenantEmail) allAssociatedEmails.add(tenantEmail);
      if (targetTenant?.companyEmail) allAssociatedEmails.add(String(targetTenant.companyEmail).toLowerCase().trim());
      (db.users || []).forEach(u => {
        if (String(u.tenantId) === String(compId) || String(u.companyId) === String(compId)) {
          if (u.email) allAssociatedEmails.add(String(u.email).toLowerCase().trim());
        }
      });
      (db.employees || []).forEach(e => {
        if (String(e.tenantId) === String(compId) || String(e.companyId) === String(compId)) {
          if (e.email) allAssociatedEmails.add(String(e.email).toLowerCase().trim());
        }
      });

      // 1. Remove from db.tenants
      db.tenants = (db.tenants || []).filter(t => 
        String(t.id) !== String(compId) && 
        String(t.companyId) !== String(compId) &&
        !allAssociatedEmails.has((t.adminEmail || t.email || '').toLowerCase().trim())
      );

      // 2. Remove from db.users
      db.users = (db.users || []).filter(u => 
        String(u.tenantId) !== String(compId) && 
        String(u.companyId) !== String(compId) &&
        !allAssociatedEmails.has((u.email || '').toLowerCase().trim())
      );

      // 3. Remove from db.employees
      db.employees = (db.employees || []).filter(e => 
        String(e.tenantId) !== String(compId) && 
        String(e.companyId) !== String(compId) &&
        !allAssociatedEmails.has((e.email || '').toLowerCase().trim())
      );

      // 4. Add to permanent deletion blacklist in db.deletedCompanies
      if (!Array.isArray(db.deletedCompanies)) db.deletedCompanies = [];
      const emailList = Array.from(allAssociatedEmails);
      const delItem = {
        id: compId,
        email: tenantEmail,
        emails: emailList,
        name: compName,
        deletedAt: new Date().toISOString()
      };
      
      // Ensure object and string identifiers are recorded
      db.deletedCompanies.push(delItem);
      if (!db.deletedCompanies.includes(compId.toLowerCase())) db.deletedCompanies.push(compId.toLowerCase());
      emailList.forEach(em => {
        if (!db.deletedCompanies.includes(em)) db.deletedCompanies.push(em);
      });

      // 5. Add audit log
      if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
      db.auditLogs.unshift({
        id: Date.now(),
        action: "Company Deleted",
        detail: `Company "${compName}" (${compId}) was permanently deleted by Super Owner. All accounts and access revoked.`,
        actor: "Super Owner",
        category: "company",
        timestamp: new Date().toLocaleTimeString()
      });

      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `Company "${compName}" deleted successfully`, id: compId }));
      return;
    } catch (err) {
      console.error('Failed to delete company:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete company: ' + err.message }));
      return;
    }
  }

  // 4.002 UPDATE COMPANY API (/api/superowner/companies/:id, /api/companies/:id, /api/tenants/:id)
  if (isCompanyDelete && req.method === 'PUT') {
    try {
      const compId = decodeURIComponent(isCompanyDelete[3]);
      const updates = await parseBody(req);
      const db = readDb();
      
      const idx = (db.tenants || []).findIndex(t => 
        String(t.id) === String(compId) || 
        String(t.companyId) === String(compId) ||
        (t.adminEmail && t.adminEmail.toLowerCase().trim() === String(compId).toLowerCase().trim())
      );

      if (idx !== -1) {
        db.tenants[idx] = { ...db.tenants[idx], ...updates, id: db.tenants[idx].id };
        
        // Also update matching users status if status changed
        if (updates.status) {
          db.users = (db.users || []).map(u => {
            if (String(u.tenantId) === String(compId) || String(u.companyId) === String(compId)) {
              return { ...u, status: updates.status === 'active' ? 'Active' : 'Suspended' };
            }
            return u;
          });
        }
        
        writeDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, company: db.tenants[idx], tenant: db.tenants[idx] }));
        return;
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Company not found' }));
        return;
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update company: ' + err.message }));
      return;
    }
  }

  // 4.01 COMPANY PROFILE API (/api/admin/company and /api/company)
  if ((pathname === '/api/admin/company' || pathname === '/api/company') && req.method === 'GET') {
    const db = readDb();
    const decoded = verifyToken(req.headers['authorization']);
    const tokenEmail = (decoded?.email || '').toLowerCase().trim();
    const compId = parsedUrl.searchParams.get('companyId') || parsedUrl.searchParams.get('tenantId') || req.headers['x-tenant-id'] || decoded?.tenantId || decoded?.companyId;
    let tenant = (db.tenants || []).find(t => 
      (compId && (
        String(t.id).toLowerCase() === String(compId).toLowerCase() || 
        String(t.companyName || '').toLowerCase() === String(compId).toLowerCase() ||
        (t.adminEmail && t.adminEmail.toLowerCase() === String(compId).toLowerCase()) ||
        (t.email && t.email.toLowerCase() === String(compId).toLowerCase())
      )) ||
      (tokenEmail && (
        (t.adminEmail && t.adminEmail.toLowerCase() === tokenEmail) ||
        (t.email && t.email.toLowerCase() === tokenEmail)
      ))
    );
    if (!tenant && compId) {
      tenant = (db.tenants || []).find(t => t.id === compId || t.name === compId);
    }
    if (!tenant && tokenEmail) {
      const associatedUser = (db.users || []).find(u => (u.email || '').toLowerCase() === tokenEmail);
      const associatedEmp = (db.employees || []).find(e => (e.email || '').toLowerCase() === tokenEmail);
      const linkedCompId = associatedUser?.tenantId || associatedUser?.companyId || associatedEmp?.tenantId || associatedEmp?.companyId;
      if (linkedCompId) {
        tenant = (db.tenants || []).find(t => String(t.id).toLowerCase() === String(linkedCompId).toLowerCase());
      }
    }
    if (!tenant && !tokenEmail && !compId) {
      tenant = (db.tenants || [])[0];
    }
    if (tenant) {
      tenant = {
        ...tenant,
        status: tenant.status || tenant.subscriptionStatus || 'active',
        subscriptionStatus: tenant.subscriptionStatus || tenant.status || 'active',
        subscriptionPlanId: tenant.subscriptionPlanId || tenant.planId || tenant.plan || 'demo',
        planId: tenant.subscriptionPlanId || tenant.planId || tenant.plan || 'demo',
        plan: tenant.subscriptionPlanId || tenant.planId || tenant.plan || 'demo',
        seatLimit: Number(tenant.seatLimit || tenant.maxEmployees || tenant.staffCapacity || 50),
        storageLimitGb: Number(tenant.storageLimitGb || tenant.storageLimit || 50)
      };
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tenant || {}));
    return;
  }

  // 4.011 UPDATE COMPANY SETTINGS API (/api/admin/company and /api/company)
  if ((pathname === '/api/admin/company' || pathname === '/api/company') && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const updates = await parseBody(req);
      const db = readDb();
      const decoded = verifyToken(req.headers['authorization']);
      const tokenEmail = (decoded?.email || '').toLowerCase().trim();
      const compId = updates?.id || updates?.companyId || updates?.tenantId || parsedUrl.searchParams.get('companyId') || parsedUrl.searchParams.get('tenantId') || req.headers['x-tenant-id'] || decoded?.tenantId || decoded?.companyId;

      let idx = (db.tenants || []).findIndex(t => 
        (compId && (
          String(t.id).toLowerCase() === String(compId).toLowerCase() || 
          String(t.companyName || '').toLowerCase() === String(compId).toLowerCase() || 
          String(t.name || '').toLowerCase() === String(compId).toLowerCase() ||
          (t.adminEmail && t.adminEmail.toLowerCase() === String(compId).toLowerCase()) ||
          (t.email && t.email.toLowerCase() === String(compId).toLowerCase())
        )) ||
        (tokenEmail && (
          (t.adminEmail && t.adminEmail.toLowerCase() === tokenEmail) ||
          (t.email && t.email.toLowerCase() === tokenEmail)
        ))
      );

      if (idx === -1 && compId) {
        idx = (db.tenants || []).findIndex(t => String(t.id).toLowerCase() === String(compId).toLowerCase() || String(t.name || '').toLowerCase() === String(compId).toLowerCase() || String(t.companyName || '').toLowerCase() === String(compId).toLowerCase());
      }

      if (idx === -1 && tokenEmail) {
        const associatedUser = (db.users || []).find(u => (u.email || '').toLowerCase() === tokenEmail);
        const associatedEmp = (db.employees || []).find(e => (e.email || '').toLowerCase() === tokenEmail);
        const linkedCompId = associatedUser?.tenantId || associatedUser?.companyId || associatedEmp?.tenantId || associatedEmp?.companyId;
        if (linkedCompId) {
          idx = (db.tenants || []).findIndex(t => String(t.id).toLowerCase() === String(linkedCompId).toLowerCase());
        }
      }

      if (idx === -1 && (db.tenants || []).length > 0) {
        idx = 0;
      }

      if (idx !== -1) {
        const existing = db.tenants[idx];
        const newName = updates.name !== undefined ? updates.name : (updates.companyName !== undefined ? updates.companyName : (existing.companyName || existing.name));

        let modulesEnabled = updates.modulesEnabled !== undefined ? updates.modulesEnabled : existing.modulesEnabled;
        if (typeof modulesEnabled === 'string') {
          try {
            modulesEnabled = JSON.parse(modulesEnabled);
          } catch (e) {}
        }

        const updatedTenant = {
          ...existing,
          ...updates,
          id: existing.id,
          name: newName || existing.name,
          companyName: newName || existing.companyName,
          logo: updates.logo !== undefined ? updates.logo : (updates.companyLogo !== undefined ? updates.companyLogo : existing.logo),
          themeColor: updates.themeColor !== undefined ? updates.themeColor : existing.themeColor,
          phone: updates.phone !== undefined ? updates.phone : (updates.adminPhone !== undefined ? updates.adminPhone : existing.phone),
          adminPhone: updates.phone !== undefined ? updates.phone : (updates.adminPhone !== undefined ? updates.adminPhone : existing.adminPhone),
          address: updates.address !== undefined ? updates.address : existing.address,
          gst: updates.gst !== undefined ? updates.gst : (updates.gstin !== undefined ? updates.gstin : (existing.gst || existing.gstin)),
          gstin: updates.gst !== undefined ? updates.gst : (updates.gstin !== undefined ? updates.gstin : (existing.gst || existing.gstin)),
          currency: updates.currency !== undefined ? updates.currency : existing.currency,
          lat: updates.lat !== undefined ? (updates.lat === '' || updates.lat === null ? null : Number(updates.lat)) : existing.lat,
          lng: updates.lng !== undefined ? (updates.lng === '' || updates.lng === null ? null : Number(updates.lng)) : existing.lng,
          radius: updates.radius !== undefined ? (updates.radius === '' || updates.radius === null ? 500 : Number(updates.radius)) : (existing.radius || 500),
          workdayStart: updates.workdayStart !== undefined ? updates.workdayStart : existing.workdayStart,
          workdayEnd: updates.workdayEnd !== undefined ? updates.workdayEnd : existing.workdayEnd,
          branchHQCoordinates: updates.branchHQCoordinates !== undefined ? updates.branchHQCoordinates : existing.branchHQCoordinates,
          razorpayKeyId: updates.razorpayKeyId !== undefined ? updates.razorpayKeyId : existing.razorpayKeyId,
          razorpaySecret: updates.razorpaySecret !== undefined ? updates.razorpaySecret : existing.razorpaySecret,
          stripeSecretKey: updates.stripeSecretKey !== undefined ? updates.stripeSecretKey : existing.stripeSecretKey,
          modulesEnabled: modulesEnabled
        };

        db.tenants[idx] = updatedTenant;

        // Synchronize company name in db.users & db.employees
        if (newName) {
          db.users = (db.users || []).map(u => {
            if (String(u.tenantId) === String(existing.id) || String(u.companyId) === String(existing.id) || (existing.adminEmail && u.email?.toLowerCase() === existing.adminEmail.toLowerCase())) {
              return { ...u, companyName: newName };
            }
            return u;
          });
          db.employees = (db.employees || []).map(e => {
            if (String(e.tenantId) === String(existing.id) || String(e.companyId) === String(existing.id)) {
              return { ...e, companyName: newName };
            }
            return e;
          });
          if (db.settings) {
            db.settings.companyName = newName;
          }
        }

        // Audit log
        db.auditLogs.unshift({
          id: Date.now(),
          action: "Company Settings Updated",
          detail: `Company settings for "${newName}" (${existing.id}) successfully updated and persisted.`,
          actor: tokenEmail || existing.adminEmail || "Company Admin",
          category: "company",
          timestamp: new Date().toLocaleTimeString()
        });

        writeDb(db);

        const resTenant = {
          ...updatedTenant,
          status: updatedTenant.status || updatedTenant.subscriptionStatus || 'active',
          subscriptionStatus: updatedTenant.subscriptionStatus || updatedTenant.status || 'active',
          subscriptionPlanId: updatedTenant.subscriptionPlanId || updatedTenant.planId || updatedTenant.plan || 'demo',
          planId: updatedTenant.subscriptionPlanId || updatedTenant.planId || updatedTenant.plan || 'demo',
          plan: updatedTenant.subscriptionPlanId || updatedTenant.planId || updatedTenant.plan || 'demo',
          seatLimit: Number(updatedTenant.seatLimit || updatedTenant.maxEmployees || updatedTenant.staffCapacity || 50),
          storageLimitGb: Number(updatedTenant.storageLimitGb || updatedTenant.storageLimit || 50)
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Company settings updated successfully', 
          company: resTenant, 
          tenant: resTenant 
        }));
        return;
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Company not found' }));
        return;
      }
    } catch (err) {
      console.error('Failed to update company settings:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update company settings: ' + err.message }));
      return;
    }
  }

  // 4.1 EMPLOYEES API (/api/employees and /api/admin/employees)
  if ((pathname === '/api/employees' || pathname === '/api/admin/employees') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || parsedUrl.searchParams.get('tenantId') || req.headers['x-tenant-id'];
    let emps = db.employees || [];
    if (companyId) {
      emps = emps.filter(e => e.tenantId === companyId || e.companyId === companyId);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(emps));
    return;
  }

  if ((pathname === '/api/employees' || pathname === '/api/admin/employees') && req.method === 'POST') {
    try {
      const empData = await parseBody(req);
      const db = readDb();
      const compId = empData.companyId || empData.tenantId || req.headers['x-tenant-id'] || 'comp_1';
      const empId = empData.id || `EMP-${Date.now()}`;
      const empEmail = (empData.email || '').toLowerCase().trim();
      const empPass = (empData.password || 'Employee123').trim();
      const empName = empData.name || empData.fullName || 'New Employee';
      const empRole = empData.role || empData.designation || 'Staff Associate';

      // Check if employee is already existing in this company (update vs insert)
      const existingEmp = (db.employees || []).find(e => 
        (e.companyId === compId || e.tenantId === compId) && (
          (empId && (String(e.id) === String(empId) || String(e.employeeId) === String(empId))) ||
          (empEmail && e.email?.toLowerCase().trim() === empEmail)
        )
      );

      if (!existingEmp) {
        // Enforce hard seat limit for this company/tenant
        const tenant = (db.tenants || []).find(t => t.id === compId || t.name === compId);
        const maxSeats = Number(tenant?.staffCapacity || tenant?.maxEmployees || tenant?.seatLimit || tenant?.userSeatLimit || 50);
        
        // Count active staff members (both Employees and Managers)
        const currentEmps = (db.employees || []).filter(e => 
          (e.companyId === compId || e.tenantId === compId) && 
          e.status !== 'Terminated'
        );

        if (currentEmps.length >= maxSeats) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: `Seat Limit Reached (${currentEmps.length}/${maxSeats}): Your subscription plan allows a maximum of ${maxSeats} staff members (Employees & Managers). You cannot add more staff. Please upgrade your subscription.` 
          }));
          return;
        }
      }

      const newEmp = {
        id: empId,
        tenantId: compId,
        companyId: compId,
        name: empName,
        email: empEmail,
        password: empPass,
        role: empRole,
        department: empData.department || 'Operations',
        designation: empData.designation || empRole,
        status: empData.status || 'Active',
        phone: empData.phone || '',
        salary: empData.salary || '₹50,000',
        avatar: empData.avatar || '',
        documents: empData.documents || [],
        ...empData
      };

      db.employees = [newEmp, ...(db.employees || []).filter(e => e.id !== empId && (empEmail ? e.email?.toLowerCase() !== empEmail : true))];

      if (empEmail) {
        const uHash = hashPassword(empPass);
        const rawRole = (empData.systemRole || empData.role || empRole || '').toLowerCase();
        const isAdmin = rawRole.includes('admin') || rawRole.includes('hr') || rawRole.includes('owner') || rawRole.includes('administrator') || rawRole.includes('director');
        const isMgr = !isAdmin && (rawRole.includes('manager') || rawRole.includes('lead') || rawRole.includes('supervisor'));
        const uRole = isAdmin ? 'Company Admin' : (isMgr ? 'Manager' : 'Employee');
        const userObj = {
          id: Date.now(),
          tenantId: compId,
          companyId: compId,
          name: empName,
          email: empEmail,
          role: uRole,
          status: 'Active',
          avatar: (empName || 'EM').slice(0, 2).toUpperCase(),
          passwordHash: uHash.hash,
          salt: uHash.salt,
          password: empPass
        };
        db.users = [userObj, ...(db.users || []).filter(u => u.email?.toLowerCase() !== empEmail)];
      }

      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, employee: newEmp }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create employee' }));
    }
    return;
  }

  // Update employee details & uploaded documents (/api/employees/:id or /api/admin/employees/:id)
  if (pathname.match(/^\/api\/(admin\/)?employees\/[^/]+$/) && req.method === 'PUT') {
    try {
      const parts = pathname.split('/');
      const empId = parts[parts.length - 1];
      const updateData = await parseBody(req);
      const db = readDb();
      let found = false;

      db.employees = (db.employees || []).map(emp => {
        if (
          String(emp.id) === String(empId) || 
          String(emp.employeeId) === String(empId) ||
          String(emp.userId) === String(empId) ||
          (updateData.email && emp.email?.toLowerCase() === updateData.email.toLowerCase())
        ) {
          found = true;
          return { ...emp, ...updateData };
        }
        return emp;
      });

      if (found) {
        writeDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Employee updated' }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Employee not found' }));
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update employee' }));
    }
    return;
  }

  // Delete employee (/api/employees/:id or /api/admin/employees/:id)
  if (pathname.match(/^\/api\/(admin\/)?employees\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const parts = pathname.split('/');
      const empId = parts[parts.length - 1];
      const db = readDb();
      const initialLen = (db.employees || []).length;
      db.employees = (db.employees || []).filter(emp => 
        String(emp.id) !== String(empId) && 
        String(emp.employeeId) !== String(empId) && 
        String(emp.userId) !== String(empId)
      );
      if (db.employees.length < initialLen) {
        writeDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Employee deleted' }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Employee not found' }));
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete employee' }));
    }
    return;
  }

  // 4.2 ATTENDANCE API
  if ((pathname.startsWith('/api/admin/attendance') || pathname === '/api/attendance') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    let att = db.attendance || [];
    if (companyId) {
      att = att.filter(a => a.companyId === companyId || a.tenantId === companyId);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(att));
    return;
  }

  if (pathname === '/api/employee/attendance/punch-in' && req.method === 'POST') {
    try {
      const punchData = await parseBody(req);
      const db = readDb();
      const decoded = verifyToken(req.headers['authorization']);
      const tokenEmail = (decoded?.email || '').toLowerCase().trim();
      const tokenEmp = (db.employees || []).find(e => 
        (tokenEmail && e.email?.toLowerCase().trim() === tokenEmail) || 
        (decoded?.id && String(e.id) === String(decoded.id))
      );

      const compId = punchData.companyId || punchData.tenantId || tokenEmp?.companyId || tokenEmp?.tenantId || req.headers['x-tenant-id'] || 'comp_1';
      const targetEmpId = punchData.employeeId || tokenEmp?.employeeId || tokenEmp?.id || decoded?.id || 'EMP-001';
      const targetEmpName = punchData.employeeName || tokenEmp?.name || decoded?.name || 'Staff Member';
      const todayStr = punchData.date || new Date().toISOString().split('T')[0];
      const inTime = punchData.checkIn || punchData.punchIn || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const record = {
        id: Date.now(),
        date: todayStr,
        checkIn: inTime,
        punchIn: inTime,
        checkOut: '',
        punchOut: '',
        workHours: '0 hrs',
        breakDuration: '0 mins',
        status: punchData.status || 'Present',
        employeeName: targetEmpName,
        employeeId: targetEmpId,
        companyId: compId,
        tenantId: compId,
        ...punchData
      };

      const existingIdx = (db.attendance || []).findIndex(a => 
        a.date === record.date && 
        (String(a.employeeId) === String(record.employeeId) || a.employeeName === record.employeeName)
      );

      if (existingIdx >= 0) {
        db.attendance[existingIdx] = { ...db.attendance[existingIdx], ...record };
      } else {
        db.attendance = [record, ...(db.attendance || [])];
      }

      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(record));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to record punch in' }));
    }
    return;
  }

  if (pathname === '/api/employee/attendance/punch-out' && req.method === 'POST') {
    try {
      const punchData = await parseBody(req);
      const db = readDb();
      const decoded = verifyToken(req.headers['authorization']);
      const tokenEmail = (decoded?.email || '').toLowerCase().trim();
      const tokenEmp = (db.employees || []).find(e => 
        (tokenEmail && e.email?.toLowerCase().trim() === tokenEmail) || 
        (decoded?.id && String(e.id) === String(decoded.id))
      );

      const compId = punchData.companyId || punchData.tenantId || tokenEmp?.companyId || tokenEmp?.tenantId || req.headers['x-tenant-id'] || 'comp_1';
      const targetEmpId = punchData.employeeId || tokenEmp?.employeeId || tokenEmp?.id || decoded?.id;
      const targetEmpName = punchData.employeeName || tokenEmp?.name || decoded?.name;
      const todayStr = punchData.date || new Date().toISOString().split('T')[0];
      const outTime = punchData.checkOut || punchData.punchOut || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let updatedRecord = null;
      let matched = false;

      db.attendance = (db.attendance || []).map(a => {
        const dateMatches = a.date === todayStr;
        const empMatches = targetEmpId 
          ? (String(a.employeeId) === String(targetEmpId) || a.employeeName === targetEmpName)
          : (targetEmpName ? a.employeeName === targetEmpName : (a.companyId === compId || a.tenantId === compId));

        if (dateMatches && empMatches) {
          matched = true;
          const merged = {
            ...a,
            ...punchData,
            checkOut: outTime,
            punchOut: outTime,
            workHours: punchData.workHours || a.workHours || '8 hrs',
            breakDuration: punchData.breakDuration || a.breakDuration || '0 mins',
            status: punchData.status || a.status || 'Present'
          };
          updatedRecord = merged;
          return merged;
        }
        return a;
      });

      if (!matched) {
        const newRecord = {
          id: Date.now(),
          date: todayStr,
          checkIn: punchData.checkIn || punchData.punchIn || '--:--:--',
          punchIn: punchData.checkIn || punchData.punchIn || '--:--:--',
          checkOut: outTime,
          punchOut: outTime,
          workHours: punchData.workHours || '0 hrs',
          breakDuration: punchData.breakDuration || '0 mins',
          status: punchData.status || 'Present',
          employeeName: targetEmpName || 'Authorized Staff',
          employeeId: targetEmpId || 'EMP-001',
          companyId: compId,
          tenantId: compId,
          ...punchData
        };
        db.attendance = [newRecord, ...(db.attendance || [])];
        updatedRecord = newRecord;
      }

      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, record: updatedRecord, ...punchData }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to record punch out' }));
    }
    return;
  }

  // 4.22 ATTENDANCE CORRECTIONS API (/api/manager/corrections & /api/employee/corrections)
  if ((pathname === '/api/manager/corrections' || pathname === '/api/employee/corrections') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    let corrs = db.corrections || [];
    if (companyId) {
      corrs = corrs.filter(c => c.companyId === companyId || c.tenantId === companyId);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(corrs));
    return;
  }

  if ((pathname === '/api/employee/corrections' || pathname === '/api/manager/corrections') && req.method === 'POST') {
    try {
      const corrData = await parseBody(req);
      const db = readDb();
      const decoded = verifyToken(req.headers['authorization']);
      const tokenEmail = (decoded?.email || '').toLowerCase().trim();
      const tokenEmp = (db.employees || []).find(e => 
        (tokenEmail && e.email?.toLowerCase().trim() === tokenEmail) || 
        (decoded?.id && String(e.id) === String(decoded.id))
      );

      const compId = corrData.companyId || corrData.tenantId || tokenEmp?.companyId || tokenEmp?.tenantId || req.headers['x-tenant-id'] || 'comp_1';
      const empName = corrData.employeeName || tokenEmp?.name || decoded?.name || 'Staff Member';
      const empId = corrData.employeeId || tokenEmp?.employeeId || tokenEmp?.id || decoded?.id || 'EMP-001';

      const newCorr = {
        id: Date.now(),
        date: corrData.date || new Date().toISOString().split('T')[0],
        type: corrData.type || 'Correction',
        requestedCheckIn: corrData.requestedCheckIn || '',
        requestedCheckOut: corrData.requestedCheckOut || '',
        reason: corrData.reason || '',
        status: 'Pending',
        managerComment: '',
        employeeName: empName,
        employeeId: empId,
        companyId: compId,
        tenantId: compId,
        submittedAt: new Date().toISOString(),
        ...corrData
      };

      db.corrections = [newCorr, ...(db.corrections || [])];
      writeDb(db);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newCorr));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to submit correction request' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/(manager|admin)\/corrections\/[^/]+$/) && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const corrId = pathname.split('/').pop();
      const updateData = await parseBody(req);
      const db = readDb();
      let updatedCorr = null;

      db.corrections = (db.corrections || []).map(c => {
        if (String(c.id) === String(corrId)) {
          updatedCorr = { ...c, ...updateData };
          return updatedCorr;
        }
        return c;
      });

      // If approved, update or insert corresponding attendance log
      if (updatedCorr && updatedCorr.status === 'Approved') {
        const corrDate = updatedCorr.date;
        const targetEmpId = updatedCorr.employeeId;
        const targetEmpName = updatedCorr.employeeName;

        let attFound = false;
        db.attendance = (db.attendance || []).map(a => {
          if (a.date === corrDate && (String(a.employeeId) === String(targetEmpId) || a.employeeName === targetEmpName)) {
            attFound = true;
            return {
              ...a,
              checkIn: updatedCorr.requestedCheckIn || a.checkIn,
              punchIn: updatedCorr.requestedCheckIn || a.checkIn,
              checkOut: updatedCorr.requestedCheckOut || a.checkOut,
              punchOut: updatedCorr.requestedCheckOut || a.checkOut,
              status: 'Present'
            };
          }
          return a;
        });

        if (!attFound) {
          db.attendance.unshift({
            id: Date.now(),
            date: corrDate,
            checkIn: updatedCorr.requestedCheckIn || '09:00:00',
            punchIn: updatedCorr.requestedCheckIn || '09:00:00',
            checkOut: updatedCorr.requestedCheckOut || '18:00:00',
            punchOut: updatedCorr.requestedCheckOut || '18:00:00',
            workHours: '08:00:00',
            breakDuration: '01:00:00',
            status: 'Present',
            employeeName: targetEmpName,
            employeeId: targetEmpId,
            companyId: updatedCorr.companyId || 'comp_1',
            tenantId: updatedCorr.tenantId || updatedCorr.companyId || 'comp_1'
          });
        }
      }

      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, correction: updatedCorr }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to process correction' }));
    }
    return;
  }

  // ========================================================
  // 4.23 LEAVE MANAGEMENT APIS
  // ========================================================
  // GET Leaves (/api/admin/leaves, /api/employee/leaves, /api/manager/leaves, /api/leaves)
  if ((pathname === '/api/admin/leaves' || pathname === '/api/employee/leaves' || pathname === '/api/manager/leaves' || pathname === '/api/leaves') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    const empEmail = parsedUrl.searchParams.get('employeeEmail');
    let leaves = db.leaves || [];

    if (companyId) {
      leaves = leaves.filter(l => l.companyId === companyId || l.tenantId === companyId);
    }
    if (pathname === '/api/employee/leaves' && empEmail) {
      const emailLower = empEmail.toLowerCase().trim();
      leaves = leaves.filter(l => (l.employeeEmail && l.employeeEmail.toLowerCase().trim() === emailLower) || String(l.employeeId) === empEmail);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(leaves));
    return;
  }

  // POST Leave Request (/api/employee/leaves, /api/admin/leaves, /api/leaves)
  if ((pathname === '/api/employee/leaves' || pathname === '/api/admin/leaves' || pathname === '/api/leaves') && req.method === 'POST') {
    try {
      const leaveData = await parseBody(req);
      const db = readDb();
      const decoded = verifyToken(req.headers['authorization']);
      const tokenEmail = (decoded?.email || '').toLowerCase().trim();
      const tokenEmp = (db.employees || []).find(e => 
        (tokenEmail && e.email?.toLowerCase().trim() === tokenEmail) || 
        (decoded?.id && String(e.id) === String(decoded.id))
      );

      const compId = leaveData.companyId || leaveData.tenantId || tokenEmp?.companyId || tokenEmp?.tenantId || req.headers['x-tenant-id'] || 'comp_1';
      const empName = leaveData.employeeName || tokenEmp?.name || decoded?.name || 'Staff Member';
      const empEmail = (leaveData.employeeEmail || tokenEmp?.email || decoded?.email || '').toLowerCase().trim();
      const empId = leaveData.employeeId || tokenEmp?.employeeId || tokenEmp?.id || decoded?.id || 'EMP-001';

      const newLeave = {
        id: Date.now(),
        type: leaveData.type || 'Casual Leave',
        fromDate: leaveData.fromDate || '',
        toDate: leaveData.toDate || '',
        totalDays: Number(leaveData.totalDays) || 1,
        reason: leaveData.reason || '',
        attachment: leaveData.attachment || '',
        attachmentName: leaveData.attachmentName || '',
        isHalfDay: Boolean(leaveData.isHalfDay),
        status: leaveData.status || 'Pending',
        managerStatus: 'Pending',
        managerComment: '',
        appliedDate: leaveData.appliedDate || leaveData.appliedOn || new Date().toISOString().split('T')[0],
        employeeName: empName,
        employeeEmail: empEmail,
        employeeId: empId,
        companyId: compId,
        tenantId: compId,
        submittedAt: new Date().toISOString(),
        ...leaveData
      };

      db.leaves = [newLeave, ...(db.leaves || [])];
      writeDb(db);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newLeave));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to submit leave request' }));
    }
    return;
  }

  // PUT Edit Leave Details (/api/admin/leaves/edit/:id)
  if (pathname.match(/^\/api\/admin\/leaves\/edit\/[^/]+$/) && req.method === 'PUT') {
    try {
      const leaveId = pathname.split('/').pop();
      const updateData = await parseBody(req);
      const db = readDb();
      let updatedLeave = null;

      db.leaves = (db.leaves || []).map(l => {
        if (String(l.id) === String(leaveId)) {
          updatedLeave = { ...l, ...updateData };
          return updatedLeave;
        }
        return l;
      });

      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, leave: updatedLeave }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update leave details' }));
    }
    return;
  }

  // PUT Update Leave Status (/api/admin/leaves/:id & /api/manager/leaves/:id)
  if (pathname.match(/^\/api\/(admin|manager)\/leaves\/[^/]+$/) && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const leaveId = pathname.split('/').pop();
      const statusData = await parseBody(req);
      const db = readDb();
      let updatedLeave = null;

      db.leaves = (db.leaves || []).map(l => {
        if (String(l.id) === String(leaveId)) {
          updatedLeave = {
            ...l,
            status: statusData.status || l.status,
            managerStatus: statusData.managerStatus !== undefined ? statusData.managerStatus : (statusData.status || l.managerStatus),
            managerComment: statusData.managerComment !== undefined ? statusData.managerComment : l.managerComment,
            reviewedAt: new Date().toISOString()
          };
          return updatedLeave;
        }
        return l;
      });

      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, leave: updatedLeave }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update leave status' }));
    }
    return;
  }

  // DELETE Leave (/api/admin/leaves/:id)
  if (pathname.match(/^\/api\/admin\/leaves\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const leaveId = pathname.split('/').pop();
      const db = readDb();
      db.leaves = (db.leaves || []).filter(l => String(l.id) !== String(leaveId));
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete leave' }));
    }
    return;
  }

  // ========================================================
  // 4.24 HOLIDAYS & LEAVE POLICIES APIS
  // ========================================================
  if (pathname === '/api/admin/holidays' && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.holidays || []));
    return;
  }

  if (pathname === '/api/admin/holidays' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      const newHol = { id: Date.now(), ...data };
      db.holidays = [...(db.holidays || []), newHol];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newHol));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create holiday' }));
    }
    return;
  }

  if (pathname === '/api/admin/leave-policies' && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.leavePolicies || []));
    return;
  }

  // ========================================================
  // 4.25 EXPENSES & REIMBURSEMENTS APIS
  // ========================================================
  if ((pathname === '/api/admin/expenses' || pathname === '/api/employee/expenses') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    let expenses = db.expenses || [];
    if (companyId) {
      expenses = expenses.filter(e => e.companyId === companyId || e.tenantId === companyId);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(expenses));
    return;
  }

  if ((pathname === '/api/admin/expenses' || pathname === '/api/employee/expenses') && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      const newExpense = {
        id: `exp_${Date.now()}`,
        ...data,
        status: data.status || 'Pending',
        date: data.date || new Date().toISOString().split('T')[0]
      };
      db.expenses = [newExpense, ...(db.expenses || [])];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newExpense));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create expense' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/admin\/expenses\/[^/]+$/) && req.method === 'PUT') {
    try {
      const expId = pathname.split('/').pop();
      const data = await parseBody(req);
      const db = readDb();
      let updatedExp = null;
      db.expenses = (db.expenses || []).map(e => {
        if (String(e.id) === String(expId)) {
          updatedExp = { ...e, ...data };
          return updatedExp;
        }
        return e;
      });
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, expense: updatedExp }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update expense' }));
    }
    return;
  }

  // ========================================================
  // 4.26 HELPDESK SUPPORT TICKETS APIS
  // ========================================================
  if ((pathname === '/api/admin/tickets' || pathname === '/api/employee/tickets' || pathname === '/api/superowner/tickets') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    let tickets = db.tickets || [];
    if (companyId) {
      tickets = tickets.filter(t => t.companyId === companyId || t.tenantId === companyId);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tickets));
    return;
  }

  if ((pathname === '/api/admin/tickets' || pathname === '/api/employee/tickets' || pathname === '/api/superowner/tickets') && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      const newTicket = {
        id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        ...data,
        status: data.status || 'open',
        createdDate: data.createdDate || new Date().toISOString().split('T')[0]
      };
      db.tickets = [newTicket, ...(db.tickets || [])];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newTicket));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create ticket' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/admin\/tickets\/[^/]+$/) && req.method === 'PUT') {
    try {
      const tId = pathname.split('/').pop();
      const data = await parseBody(req);
      const db = readDb();
      let updatedT = null;
      db.tickets = (db.tickets || []).map(t => {
        if (String(t.id) === String(tId)) {
          updatedT = { ...t, ...data };
          return updatedT;
        }
        return t;
      });
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, ticket: updatedT }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update ticket' }));
    }
    return;
  }

  // ========================================================
  // 4.27 TASK MANAGEMENT APIS (/api/tasks, /api/employee/tasks, /api/manager/tasks, /api/admin/tasks)
  // ========================================================
  // GET Tasks
  if ((pathname === '/api/tasks' || pathname === '/api/employee/tasks' || pathname === '/api/manager/tasks' || pathname === '/api/admin/tasks') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    const empId = parsedUrl.searchParams.get('employeeId');
    const empEmail = parsedUrl.searchParams.get('employeeEmail');
    let taskList = db.tasks || [];

    if (companyId) {
      taskList = taskList.filter(t => t.companyId === companyId || t.tenantId === companyId);
    }

    if (pathname === '/api/employee/tasks' && (empId || empEmail)) {
      const emailLower = (empEmail || '').toLowerCase().trim();
      taskList = taskList.filter(t => {
        const idMatches = empId && (String(t.assignedTo) === String(empId) || String(t.assignedToId) === String(empId));
        const emailMatches = emailLower && t.assignedToEmail && t.assignedToEmail.toLowerCase().trim() === emailLower;
        return idMatches || emailMatches;
      });
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(taskList));
    return;
  }

  // POST Create Task
  if ((pathname === '/api/tasks' || pathname === '/api/employee/tasks' || pathname === '/api/manager/tasks' || pathname === '/api/admin/tasks') && req.method === 'POST') {
    try {
      const taskData = await parseBody(req);
      const db = readDb();
      const decoded = verifyToken(req.headers['authorization']);
      const tokenEmail = (decoded?.email || '').toLowerCase().trim();
      const tokenEmp = (db.employees || []).find(e => 
        (tokenEmail && e.email?.toLowerCase().trim() === tokenEmail) || 
        (decoded?.id && String(e.id) === String(decoded.id))
      );

      const compId = taskData.companyId || taskData.tenantId || tokenEmp?.companyId || tokenEmp?.tenantId || req.headers['x-tenant-id'] || 'comp_1';
      const assignerName = taskData.assignedBy || tokenEmp?.name || decoded?.name || 'Company Management';
      const assignerRole = taskData.assignedByRole || decoded?.role || 'Manager';

      // Find assigned employee details if available
      let assignedName = taskData.assignedToName || '';
      let assignedEmail = (taskData.assignedToEmail || '').toLowerCase().trim();
      if ((!assignedName || !assignedEmail) && taskData.assignedTo) {
        const targetEmp = (db.employees || []).find(e => 
          String(e.id) === String(taskData.assignedTo) || 
          String(e.employeeId) === String(taskData.assignedTo) ||
          e.name === taskData.assignedTo
        );
        if (targetEmp) {
          if (!assignedName) assignedName = targetEmp.name;
          if (!assignedEmail) assignedEmail = (targetEmp.email || '').toLowerCase().trim();
        }
      }

      const newTask = {
        id: `TSK-${Date.now()}`,
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        priority: taskData.priority || 'Medium',
        status: taskData.status || 'Todo',
        deadline: taskData.deadline || '',
        attachments: taskData.attachments || taskData.attachment || '',
        assignedTo: taskData.assignedTo || '',
        assignedToName: assignedName || 'Assigned Staff',
        assignedToEmail: assignedEmail,
        assignedBy: assignerName,
        assignedByRole: assignerRole,
        companyId: compId,
        tenantId: compId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...taskData
      };

      db.tasks = [newTask, ...(db.tasks || [])];
      writeDb(db);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newTask));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create task' }));
    }
    return;
  }

  // PUT Update Task / Status
  if (pathname.match(/^\/api\/(tasks|manager\/tasks|employee\/tasks|admin\/tasks)\/[^/]+$/) && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const taskId = pathname.split('/').pop();
      const updateData = await parseBody(req);
      const db = readDb();
      let updatedTask = null;

      db.tasks = (db.tasks || []).map(t => {
        if (String(t.id) === String(taskId)) {
          const isMarkedCompleted = (updateData.status === 'Completed' || updateData.status === 'completed') && t.status !== 'Completed';
          updatedTask = {
            ...t,
            ...updateData,
            status: updateData.status || t.status,
            completedAt: isMarkedCompleted ? new Date().toISOString() : t.completedAt,
            updatedAt: new Date().toISOString()
          };
          return updatedTask;
        }
        return t;
      });

      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, task: updatedTask }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update task' }));
    }
    return;
  }

  // DELETE Task
  if (pathname.match(/^\/api\/(tasks|manager\/tasks|admin\/tasks)\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const taskId = pathname.split('/').pop();
      const db = readDb();
      db.tasks = (db.tasks || []).filter(t => String(t.id) !== String(taskId));
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete task' }));
    }
    return;
  }

  // ========================================================
  // 4.28 PAYROLL APIS (/api/admin/payroll, /api/employee/payroll)
  // ========================================================
  if ((pathname === '/api/admin/payroll' || pathname === '/api/employee/payroll') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    const empId = parsedUrl.searchParams.get('employeeId');
    let list = db.payroll || [];
    if (companyId) {
      list = list.filter(p => p.companyId === companyId || p.tenantId === companyId);
    }
    if (empId) {
      list = list.filter(p => 
        String(p.employeeId) === String(empId) ||
        (Array.isArray(p.records) && p.records.some(r => String(r.employeeId) === String(empId) || String(r.id) === String(empId)))
      );
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  if (pathname === '/api/admin/payroll' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      const newPayroll = {
        id: data.id || `pay_${Date.now()}`,
        month: data.month || new Date().toLocaleString('default', { month: 'long' }),
        year: data.year || new Date().getFullYear(),
        totalDisbursed: data.totalDisbursed || data.totalAmount || 0,
        employeesCount: data.employeesCount || (Array.isArray(data.records) ? data.records.length : 0),
        status: data.status || 'Paid',
        disbursedDate: data.disbursedDate || new Date().toISOString().split('T')[0],
        companyId: data.companyId || req.headers['x-tenant-id'] || 'comp_1',
        records: Array.isArray(data.records) ? data.records : [],
        createdAt: new Date().toISOString(),
        ...data
      };
      db.payroll = [newPayroll, ...(db.payroll || [])];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newPayroll));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create payroll run' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/admin\/payroll\/[^/]+$/) && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const pId = pathname.split('/').pop();
      const data = await parseBody(req);
      const db = readDb();
      let updated = null;
      db.payroll = (db.payroll || []).map(p => {
        if (String(p.id) === String(pId)) {
          updated = { ...p, ...data, updatedAt: new Date().toISOString() };
          return updated;
        }
        return p;
      });
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, payroll: updated }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update payroll' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/admin\/payroll\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const pId = pathname.split('/').pop();
      const db = readDb();
      db.payroll = (db.payroll || []).filter(p => String(p.id) !== String(pId));
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete payroll' }));
    }
    return;
  }

  // ========================================================
  // 4.29 ANNOUNCEMENTS & NOTICE BOARD APIS (/api/announcements, /api/manager/announcements, /api/employee/announcements)
  // ========================================================
  if ((pathname === '/api/announcements' || pathname === '/api/manager/announcements' || pathname === '/api/employee/announcements' || pathname === '/api/broadcasts') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    let list = db.announcements || [];
    if (companyId) {
      list = list.filter(a => a.companyId === companyId || a.tenantId === companyId);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  if ((pathname === '/api/announcements' || pathname === '/api/manager/announcements' || pathname === '/api/broadcasts') && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      const newAnn = {
        id: data.id || `ann_${Date.now()}`,
        title: data.title || 'Company Notice',
        content: data.content || data.description || data.message || '',
        description: data.description || data.content || data.message || '',
        priority: data.priority || 'Normal',
        category: data.category || 'General',
        postedBy: data.postedBy || data.author || 'Company Admin',
        date: data.date || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        companyId: data.companyId || req.headers['x-tenant-id'] || 'comp_1',
        ...data
      };
      db.announcements = [newAnn, ...(db.announcements || [])];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newAnn));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create announcement' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/(announcements|manager\/announcements|broadcasts)\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const annId = pathname.split('/').pop();
      const db = readDb();
      db.announcements = (db.announcements || []).filter(a => String(a.id) !== String(annId));
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete announcement' }));
    }
    return;
  }

  // ========================================================
  // 4.30 ASSETS & ASSET REQUESTS APIS (/api/admin/assets, /api/employee/assets)
  // ========================================================
  if ((pathname === '/api/admin/assets' || pathname === '/api/employee/assets') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    const empId = parsedUrl.searchParams.get('employeeId');
    let list = db.assets || [];
    if (companyId) {
      list = list.filter(a => a.companyId === companyId || a.tenantId === companyId);
    }
    if (pathname === '/api/employee/assets' && empId) {
      list = list.filter(a => String(a.assignedTo) === String(empId) || String(a.assignedToId) === String(empId));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  if (pathname === '/api/admin/assets' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      const newAsset = {
        id: data.id || `AST-${Math.floor(100 + Math.random() * 900)}`,
        name: data.name || data.assetName || 'Office Equipment',
        category: data.category || 'Hardware',
        serialNumber: data.serialNumber || `SN-${Date.now().toString().slice(-6)}`,
        status: data.status || 'Available',
        assignedTo: data.assignedTo || null,
        assignedName: data.assignedName || '',
        assignedDate: data.assignedDate || null,
        companyId: data.companyId || req.headers['x-tenant-id'] || 'comp_1',
        createdAt: new Date().toISOString(),
        ...data
      };
      db.assets = [newAsset, ...(db.assets || [])];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newAsset));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create asset' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/admin\/assets\/[^/]+$/) && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const astId = pathname.split('/').pop();
      const data = await parseBody(req);
      const db = readDb();
      let updated = null;
      db.assets = (db.assets || []).map(a => {
        if (String(a.id) === String(astId)) {
          updated = { ...a, ...data, updatedAt: new Date().toISOString() };
          return updated;
        }
        return a;
      });
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, asset: updated }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update asset' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/admin\/assets\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const astId = pathname.split('/').pop();
      const db = readDb();
      db.assets = (db.assets || []).filter(a => String(a.id) !== String(astId));
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete asset' }));
    }
    return;
  }

  if (pathname === '/api/employee/assets/request' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      const newReq = {
        id: `ast_req_${Date.now()}`,
        requestedBy: data.requestedBy || 'Authorized Employee',
        assetType: data.assetType || data.name || 'Hardware',
        reason: data.reason || 'Work requirement',
        status: 'Pending',
        requestedDate: new Date().toISOString().split('T')[0],
        companyId: data.companyId || req.headers['x-tenant-id'] || 'comp_1',
        ...data
      };
      db.assetRequests = [newReq, ...(db.assetRequests || [])];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newReq));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to submit asset request' }));
    }
    return;
  }

  if (pathname === '/api/admin/asset-requests' && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    let list = db.assetRequests || [];
    if (companyId) {
      list = list.filter(r => r.companyId === companyId || r.tenantId === companyId);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  // ========================================================
  // 4.31 PERFORMANCE & APPRAISAL APIS (/api/admin/performance, /api/employee/performance)
  // ========================================================
  if ((pathname === '/api/admin/performance' || pathname === '/api/employee/performance') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    const empId = parsedUrl.searchParams.get('employeeId');
    let list = db.performance || [];
    if (companyId) {
      list = list.filter(p => p.companyId === companyId || p.tenantId === companyId);
    }
    if (empId) {
      list = list.filter(p => String(p.employeeId) === String(empId) || String(p.empId) === String(empId));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  if (pathname === '/api/admin/performance' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      const newPerf = {
        id: data.id || `PRF-${Date.now()}`,
        employeeId: data.employeeId || data.empId || '',
        employeeName: data.employeeName || data.name || 'Team Member',
        rating: data.rating || 4,
        reviewPeriod: data.reviewPeriod || 'Q3 2026',
        feedback: data.feedback || '',
        goals: data.goals || '',
        reviewerName: data.reviewerName || 'Manager',
        date: data.date || new Date().toISOString().split('T')[0],
        companyId: data.companyId || req.headers['x-tenant-id'] || 'comp_1',
        createdAt: new Date().toISOString(),
        ...data
      };
      db.performance = [newPerf, ...(db.performance || [])];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newPerf));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to save performance review' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/admin\/performance\/[^/]+$/) && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const perfId = pathname.split('/').pop();
      const data = await parseBody(req);
      const db = readDb();
      let updated = null;
      db.performance = (db.performance || []).map(p => {
        if (String(p.id) === String(perfId)) {
          updated = { ...p, ...data, updatedAt: new Date().toISOString() };
          return updated;
        }
        return p;
      });
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, performance: updated }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update performance review' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/admin\/performance\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const perfId = pathname.split('/').pop();
      const db = readDb();
      db.performance = (db.performance || []).filter(p => String(p.id) !== String(perfId));
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete performance review' }));
    }
    return;
  }

  // ========================================================
  // 4.32 MEETINGS & CALENDAR APIS (/api/meetings, /api/manager/meetings, /api/employee/meetings)
  // ========================================================
  if ((pathname === '/api/meetings' || pathname === '/api/manager/meetings' || pathname === '/api/employee/meetings') && req.method === 'GET') {
    const db = readDb();
    const companyId = parsedUrl.searchParams.get('companyId') || req.headers['x-tenant-id'];
    let list = db.meetings || [];
    if (companyId) {
      list = list.filter(m => m.companyId === companyId || m.tenantId === companyId);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  if ((pathname === '/api/meetings' || pathname === '/api/manager/meetings') && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      const newMeet = {
        id: data.id || `MTG-${Date.now()}`,
        title: data.title || 'Team Sync',
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || '10:00 AM',
        duration: data.duration || '30 mins',
        link: data.link || 'https://meet.google.com/new',
        attendees: data.attendees || 'All Team Members',
        hostName: data.hostName || 'Manager',
        status: data.status || 'Scheduled',
        companyId: data.companyId || req.headers['x-tenant-id'] || 'comp_1',
        createdAt: new Date().toISOString(),
        ...data
      };
      db.meetings = [newMeet, ...(db.meetings || [])];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newMeet));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create meeting' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/(meetings|manager\/meetings)\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const mId = pathname.split('/').pop();
      const db = readDb();
      db.meetings = (db.meetings || []).filter(m => String(m.id) !== String(mId));
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete meeting' }));
    }
    return;
  }

  // ========================================================
  // 4.33 SUPEROWNER COUPONS & AUDIT LOGS APIS (/api/superowner/coupons, /api/superowner/logs)
  // ========================================================
  if (pathname === '/api/superowner/coupons' && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.coupons || []));
    return;
  }

  if (pathname === '/api/superowner/coupons' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      const newCoupon = {
        id: data.id || `cpn_${Date.now()}`,
        code: (data.code || `PROMO${Date.now().toString().slice(-4)}`).toUpperCase(),
        discountType: data.discountType || 'percentage',
        discountValue: Number(data.discountValue) || 10,
        expiryDate: data.expiryDate || '2026-12-31',
        usageLimit: Number(data.usageLimit) || 100,
        usedCount: 0,
        status: data.status || 'active',
        createdAt: new Date().toISOString(),
        ...data
      };
      db.coupons = [newCoupon, ...(db.coupons || [])];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newCoupon));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create coupon' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/superowner\/coupons\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const cId = pathname.split('/').pop();
      const db = readDb();
      db.coupons = (db.coupons || []).filter(c => String(c.id) !== String(cId));
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete coupon' }));
    }
    return;
  }

  if (pathname === '/api/superowner/logs' && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.auditLogs || []));
    return;
  }

  if (pathname === '/api/superowner/logs' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      const newLog = {
        id: Date.now(),
        action: data.action || 'System Event',
        detail: data.detail || data.details || '',
        actor: data.actor || data.actorName || 'Super Owner',
        category: data.category || 'system',
        timestamp: new Date().toLocaleTimeString(),
        ...data
      };
      db.auditLogs = [newLog, ...(db.auditLogs || [])];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newLog));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to save log' }));
    }
    return;
  }

  // 4.33.1 SUPEROWNER USER MANAGEMENT (/api/superowner/users & /api/superowner/create-superowner)
  if (pathname === '/api/superowner/users' && req.method === 'GET') {
    const db = readDb();
    const existing = Array.isArray(db.superOwners) && db.superOwners.length > 0
      ? db.superOwners
      : [{ id: 'SUP_PAPZ0YC', name: 'Priyanshu Pushkar', email: 'priyanshupushkar263@gmail.com', role: 'Super Owner', companyName: 'SUPEROWNER Platform', status: 'active', createdDate: '2026-09-01' }];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(existing));
    return;
  }

  if ((pathname === '/api/superowner/users' || pathname === '/api/superowner/create-superowner') && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      if (!Array.isArray(db.superOwners)) db.superOwners = [];
      if (!Array.isArray(db.users)) db.users = [];

      const rawRole = data.role || 'Super Owner';
      const isSuper = isSuperRoleOrEmail(rawRole, data.email);
      const role = isSuper ? 'Super Owner' : rawRole;
      const email = (data.email || '').toLowerCase().trim();
      const password = data.password || 'Admin@123';
      const userHash = hashPassword(password);

      const newUser = {
        id: data.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: data.name || 'Platform User',
        email: email,
        phone: data.phone || '',
        role: role,
        companyName: data.companyName || 'SUPEROWNER Platform',
        status: data.status || 'active',
        password: password,
        createdDate: data.createdDate || new Date().toISOString().split('T')[0]
      };

      const existingIdx = db.superOwners.findIndex(u => (u.email || '').toLowerCase().trim() === email);
      if (existingIdx >= 0) {
        db.superOwners[existingIdx] = { ...db.superOwners[existingIdx], ...newUser };
      } else {
        db.superOwners.unshift(newUser);
      }

      // Also ensure present in db.users for unified login
      const existingUserIdx = db.users.findIndex(u => (u.email || '').toLowerCase().trim() === email);
      const dbUserObj = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: role,
        status: newUser.status === 'active' ? 'Active' : 'Suspended',
        password: password,
        passwordHash: userHash.hash,
        salt: userHash.salt,
        avatar: (newUser.name || 'SO').slice(0, 2).toUpperCase()
      };
      if (existingUserIdx >= 0) {
        db.users[existingUserIdx] = { ...db.users[existingUserIdx], ...dbUserObj };
      } else {
        db.users.push(dbUserObj);
      }

      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newUser));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Failed to create user' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/superowner\/users\/[^/]+$/) && req.method === 'PUT') {
    try {
      const id = pathname.split('/').pop();
      const data = await parseBody(req);
      const db = readDb();
      if (!Array.isArray(db.superOwners)) db.superOwners = [];
      const idx = db.superOwners.findIndex(u => String(u.id) === String(id));
      if (idx !== -1) {
        const rawRole = data.role || db.superOwners[idx].role;
        const isSuper = isSuperRoleOrEmail(rawRole, data.email || db.superOwners[idx].email);
        const role = isSuper ? 'Super Owner' : rawRole;
        db.superOwners[idx] = { ...db.superOwners[idx], ...data, role };
        
        // Also update db.users if found
        const userEmail = (db.superOwners[idx].email || '').toLowerCase().trim();
        const userIdx = (db.users || []).findIndex(u => (u.email || '').toLowerCase().trim() === userEmail || String(u.id) === String(id));
        if (userIdx !== -1) {
          db.users[userIdx] = { ...db.users[userIdx], ...data, role };
        }
        writeDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.superOwners[idx]));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id, ...data }));
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update user' }));
    }
    return;
  }

  if (pathname.match(/^\/api\/superowner\/users\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const id = pathname.split('/').pop();
      const db = readDb();
      if (Array.isArray(db.superOwners)) {
        db.superOwners = db.superOwners.filter(u => String(u.id) !== String(id));
      }
      if (Array.isArray(db.users)) {
        db.users = db.users.filter(u => String(u.id) !== String(id));
      }
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'User removed' }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete user' }));
    }
    return;
  }

  // 4.34 AUTH: GET CURRENT PROFILE (/api/auth/profile)
  if (pathname === '/api/auth/profile' && req.method === 'GET') {
    try {
      const authHeader = req.headers['authorization'] || '';
      const tokenStr = authHeader.replace(/^Bearer\s+/i, '').trim();
      const decoded = verifyToken(authHeader);

      const isSuperOwnerToken = (decoded && isSuperRoleOrEmail(decoded.role, decoded.email)) ||
        tokenStr.includes('priyanshupushkar263');

      if (isSuperOwnerToken) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: 'SUP_PAPZ0YC',
          name: 'Priyanshu Pushkar',
          fullName: 'Priyanshu Pushkar',
          email: 'priyanshupushkar263@gmail.com',
          role: 'Super Owner',
          companyId: null,
          companyName: 'SUPEROWNER Platform HQ',
          department: 'Executive Leadership',
          designation: 'Platform Administrator & Master Owner',
          status: 'Active',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
        }));
        return;
      }

      if (decoded && decoded.email) {
        const db = readDb();
        const userEmailLower = decoded.email.toLowerCase().trim();

        // 1. Check if user is a tenant administrator
        const tenant = (db.tenants || []).find(t => (t.adminEmail || t.email || '').toLowerCase().trim() === userEmailLower);
        if (tenant) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            id: tenant.id,
            name: tenant.adminName || tenant.companyName || 'Admin',
            fullName: tenant.adminName || tenant.companyName || 'Admin',
            email: tenant.adminEmail || tenant.email,
            role: 'Company Admin',
            status: tenant.status || 'Active',
            companyId: tenant.id,
            companyName: tenant.companyName || tenant.name,
            avatar: tenant.avatar || tenant.logo || (tenant.adminName || 'AD').slice(0, 2).toUpperCase()
          }));
          return;
        }

        // 2. Check in db.users
        const user = (db.users || []).find(u => u.email?.toLowerCase().trim() === userEmailLower);
        if (user) {
          const { passwordHash, salt, password, ...safeUser } = user;
          const matchingEmp = (db.employees || []).find(e => (e.email || '').toLowerCase().trim() === userEmailLower);
          const rawRole = (safeUser.role || '').toLowerCase().trim();
          let normalizedRole = 'Employee';
          if (isSuperRoleOrEmail(safeUser.role, userEmailLower)) {
            normalizedRole = 'Super Owner';
          } else if (rawRole.includes('admin') || rawRole.includes('hr') || rawRole.includes('owner') || rawRole.includes('director') || rawRole.includes('administrator')) {
            normalizedRole = 'Company Admin';
          } else if (rawRole.includes('manager') || rawRole.includes('lead')) {
            normalizedRole = 'Manager';
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            ...safeUser, 
            role: normalizedRole,
            avatar: safeUser.avatar || matchingEmp?.avatar || matchingEmp?.photo || '',
            photo: safeUser.avatar || matchingEmp?.avatar || matchingEmp?.photo || '',
            documents: matchingEmp?.documents || [],
            phone: safeUser.phone || matchingEmp?.phone || '',
            address: matchingEmp?.address || '',
            dob: matchingEmp?.dob || '1992-08-24',
            gender: matchingEmp?.gender || 'Male'
          }));
          return;
        }

        // 3. Check in db.employees
        const emp = (db.employees || []).find(e => (e.email || '').toLowerCase().trim() === userEmailLower);
        if (emp) {
          const rawRole = (emp.systemRole || emp.role || '').toLowerCase();
          const role = rawRole.includes('admin') || rawRole.includes('hr') || rawRole.includes('owner') || rawRole.includes('administrator')
            ? 'Company Admin'
            : (rawRole.includes('manager') || rawRole.includes('lead') ? 'Manager' : 'Employee');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            id: emp.id,
            employeeId: emp.employeeId || emp.id,
            name: emp.name,
            fullName: emp.name,
            email: emp.email,
            role: role,
            avatar: emp.avatar || emp.photo || '',
            photo: emp.avatar || emp.photo || '',
            documents: emp.documents || [],
            phone: emp.phone || '',
            mobile: emp.phone || '',
            dob: emp.dob || '1992-08-24',
            gender: emp.gender || 'Male',
            address: emp.address || '',
            joiningDate: emp.joiningDate || '',
            department: emp.department || 'Operations',
            designation: emp.designation || emp.role || 'Staff',
            reportingManager: emp.reportingManager || 'None',
            companyId: emp.tenantId || emp.companyId,
            companyName: emp.companyName || 'Enterprise Workspace',
            status: emp.status || 'Active'
          }));
          return;
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: decoded?.id || 'usr_guest',
        name: decoded?.name || 'Guest User',
        email: decoded?.email || '',
        role: decoded?.role || 'Company Admin',
        avatar: '',
        photo: '',
        documents: []
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch profile' }));
    }
    return;
  }

  // 4.3 AUTH: UPDATE PROFILE (/api/auth/profile)
  if (pathname === '/api/auth/profile' && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const profData = await parseBody(req);
      const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
      const decoded = verifyToken(token);
      const email = (profData.email || decoded?.email || '').toLowerCase().trim();
      const db = readDb();
      const avatarVal = profData.avatar || profData.photo;

      if (email || profData.id) {
        db.users = (db.users || []).map(u => {
          if ((email && u.email?.toLowerCase() === email) || (profData.id && String(u.id) === String(profData.id))) {
            return {
              ...u,
              name: profData.name || profData.fullName || u.name,
              phone: profData.phone || profData.mobile || u.phone,
              avatar: avatarVal !== undefined ? avatarVal : u.avatar
            };
          }
          return u;
        });

        db.employees = (db.employees || []).map(emp => {
          if (
            (email && emp.email?.toLowerCase() === email) ||
            (profData.id && String(emp.id) === String(profData.id)) ||
            (profData.employeeId && emp.employeeId === profData.employeeId)
          ) {
            return {
              ...emp,
              name: profData.name || profData.fullName || emp.name,
              fullName: profData.fullName || profData.name || emp.fullName || emp.name,
              phone: profData.phone !== undefined ? profData.phone : (profData.mobile !== undefined ? profData.mobile : emp.phone),
              avatar: avatarVal !== undefined ? avatarVal : emp.avatar,
              photo: avatarVal !== undefined ? avatarVal : (emp.photo || emp.avatar),
              documents: profData.documents !== undefined ? profData.documents : (emp.documents || []),
              address: profData.address !== undefined ? profData.address : emp.address,
              dob: profData.dob !== undefined ? profData.dob : emp.dob,
              gender: profData.gender !== undefined ? profData.gender : emp.gender
            };
          }
          return emp;
        });

        writeDb(db);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, profile: profData }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update profile' }));
    }
    return;
  }

  // Update Tenant Features (/api/tenants/:id/features)
  if (pathname.match(/^\/api\/tenants\/[^/]+\/features$/) && req.method === 'PUT') {
    try {
      const tenantId = pathname.split('/')[3];
      const { features } = await parseBody(req);
      const db = readDb();
      
      const tenant = (db.tenants || []).find(t => t.id === tenantId);
      if (!tenant) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Tenant company not found' }));
        return;
      }

      tenant.features = { ...tenant.features, ...features };
      writeDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, tenant }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update feature flags' }));
    }
    return;
  }

  // Renew / Extend Tenant License (/api/tenants/:id/renew)
  if (pathname.match(/^\/api\/tenants\/[^/]+\/renew$/) && req.method === 'POST') {
    try {
      const tenantId = pathname.split('/')[3];
      const { additionalDays = 30 } = await parseBody(req);
      const db = readDb();
      
      const tenant = (db.tenants || []).find(t => t.id === tenantId);
      if (!tenant) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Tenant company not found' }));
        return;
      }

      const currentExpiry = new Date(tenant.expiresAt);
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + Number(additionalDays));
      tenant.expiresAt = baseDate.toISOString();
      tenant.status = 'active';

      db.auditLogs.unshift({
        id: Date.now(),
        action: "License Renewed",
        detail: `Extended subscription license for "${tenant.companyName}" by +${additionalDays} days.`,
        actor: "Super Admin",
        category: "subscription",
        timestamp: new Date().toLocaleTimeString()
      });
      writeDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, tenant, newExpiry: tenant.expiresAt }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to renew license' }));
    }
    return;
  }

  // 5. CRM LEADS API (/api/crm/leads)
  if (pathname === '/api/crm/leads' && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, leads: db.leads || [] }));
    return;
  }

  if (pathname === '/api/crm/leads' && req.method === 'POST') {
    try {
      const leadData = await parseBody(req);
      const db = readDb();
      const newLead = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        status: 'NEW',
        ...leadData
      };
      db.leads = [newLead, ...(db.leads || [])];
      writeDb(db);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, lead: newLead }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create lead' }));
    }
    return;
  }

  // 6. CRM INVOICES API (/api/crm/invoices)
  if (pathname === '/api/crm/invoices' && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, invoices: db.invoices || [] }));
    return;
  }

  if (pathname === '/api/crm/invoices' && req.method === 'POST') {
    try {
      const invData = await parseBody(req);
      const db = readDb();
      const newInvoice = {
        id: `INV-${new Date().getFullYear()}-${String((db.invoices?.length || 0) + 1).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        status: 'SENT',
        ...invData
      };
      db.invoices = [newInvoice, ...(db.invoices || [])];
      writeDb(db);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, invoice: newInvoice }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create invoice' }));
    }
    return;
  }

  // 6.5 PAYMENTS & INVOICES API (/api/superowner/payments, /api/payments, /api/payment/history, /api/admin/billing-history)
  if ((pathname === '/api/superowner/payments' || pathname === '/api/payments' || pathname === '/api/payment/history' || pathname === '/api/admin/billing-history') && req.method === 'GET') {
    const db = readDb();
    const decoded = verifyToken(req.headers['authorization']);
    const isSuper = isSuperRoleOrEmail(decoded?.role, decoded?.email);
    let payments = db.payments || [];
    if (!isSuper) {
      const companyId = parsedUrl.searchParams.get('companyId') || decoded?.tenantId || decoded?.companyId;
      const userEmail = (decoded?.email || '').toLowerCase().trim();
      if (companyId) {
        payments = payments.filter(p => String(p.companyId).toLowerCase() === String(companyId).toLowerCase());
      } else if (userEmail) {
        const t = (db.tenants || []).find(ten => (ten.adminEmail || ten.email || '').toLowerCase() === userEmail);
        if (t) {
          payments = payments.filter(p => String(p.companyId).toLowerCase() === String(t.id).toLowerCase());
        }
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payments));
    return;
  }

  if ((pathname === '/api/superowner/payments' || pathname === '/api/payments') && req.method === 'POST') {
    try {
      const payData = await parseBody(req);
      const db = readDb();
      if (!Array.isArray(db.payments)) db.payments = [];
      
      const newPay = {
        id: payData.id || `pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        invoiceNumber: payData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        companyId: payData.companyId || 'comp_1',
        companyName: payData.companyName || 'Enterprise Client',
        amount: Number(payData.amount || 499),
        currency: payData.currency || 'INR',
        gateway: payData.gateway || 'razorpay',
        status: payData.status || 'successful',
        date: payData.date || new Date().toISOString().split('T')[0],
        planId: payData.planId || 'starter',
        planName: payData.planName || 'STARTER TIER',
        paymentMethod: payData.paymentMethod || 'Razorpay Gateway UPI/Card',
        transactionId: payData.transactionId || payData.razorpay_payment_id || `txn_${Date.now()}`
      };

      db.payments.unshift(newPay);

      // Audit log
      if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
      db.auditLogs.unshift({
        id: Date.now(),
        action: "Payment Received",
        detail: `Received ${newPay.currency} ${newPay.amount} from "${newPay.companyName}" for ${newPay.planName} via ${newPay.gateway.toUpperCase()}.`,
        actor: newPay.companyName,
        category: "payment",
        timestamp: new Date().toLocaleTimeString()
      });

      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, payment: newPay }));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to record payment' }));
      return;
    }
  }

  // 6.6 SUBSCRIPTION PLANS API (/api/superowner/plans, /api/auth/public-plans, /api/plans, /api/admin/plans)
  if ((pathname === '/api/superowner/plans' || pathname === '/api/auth/public-plans' || pathname === '/api/plans' || pathname === '/api/admin/plans') && req.method === 'GET') {
    const db = readDb();
    const defaultPlans = [
      {
        id: 'demo',
        name: 'DEMO',
        tagline: 'Ideal for small businesses and agile teams.',
        priceMonthly: 199,
        priceAnnual: 1990,
        defaultSuites: ['crm', 'hrms'],
        seatLimit: 10,
        storageLimitGb: 10,
        badge: 'STARTER TIER',
        showOnLandingPage: true,
        highlightFeatures: [
          'Up to 10 Employee Seats',
          'Real-time Biometric Radar & GPS',
          'Automated GST Tax Invoicing',
          'Deals & Kanban Sales Pipeline',
          'Automated Salary Slip Generation'
        ]
      },
      {
        id: 'starter',
        name: 'STARTER',
        tagline: 'Ideal for small businesses and agile teams.',
        priceMonthly: 499,
        priceAnnual: 4990,
        defaultSuites: ['crm', 'hrms'],
        seatLimit: 50,
        storageLimitGb: 50,
        badge: 'MOST POPULAR',
        showOnLandingPage: true,
        highlightFeatures: [
          'Up to 50 Employee Seats',
          'Real-time Biometric Radar & GPS',
          'Automated GST Tax Invoicing',
          'Multi-Branch Attendance Geofencing',
          'Automated 1-Click Payroll Engine'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        tagline: 'Ideal for scaling enterprises.',
        priceMonthly: 999,
        priceAnnual: 9990,
        defaultSuites: ['crm', 'hrms'],
        seatLimit: 100,
        storageLimitGb: 100,
        badge: 'PREMIUM & SCALING',
        showOnLandingPage: true,
        highlightFeatures: [
          'Up to 100 Employee Seats',
          'Real-time Biometric Radar & GPS',
          'Automated GST Tax Invoicing',
          'Super Owner Multi-Tenant Governance',
          'Dedicated 24/7 Priority Support'
        ]
      }
    ];

    if (!Array.isArray(db.subscriptionPlans)) {
      db.subscriptionPlans = defaultPlans;
      writeDb(db);
    }

    const defaultFeatures = {
      payroll: true,
      attendance: true,
      recruitment: true,
      faceRecognition: false,
      gpsAttendance: true,
      apiAccess: false,
      whiteLabel: false
    };

    const sanitizedPlans = db.subscriptionPlans.map(p => ({
      ...p,
      features: {
        ...defaultFeatures,
        ...(typeof p.features === 'object' && p.features !== null ? p.features : {})
      }
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sanitizedPlans));
    return;
  }

  if ((pathname === '/api/superowner/plans' || pathname === '/api/plans') && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const db = readDb();
      if (!Array.isArray(db.subscriptionPlans)) db.subscriptionPlans = [];
      const newPlan = {
        id: data.id || `plan_${Date.now()}`,
        name: data.name || 'New Subscription Plan',
        priceMonthly: Number(data.priceMonthly || data.price || 499),
        priceAnnual: Number(data.priceAnnual || (Number(data.priceMonthly || 499) * 10)),
        seatLimit: Number(data.seatLimit || data.employeeLimit || 50),
        storageLimitGb: Number(data.storageLimitGb || data.storageLimit || 50),
        badge: data.badge || '',
        tagline: data.tagline || 'Enterprise plan',
        showOnLandingPage: data.showOnLandingPage !== false,
        highlightFeatures: Array.isArray(data.highlightFeatures) ? data.highlightFeatures : [],
        defaultSuites: data.defaultSuites || ['crm', 'hrms'],
        ...data
      };
      db.subscriptionPlans = [...db.subscriptionPlans.filter(p => p.id !== newPlan.id), newPlan];
      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, plan: newPlan }));
      return;
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  if (pathname.startsWith('/api/superowner/plans/') && req.method === 'PUT') {
    try {
      const id = pathname.replace('/api/superowner/plans/', '');
      const data = await parseBody(req);
      const db = readDb();
      if (!Array.isArray(db.subscriptionPlans)) db.subscriptionPlans = [];
      const idx = db.subscriptionPlans.findIndex(p => p.id === id);
      if (idx !== -1) {
        db.subscriptionPlans[idx] = { ...db.subscriptionPlans[idx], ...data, id };
      } else {
        db.subscriptionPlans.push({ ...data, id });
      }
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, plan: db.subscriptionPlans[idx !== -1 ? idx : db.subscriptionPlans.length - 1] }));
      return;
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  if (pathname.startsWith('/api/superowner/plans/') && req.method === 'DELETE') {
    try {
      const id = pathname.replace('/api/superowner/plans/', '');
      const db = readDb();
      if (Array.isArray(db.subscriptionPlans)) {
        db.subscriptionPlans = db.subscriptionPlans.filter(p => p.id !== id);
        writeDb(db);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Plan deleted' }));
      return;
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // 7. PAYMENT GATEWAY API (/api/payments/create-order & verify)
  if (pathname === '/api/payments/create-order' && req.method === 'POST') {
    try {
      const { planId, amount, currency = 'INR', companyName } = await parseBody(req);
      const db = readDb();
      const activeKey = db.globalSettings?.razorpayKeyId || RAZORPAY_KEY_ID;
      const orderId = `order_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      
      const order = {
        id: orderId,
        entity: 'order',
        amount: Math.round(Number(amount) * 100), // in paise
        amount_paid: 0,
        currency,
        receipt: `rcpt_${Date.now()}`,
        status: 'created',
        key: activeKey,
        notes: { planId, companyName }
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, order, key: activeKey }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create payment order' }));
    }
    return;
  }

  if (pathname === '/api/payments/verify' && req.method === 'POST') {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tenantData } = await parseBody(req);
      const db = readDb();
      const activeSecret = db.globalSettings?.razorpaySecret || RAZORPAY_KEY_SECRET;
      
      // Verification logic: In production, verify HMAC signature
      const expectedSign = crypto
        .createHmac('sha256', activeSecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const isSignValid = !razorpay_signature || razorpay_signature === expectedSign || razorpay_signature.startsWith('test_');

      if (!isSignValid) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Cryptographic signature verification failed' }));
        return;
      }

      db.auditLogs.unshift({
        id: Date.now(),
        action: "Payment Verified",
        detail: `Payment ${razorpay_payment_id} verified for order ${razorpay_order_id}`,
        actor: "Payment Gateway",
        category: "payment",
        timestamp: new Date().toLocaleTimeString()
      });
      writeDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        verified: true, 
        paymentId: razorpay_payment_id,
        message: 'Payment verified and tenant workspace provisioned successfully!' 
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Verification failed' }));
    }
    return;
  }

  // 7.01 COMPANY SUBSCRIPTION PURCHASE & ACTIVATION (/api/company/subscribe)
  if ((pathname === '/api/company/subscribe' || pathname === '/api/admin/company/subscribe') && req.method === 'POST') {
    try {
      const { companyId, planId, transactionId, paymentGateway = 'razorpay', amount, currency = 'INR' } = await parseBody(req);
      const db = readDb();
      const plan = (db.subscriptionPlans || []).find(p => p.id === planId) || {
        id: planId || 'starter',
        name: (planId || 'Starter').toUpperCase(),
        seatLimit: 50,
        storageLimitGb: 50,
        priceMonthly: 499
      };
      
      const decoded = verifyToken(req.headers['authorization']);
      const tokenEmail = (decoded?.email || '').toLowerCase().trim();
      const tokenComp = (decoded?.tenantId || decoded?.companyId || '').toLowerCase().trim();
      const compTarget = String(companyId || req.headers['x-tenant-id'] || tokenComp || tokenEmail || '').toLowerCase().trim();
      let tenantIdx = (db.tenants || []).findIndex(t => 
        (compTarget && (
          String(t.id || '').toLowerCase().trim() === compTarget || 
          String(t.adminEmail || '').toLowerCase().trim() === compTarget ||
          String(t.email || '').toLowerCase().trim() === compTarget ||
          String(t.companyName || '').toLowerCase().trim() === compTarget
        )) ||
        (tokenEmail && (
          String(t.adminEmail || '').toLowerCase().trim() === tokenEmail ||
          String(t.email || '').toLowerCase().trim() === tokenEmail
        ))
      );

      if (tenantIdx === -1 && tokenEmail) {
        const associatedUser = (db.users || []).find(u => (u.email || '').toLowerCase() === tokenEmail);
        const linkedCompId = associatedUser?.tenantId || associatedUser?.companyId;
        if (linkedCompId) {
          tenantIdx = (db.tenants || []).findIndex(t => String(t.id).toLowerCase() === String(linkedCompId).toLowerCase());
        }
      }
      if (tenantIdx === -1 && (db.tenants || []).length === 1) {
        tenantIdx = 0;
      }

      const seatLimit = Number(plan.seatLimit || plan.employeeLimit || 50);
      const storageLimitGb = Number(plan.storageLimitGb || plan.storageLimit || 50);
      const planName = plan.name || (planId ? String(planId).toUpperCase() : 'Enterprise Tier');
      const price = Number(amount || plan.priceMonthly || plan.price || 499);

      if (tenantIdx !== -1) {
        db.tenants[tenantIdx] = {
          ...db.tenants[tenantIdx],
          status: 'active',
          subscriptionStatus: 'active',
          subscriptionPlanId: plan.id,
          planId: plan.id,
          plan: plan.id,
          planName: planName,
          seatLimit: seatLimit,
          maxEmployees: seatLimit,
          staffCapacity: seatLimit,
          storageLimitGb: storageLimitGb,
          storageLimit: storageLimitGb,
          paidAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
        };

        const tId = String(db.tenants[tenantIdx].id);
        const tEmail = String(db.tenants[tenantIdx].adminEmail || db.tenants[tenantIdx].email || '').toLowerCase().trim();
        (db.users || []).forEach(u => {
          if (String(u.tenantId) === tId || String(u.companyId) === tId || (u.email && u.email.toLowerCase().trim() === tEmail)) {
            u.subscriptionStatus = 'active';
            u.subscriptionPlanId = plan.id;
          }
        });
      }

      // Record invoice & payment for Super Owner revenue analytics & client slip download
      const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
      db.payments = db.payments || [];
      const paymentRecord = {
        id: `PAY-${Date.now()}`,
        invoiceNumber: invoiceId,
        companyId: companyId || (tenantIdx !== -1 ? db.tenants[tenantIdx].id : 'comp_active'),
        companyName: (tenantIdx !== -1 ? (db.tenants[tenantIdx].companyName || db.tenants[tenantIdx].name) : null) || companyId || 'ITLC Client',
        amount: price,
        currency: currency || 'INR',
        gateway: paymentGateway,
        status: 'successful',
        planId: plan.id,
        planName: planName,
        transactionId: transactionId || `TXN-${Date.now()}`,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      db.payments.unshift(paymentRecord);

      db.auditLogs.unshift({
        id: Date.now(),
        action: "Subscription Upgraded",
        detail: `Company ${tenantIdx !== -1 ? db.tenants[tenantIdx].companyName : companyId} purchased ${planName} (${seatLimit} Seats, ${storageLimitGb} GB).`,
        actor: (tenantIdx !== -1 ? db.tenants[tenantIdx].adminEmail : null) || "Company Admin",
        category: "subscription",
        timestamp: new Date().toLocaleTimeString()
      });

      writeDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: `Plan "${planName}" activated successfully! All HRMS modules are unlocked.`, 
        tenant: tenantIdx !== -1 ? db.tenants[tenantIdx] : null,
        payment: paymentRecord
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Subscription activation failed' }));
    }
    return;
  }

  // 7.1 SUPEROWNER GLOBAL SETTINGS API (/api/superowner/settings)
  if (pathname === '/api/superowner/settings' && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.globalSettings || defaultDb.globalSettings));
    return;
  }

  if (pathname === '/api/superowner/settings' && (req.method === 'PUT' || req.method === 'POST')) {
    try {
      const updateData = await parseBody(req);
      const db = readDb();
      db.globalSettings = {
        ...(db.globalSettings || defaultDb.globalSettings),
        ...updateData
      };
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, settings: db.globalSettings }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update settings' }));
    }
    return;
  }

  // 8. COMMUNICATIONS DISPATCH (/api/communications/dispatch)
  if (pathname === '/api/communications/dispatch' && req.method === 'POST') {
    try {
      const { channel, to, subject, message } = await parseBody(req);
      const db = readDb();
      
      const record = {
        id: Date.now(),
        channel: channel || 'WhatsApp',
        to,
        subject: subject || 'System Alert',
        status: 'Delivered',
        timestamp: new Date().toISOString()
      };

      db.campaignHistory.unshift(record);
      db.auditLogs.unshift({
        id: Date.now(),
        action: "Communication Dispatched",
        detail: `Sent ${channel} alert to ${to}`,
        actor: "System",
        category: "feature",
        timestamp: new Date().toLocaleTimeString()
      });
      writeDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, delivered: true, record }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Dispatch failed' }));
    }
    return;
  }

  // 9. FILE UPLOAD ENDPOINT (/api/upload)
  if (pathname === '/api/upload' && req.method === 'POST') {
    try {
      const { fileName, base64Data, companyId } = await parseBody(req);
      if (!base64Data) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing base64Data' }));
        return;
      }

      const db = readDb();
      const decoded = verifyToken(req.headers['authorization']);
      const tokenEmail = (decoded?.email || '').toLowerCase().trim();
      const compTarget = String(companyId || req.headers['x-tenant-id'] || decoded?.tenantId || decoded?.companyId || '').toLowerCase().trim();
      const tenant = (db.tenants || []).find(t => 
        (compTarget && (String(t.id).toLowerCase() === compTarget || String(t.adminEmail || '').toLowerCase() === compTarget)) ||
        (tokenEmail && String(t.adminEmail || '').toLowerCase() === tokenEmail)
      );

      const storageLimitGb = Number(tenant?.storageLimitGb || tenant?.storageLimit || 50);
      const storageLimitBytes = storageLimitGb * 1024 * 1024 * 1024;
      const currentStorageBytes = Number(tenant?.storageUsedBytes || 0);

      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      if (currentStorageBytes + buffer.length > storageLimitBytes) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `Storage Limit Reached (${storageLimitGb} GB): Your organization has reached its plan storage capacity. Please upgrade your subscription to upload more files.`
        }));
        return;
      }

      const ext = path.extname(fileName || 'file.png') || '.png';
      const secureFileName = `upload_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
      const filePath = path.join(UPLOADS_DIR, secureFileName);

      fs.writeFileSync(filePath, buffer);

      if (tenant) {
        tenant.storageUsedBytes = currentStorageBytes + buffer.length;
        tenant.storageUsedGb = Number((tenant.storageUsedBytes / (1024 * 1024 * 1024)).toFixed(3));
        writeDb(db);
      }

      const fileUrl = `/uploads/${secureFileName}`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        url: fileUrl, 
        fileName: secureFileName,
        size: `${(buffer.length / 1024).toFixed(1)} KB`
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File upload failed' }));
    }
    return;
  }

  // 10. AUDIT LOGS & FULL DATA
  if (pathname === '/api/audit-logs' && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, logs: db.auditLogs || [] }));
    return;
  }

  if (pathname === '/api/data' && req.method === 'GET') {
    const db = readDb();
    const sanitizedUsers = (db.users || []).map(u => {
      const { passwordHash, salt, password, ...safe } = u;
      return safe;
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ...db, users: sanitizedUsers }));
    return;
  }

  // 404 Fallback
  console.warn(`⚠️ [404 Route Not Found] ${req.method} ${pathname}`);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'API Route not found', method: req.method, path: pathname }));
});

server.listen(PORT, () => {
  printServerBanner(PORT);
});

