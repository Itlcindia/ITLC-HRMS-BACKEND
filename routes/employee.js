const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const ExpenseClaim = require('../models/ExpenseClaim');
const SupportTicket = require('../models/SupportTicket');
const Company = require('../models/Company');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get all leaves of logged-in employee
router.get('/leaves', auth(['Employee', 'Manager', 'HR', 'Company Admin']), async (req, res) => {
  try {
    const leaves = await LeaveRequest.findAll({ where: { employeeId: req.user.id } });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply Leave
router.post('/leaves', auth(['Employee', 'Manager', 'HR', 'Company Admin']), async (req, res) => {
  const { type, fromDate, toDate, reason, totalDays } = req.body;
  try {
    const user = await Employee.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newLeave = await LeaveRequest.create({
      id: `leave_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      companyId: user.companyId,
      employeeId: user.id,
      employeeName: user.name,
      type,
      fromDate,
      toDate,
      reason,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
      totalDays: Number(totalDays) || 1
    });
    res.json(newLeave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all expenses of logged-in employee
router.get('/expenses', auth(['Employee', 'Manager', 'HR', 'Company Admin']), async (req, res) => {
  try {
    const expenses = await ExpenseClaim.findAll({ where: { employeeId: req.user.id } });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply Expense Claim
router.post('/expenses', auth(['Employee', 'Manager', 'HR', 'Company Admin']), async (req, res) => {
  const { date, category, amount, reason } = req.body;
  try {
    const user = await Employee.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newExpense = await ExpenseClaim.create({
      id: `exp_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      companyId: user.companyId,
      employeeId: user.id,
      employeeName: user.name,
      date,
      category,
      amount: Number(amount) || 0.0,
      reason,
      status: 'Pending'
    });
    res.json(newExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all support tickets of logged-in employee's company
router.get('/tickets', auth(['Employee', 'Manager', 'HR', 'Company Admin']), async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll({ where: { requesterEmail: req.user.email } });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply Support Ticket
router.post('/tickets', auth(['Employee', 'Manager', 'HR', 'Company Admin']), async (req, res) => {
  const { subject, priority, description } = req.body;
  try {
    const user = await Employee.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let companyName = 'HRMS Workspace';
    if (user.companyId) {
      const company = await Company.findByPk(user.companyId);
      if (company) companyName = company.name;
    }

    const messages = [{
      id: `msg_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      senderName: user.name,
      senderRole: user.role,
      content: description || '',
      timestamp: new Date().toISOString(),
      isAgent: false
    }];

    const newTicket = await SupportTicket.create({
      id: `tkt_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      companyId: user.companyId || 'platform',
      companyName,
      subject,
      requesterName: user.name,
      requesterEmail: user.email,
      priority: priority || 'medium',
      status: 'open',
      createdDate: new Date().toISOString().split('T')[0],
      messagesJson: JSON.stringify(messages)
    });
    res.json(newTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
router.post('/change-password', auth(), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await Employee.scope('withPassword').findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const Attendance = require('../models/Attendance');

// Get all attendance of logged-in employee
router.get('/attendance', auth(['Employee', 'Manager', 'HR', 'Company Admin']), async (req, res) => {
  try {
    const list = await Attendance.findAll({ where: { employeeId: req.user.id }, order: [['date', 'DESC']] });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Punch In
router.post('/attendance/punch-in', auth(['Employee', 'Manager', 'HR', 'Company Admin']), async (req, res) => {
  const { date, checkIn, status } = req.body;
  try {
    const user = await Employee.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if check-in already exists for this date
    let record = await Attendance.findOne({ where: { employeeId: req.user.id, date } });
    if (record) {
      return res.status(400).json({ error: 'Already punched in for today' });
    }

    record = await Attendance.create({
      id: `att_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      companyId: user.companyId,
      employeeId: user.id,
      employeeName: user.name,
      date,
      checkIn,
      status: status || 'Present'
    });

    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Punch Out
router.post('/attendance/punch-out', auth(['Employee', 'Manager', 'HR', 'Company Admin']), async (req, res) => {
  const { date, checkOut, breakDuration, workHours, status } = req.body;
  try {
    const record = await Attendance.findOne({ where: { employeeId: req.user.id, date } });
    if (!record) {
      return res.status(404).json({ error: 'No punch-in record found for today' });
    }

    record.checkOut = checkOut;
    record.breakDuration = breakDuration;
    record.workHours = workHours;
    record.status = status;
    await record.save();

    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const Task = require('../models/Task');

// Get all tasks assigned to logged-in employee
router.get('/tasks', auth(['Employee', 'Manager', 'HR', 'Company Admin']), async (req, res) => {
  try {
    const list = await Task.findAll({ where: { assignedTo: req.user.id } });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update status of assigned task
router.put('/tasks/:id/status', auth(['Employee', 'Manager', 'HR', 'Company Admin']), async (req, res) => {
  const { status } = req.body;
  try {
    const task = await Task.findOne({ where: { id: req.params.id, assignedTo: req.user.id } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }
    task.status = status;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
