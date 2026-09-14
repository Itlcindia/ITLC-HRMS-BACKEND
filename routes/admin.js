const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const ExpenseClaim = require('../models/ExpenseClaim');
const Company = require('../models/Company');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const SupportTicket = require('../models/SupportTicket');

// Get all employees of logged-in admin's company
router.get('/employees', auth(['Company Admin', 'HR']), async (req, res) => {
  try {
    const employees = await Employee.findAll({ where: { companyId: req.user.companyId } });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new employee
router.post('/employees', auth(['Company Admin', 'HR']), async (req, res) => {
  const { name, email, department, designation, salary, phone, avatar, joiningDate, reportingManager, password, role, systemRole } = req.body;
  try {
    const existing = await Employee.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'An employee with this email is already registered.' });
    }

    const employeeId = `EMP${Math.floor(100000 + Math.random() * 900000)}`;
    const tempPassword = password || 'Pass_' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Hash password with 12 salt rounds
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Parse role and designation safely
    const authRole = systemRole || (['Manager', 'HR', 'Employee', 'Company Admin'].includes(role) ? role : 'Employee');
    const finalDesignation = designation || (!['Manager', 'HR', 'Employee', 'Company Admin'].includes(role) ? role : '') || 'Staff Member';

    const newEmp = await Employee.create({
      id: employeeId,
      companyId: req.user.companyId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: authRole,
      department: department || 'Engineering',
      designation: finalDesignation,
      salary: salary || '$60,000',
      phone: phone || '',
      avatar: avatar || '',
      status: 'Active',
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      reportingManager: reportingManager || 'None'
    });

    res.json({
      employee: newEmp,
      generatedPassword: tempPassword
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update employee
router.put('/employees/:id', auth(['Company Admin', 'HR']), async (req, res) => {
  try {
    const emp = await Employee.findOne({ where: { id: req.params.id, companyId: req.user.companyId } });
    if (!emp) return res.status(404).json({ error: 'Employee not found in your company' });

    const updateData = { ...req.body };
    if (updateData.password) {
      const salt = await bcrypt.genSalt(12);
      updateData.passwordHash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
    }
    delete updateData.password_hash; // Prevent raw bypass
    await emp.update(updateData);
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete employee
router.delete('/employees/:id', auth(['Company Admin', 'HR']), async (req, res) => {
  try {
    const emp = await Employee.findOne({ where: { id: req.params.id, companyId: req.user.companyId } });
    if (!emp) return res.status(404).json({ error: 'Employee not found in your company' });

    await emp.destroy();
    res.json({ success: true, message: 'Employee purged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all leaves of the company
router.get('/leaves', auth(['Company Admin', 'HR']), async (req, res) => {
  try {
    const leaves = await LeaveRequest.findAll({ where: { companyId: req.user.companyId } });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update leave request status
router.put('/leaves/:id', auth(['Company Admin', 'HR']), async (req, res) => {
  const { status } = req.body;
  try {
    const leave = await LeaveRequest.findOne({ where: { id: req.params.id, companyId: req.user.companyId } });
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    
    leave.status = status;
    await leave.save();
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all expense claims of the company
router.get('/expenses', auth(['Company Admin', 'HR']), async (req, res) => {
  try {
    const expenses = await ExpenseClaim.findAll({ where: { companyId: req.user.companyId } });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update expense claim status
router.put('/expenses/:id', auth(['Company Admin', 'HR']), async (req, res) => {
  const { status } = req.body;
  try {
    const expense = await ExpenseClaim.findOne({ where: { id: req.params.id, companyId: req.user.companyId } });
    if (!expense) return res.status(404).json({ error: 'Expense claim not found' });
    
    expense.status = status;
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upgrade Company Subscription Plan
router.put('/subscription', auth(['Company Admin']), async (req, res) => {
  const { planId } = req.body;
  try {
    const company = await Company.findOne({ where: { id: req.user.companyId } });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    let maxEmployees = 20;
    let storageLimit = 1.0;
    if (planId === 'starter') {
      maxEmployees = 50;
      storageLimit = 5.0;
    } else if (planId === 'premium') {
      maxEmployees = 150;
      storageLimit = 20.0;
    } else if (planId === 'enterprise') {
      maxEmployees = 500;
      storageLimit = 100.0;
    } else if (planId === 'free_trial') {
      maxEmployees = 20;
      storageLimit = 1.0;
    } else {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    await company.update({
      subscriptionPlanId: planId,
      maxEmployees,
      storageLimit,
      status: 'active'
    });

    res.json({
      success: true,
      company
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const Attendance = require('../models/Attendance');

// Get all attendance of company
router.get('/attendance', auth(['Company Admin', 'HR']), async (req, res) => {
  try {
    const list = await Attendance.findAll({ where: { companyId: req.user.companyId }, order: [['date', 'DESC']] });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance of specific employee
router.get('/attendance/:employeeId', auth(['Company Admin', 'HR']), async (req, res) => {
  try {
    const list = await Attendance.findAll({
      where: { employeeId: req.params.employeeId, companyId: req.user.companyId },
      order: [['date', 'DESC']]
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tickets of admin's company
router.get('/tickets', auth(['Company Admin', 'HR']), async (req, res) => {
  try {
    const list = await SupportTicket.findAll({ where: { companyId: req.user.companyId } });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update support ticket details/reply (Admin)
router.put('/tickets/:id', auth(['Company Admin', 'HR']), async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    await ticket.update(req.body);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Company profile
router.get('/company', auth(['Company Admin']), async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Company profile
router.put('/company', auth(['Company Admin']), async (req, res) => {
  const { name, logo, phone, address, gst } = req.body;
  try {
    const company = await Company.findByPk(req.user.companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    
    if (name) company.name = name;
    if (logo !== undefined) company.logo = logo;
    if (phone !== undefined) company.phone = phone;
    if (address !== undefined) company.address = address;
    if (gst !== undefined) company.gst = gst;

    await company.save();
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const SubscriptionPlan = require('../models/SubscriptionPlan');

// Get all active subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
