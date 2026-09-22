const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const Employee = require('../models/Employee');
const SupportTicket = require('../models/SupportTicket');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get all companies
router.get('/companies', auth(['Super Owner']), async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new company and automatic Company Admin account
router.post('/companies', auth(['Super Owner']), async (req, res) => {
  const { 
    name, logo, ownerName, email, phone, gst, address, 
    country, state, city, timezone, currency, subscriptionPlanId, 
    maxEmployees, storageLimit, status, customPassword 
  } = req.body;

  try {
    // Check if company already registered with this email
    const existingCompany = await Company.findOne({ where: { email } });
    if (existingCompany) {
      return res.status(400).json({ error: 'A company with this admin email is already registered.' });
    }

    const companyId = `comp_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const generatedPassword = customPassword || 'Pass_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const adminId = `ADM${Math.floor(100000 + Math.random() * 900000)}`;

    // Hash password with 12 salt rounds
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(generatedPassword, salt);

    // Create Company
    const newCompany = await Company.create({
      id: companyId,
      name,
      logo: logo || 'bg-gradient-to-tr from-indigo-500 to-emerald-500',
      ownerName,
      email: email.toLowerCase(),
      phone,
      gst: gst || '',
      address: address || '',
      country: country || '',
      state: state || '',
      city: city || '',
      timezone: timezone || 'UTC',
      currency: currency || 'USD',
      subscriptionPlanId: subscriptionPlanId || 'starter',
      maxEmployees: maxEmployees ? Number(maxEmployees) : 100,
      storageLimit: storageLimit ? Number(storageLimit) : 50.0,
      storageUsed: 0.0,
      status: status || 'trial'
    });

    // Create Admin Employee
    const newAdmin = await Employee.create({
      id: adminId,
      companyId: companyId,
      name: ownerName,
      email: email.toLowerCase(),
      passwordHash,
      role: 'Company Admin',
      department: 'Management',
      designation: 'Company Director / Chief Admin',
      phone: phone || '',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      joiningDate: new Date().toISOString().split('T')[0]
    });

    res.json({
      company: newCompany,
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        password: generatedPassword
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update company details
router.put('/companies/:id', auth(['Super Owner']), async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company tenant not found' });
    
    await company.update(req.body);
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete company and related assets/employees
router.delete('/companies/:id', auth(['Super Owner']), async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company tenant not found' });

    // Cascade delete employees in that company
    await Employee.destroy({ where: { companyId: req.params.id } });
    await company.destroy();

    res.json({ success: true, message: 'Company tenant and associated records purged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Support Tickets across all companies
router.get('/tickets', auth(['Super Owner']), async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update support ticket details/reply
router.put('/tickets/:id', auth(['Super Owner']), async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    await ticket.update(req.body);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users across the platform
router.get('/users', auth(['Super Owner']), async (req, res) => {
  try {
    const employees = await Employee.findAll();
    const companies = await Company.findAll();
    const companyMap = {};
    companies.forEach(c => {
      companyMap[c.id] = c.name;
    });

    const users = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      status: emp.status ? emp.status.toLowerCase() : 'active',
      companyId: emp.companyId,
      companyName: emp.companyId ? (companyMap[emp.companyId] || 'Unknown Company') : 'SUPEROWNER Platform',
      createdDate: emp.joiningDate || ''
    }));

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new user (employee) across platform
router.post('/users', auth(['Super Owner']), async (req, res) => {
  const { name, email, role, companyName, password } = req.body;
  try {
    const existing = await Employee.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email is already registered.' });
    }

    // Resolve companyName to companyId if possible
    let companyId = null;
    if (companyName && companyName !== 'SUPEROWNER Platform') {
      const company = await Company.findOne({ where: { name: companyName } });
      if (company) {
        companyId = company.id;
      }
    }

    const employeeId = `EMP${Math.floor(100000 + Math.random() * 900000)}`;
    const tempPassword = password || 'Pass_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const newEmp = await Employee.create({
      id: employeeId,
      companyId: companyId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'Employee',
      department: 'General',
      designation: role || 'Employee',
      status: 'Active',
      joiningDate: new Date().toISOString().split('T')[0]
    });

    res.json({
      id: newEmp.id,
      name: newEmp.name,
      email: newEmp.email,
      role: newEmp.role,
      status: newEmp.status ? newEmp.status.toLowerCase() : 'active',
      companyId: newEmp.companyId,
      companyName: companyName || 'SUPEROWNER Platform',
      createdDate: newEmp.joiningDate || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user status/role
router.put('/users/:id', auth(['Super Owner']), async (req, res) => {
  const { status, role } = req.body;
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ error: 'User not found' });

    if (status) {
      const dbStatus = status.charAt(0).toUpperCase() + status.slice(1);
      emp.status = dbStatus;
    }
    if (role) {
      emp.role = role;
    }

    await emp.save();
    res.json({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      status: emp.status ? emp.status.toLowerCase() : 'active',
      companyId: emp.companyId,
      createdDate: emp.joiningDate || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete('/users/:id', auth(['Super Owner']), async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ error: 'User not found' });

    // Prevent deleting the last Super Owner
    if (emp.role === 'Super Owner') {
      const superOwnerCount = await Employee.count({ where: { role: 'Super Owner' } });
      if (superOwnerCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only Super Owner on the platform' });
      }
    }

    await emp.destroy();
    res.json({ success: true, message: 'User deleted successfully from database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const Attendance = require('../models/Attendance');

// Get all employees of a specific company (for Super Owner)
router.get('/companies/:companyId/employees', auth(['Super Owner']), async (req, res) => {
  try {
    const employees = await Employee.findAll({ where: { companyId: req.params.companyId } });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance of specific employee (for Super Owner)
router.get('/employees/:employeeId/attendance', auth(['Super Owner']), async (req, res) => {
  try {
    const list = await Attendance.findAll({
      where: { employeeId: req.params.employeeId },
      order: [['date', 'DESC']]
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const SubscriptionPlan = require('../models/SubscriptionPlan');

// Get all subscription plans
router.get('/plans', auth(['Super Owner']), async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create subscription plan
router.post('/plans', auth(['Super Owner']), async (req, res) => {
  try {
    const { id, name, price, billingCycle, trialDays, employeeLimit, storageLimit, aiCreditsLimit, features } = req.body;
    const planId = id || name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const newPlan = await SubscriptionPlan.create({
      id: planId,
      name,
      price: Number(price) || 0,
      billingCycle: billingCycle || 'monthly',
      trialDays: Number(trialDays) || 0,
      employeeLimit: Number(employeeLimit) || 50,
      storageLimit: Number(storageLimit) || 20,
      aiCreditsLimit: Number(aiCreditsLimit) || 500,
      features: typeof features === 'object' ? JSON.stringify(features) : String(features || '{}')
    });
    res.json(newPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update subscription plan
router.put('/plans/:id', auth(['Super Owner']), async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    
    const updateData = { ...req.body };
    if (updateData.features && typeof updateData.features === 'object') {
      updateData.features = JSON.stringify(updateData.features);
    }
    await plan.update(updateData);
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete subscription plan
router.delete('/plans/:id', auth(['Super Owner']), async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (plan) {
      await plan.destroy();
    }
    res.json({ success: true, message: 'Subscription plan deleted permanently' });
// Get SuperOwner Global Settings
router.get('/settings', async (req, res) => {
  try {
    const GlobalSetting = require('../models/GlobalSetting');
    let setting = await GlobalSetting.findByPk('global');
    if (!setting) {
      setting = await GlobalSetting.create({ id: 'global' });
    }
    const data = setting.toJSON ? setting.toJSON() : setting;
    if (process.env.RAZORPAY_KEY_ID) data.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    if (process.env.RAZORPAY_SECRET) data.razorpaySecret = process.env.RAZORPAY_SECRET;
    res.json(data);
  } catch (err) {
    res.json({
      platformName: 'SUPEROWNER HRMS',
      currency: 'INR',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
      razorpaySecret: process.env.RAZORPAY_SECRET || '',
      realUpiId: 'itlc@upi'
    });
  }
});

// Update SuperOwner Global Settings
router.put('/settings', async (req, res) => {
  try {
    const GlobalSetting = require('../models/GlobalSetting');
    const updateData = req.body || {};
    
    if (updateData.razorpayKeyId) {
      process.env.RAZORPAY_KEY_ID = String(updateData.razorpayKeyId).trim();
      process.env.VITE_RAZORPAY_KEY_ID = String(updateData.razorpayKeyId).trim();
    }
    if (updateData.razorpaySecret) {
      process.env.RAZORPAY_SECRET = String(updateData.razorpaySecret).trim();
      process.env.RAZORPAY_KEY_SECRET = String(updateData.razorpaySecret).trim();
    }

    let setting = await GlobalSetting.findByPk('global');
    if (!setting) {
      setting = await GlobalSetting.create({ id: 'global', ...updateData });
    } else {
      await setting.update(updateData);
    }

    res.json({ success: true, settings: setting });
  } catch (err) {
    res.json({ success: true, settings: req.body, warning: err.message });
  }
});

module.exports = router;
