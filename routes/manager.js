const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const ExpenseClaim = require('../models/ExpenseClaim');
const Task = require('../models/Task');
const PerformanceReview = require('../models/PerformanceReview');
const Meeting = require('../models/Meeting');
const Asset = require('../models/Asset');
const Announcement = require('../models/Announcement');
const CorrectionRequest = require('../models/CorrectionRequest');

// Middleware to restrict access to Managers or higher roles
const managerAuth = auth(['Manager', 'Company Admin', 'HR']);

// Helper to get manager's direct reports (team members)
async function getTeamMemberIds(managerUser) {
  const manager = await Employee.findByPk(managerUser.id);
  if (!manager) return [];

  const team = await Employee.findAll({
    where: {
      companyId: managerUser.companyId,
      [Op.or]: [
        { reportingManager: manager.email },
        { reportingManager: manager.name },
        { reportingManager: manager.id }
      ]
    }
  });

  return team.map(emp => emp.id);
}

// ----------------------------------------------------------------------
// LEAVES MODULE
// ----------------------------------------------------------------------

// Get all leave requests of the manager's team
router.get('/leaves', managerAuth, async (req, res) => {
  try {
    const teamIds = await getTeamMemberIds(req.user);
    if (teamIds.length === 0) return res.json([]);

    const leaves = await LeaveRequest.findAll({
      where: {
        companyId: req.user.companyId,
        employeeId: { [Op.in]: teamIds }
      }
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update manager recommendation status and comment on a leave request
router.put('/leaves/:id', managerAuth, async (req, res) => {
  const { status, comment } = req.body;
  try {
    const teamIds = await getTeamMemberIds(req.user);
    const leave = await LeaveRequest.findOne({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        employeeId: { [Op.in]: teamIds }
      }
    });

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found or does not belong to your team' });
    }

    if (status) leave.managerStatus = status;
    if (comment !== undefined) leave.managerComment = comment;

    await leave.save();
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// TEAM DIRECTORY
// ----------------------------------------------------------------------

// Get team members details
router.get('/team', managerAuth, async (req, res) => {
  try {
    const manager = await Employee.findByPk(req.user.id);
    if (!manager) return res.status(404).json({ error: 'Manager profile not found' });

    const team = await Employee.findAll({
      where: {
        companyId: req.user.companyId,
        [Op.or]: [
          { reportingManager: manager.email },
          { reportingManager: manager.name },
          { reportingManager: manager.id }
        ]
      }
    });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// ATTENDANCE MODULE
// ----------------------------------------------------------------------

// Get team attendance logs
router.get('/team-attendance', managerAuth, async (req, res) => {
  try {
    const teamIds = await getTeamMemberIds(req.user);
    if (teamIds.length === 0) return res.json([]);

    const logs = await Attendance.findAll({
      where: {
        employeeId: { [Op.in]: teamIds }
      }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all attendance corrections requests
router.get('/corrections', managerAuth, async (req, res) => {
  try {
    const teamIds = await getTeamMemberIds(req.user);
    if (teamIds.length === 0) return res.json([]);

    const corrections = await CorrectionRequest.findAll({
      where: {
        companyId: req.user.companyId,
        employeeId: { [Op.in]: teamIds }
      }
    });
    res.json(corrections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Process correction request
router.put('/corrections/:id', managerAuth, async (req, res) => {
  const { status, managerComment } = req.body;
  try {
    const teamIds = await getTeamMemberIds(req.user);
    const corr = await CorrectionRequest.findOne({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        employeeId: { [Op.in]: teamIds }
      }
    });

    if (!corr) return res.status(404).json({ error: 'Request not found' });

    corr.status = status;
    if (managerComment !== undefined) corr.managerComment = managerComment;
    await corr.save();

    // If approved, automatically apply corrections to the attendance logs
    if (status === 'Approved') {
      let att = await Attendance.findOne({
        where: { employeeId: corr.employeeId, date: corr.date }
      });

      if (!att) {
        await Attendance.create({
          id: `ATT${Math.floor(100000 + Math.random() * 900000)}`,
          companyId: corr.companyId,
          employeeId: corr.employeeId,
          employeeName: corr.employeeName,
          date: corr.date,
          checkIn: corr.requestedCheckIn || '09:00:00',
          checkOut: corr.requestedCheckOut || '18:00:00',
          status: 'Present',
          breakDuration: '00:00:00',
          workHours: '08:00:00'
        });
      } else {
        if (corr.requestedCheckIn) att.checkIn = corr.requestedCheckIn;
        if (corr.requestedCheckOut) att.checkOut = corr.requestedCheckOut;
        att.status = 'Present';
        await att.save();
      }
    }

    res.json(corr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// TASK MANAGEMENT MODULE
// ----------------------------------------------------------------------

// Get tasks
router.get('/tasks', managerAuth, async (req, res) => {
  try {
    const teamIds = await getTeamMemberIds(req.user);
    if (teamIds.length === 0) return res.json([]);

    const tasks = await Task.findAll({
      where: {
        companyId: req.user.companyId,
        [Op.or]: [
          { assignedTo: { [Op.in]: teamIds } },
          { createdBy: req.user.id }
        ]
      }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
router.post('/tasks', managerAuth, async (req, res) => {
  const { assignedTo, assignedToName, title, description, priority, deadline } = req.body;
  try {
    const manager = await Employee.findByPk(req.user.id);
    const task = await Task.create({
      id: `TSK${Math.floor(100000 + Math.random() * 900000)}`,
      companyId: req.user.companyId,
      assignedTo,
      assignedToName,
      createdBy: req.user.id,
      createdByName: manager ? manager.name : 'Manager',
      title,
      description,
      priority: priority || 'Medium',
      deadline,
      status: 'Todo',
      attachments: '',
      comments: '[]'
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status / details
router.put('/tasks/:id', managerAuth, async (req, res) => {
  const { status, priority, deadline, title, description, comments } = req.body;
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;
    if (title) task.title = title;
    if (description) task.description = description;
    if (comments) task.comments = comments;

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete('/tasks/:id', managerAuth, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, companyId: req.user.companyId, createdBy: req.user.id }
    });

    if (!task) return res.status(404).json({ error: 'Task not found or permission denied' });

    await task.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// PERFORMANCE MODULE
// ----------------------------------------------------------------------

// Get reviews
router.get('/performance', managerAuth, async (req, res) => {
  try {
    const teamIds = await getTeamMemberIds(req.user);
    if (teamIds.length === 0) return res.json([]);

    const reviews = await PerformanceReview.findAll({
      where: {
        companyId: req.user.companyId,
        employeeId: { [Op.in]: teamIds }
      }
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update Performance goals
router.post('/performance', managerAuth, async (req, res) => {
  const { employeeId, employeeName, kpis, kras, goals, rating, reviewPeriod, promotionRecommendation, appreciation, warning, notes } = req.body;
  try {
    const existing = await PerformanceReview.findOne({
      where: { companyId: req.user.companyId, employeeId, reviewPeriod }
    });

    if (existing) {
      if (kpis !== undefined) existing.kpis = kpis;
      if (kras !== undefined) existing.kras = kras;
      if (goals !== undefined) existing.goals = goals;
      if (rating !== undefined) existing.rating = rating;
      if (promotionRecommendation !== undefined) existing.promotionRecommendation = promotionRecommendation;
      if (appreciation !== undefined) existing.appreciation = appreciation;
      if (warning !== undefined) existing.warning = warning;
      if (notes !== undefined) existing.notes = notes;
      await existing.save();
      return res.json(existing);
    }

    const review = await PerformanceReview.create({
      id: `PERF${Math.floor(100000 + Math.random() * 900000)}`,
      companyId: req.user.companyId,
      employeeId,
      employeeName,
      managerId: req.user.id,
      kpis: kpis || '[]',
      kras: kras || '[]',
      goals: goals || '[]',
      rating: rating || 5.0,
      reviewPeriod,
      promotionRecommendation: promotionRecommendation || '',
      appreciation: appreciation || '',
      warning: warning || '',
      notes: notes || ''
    });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// EXPENSES MODULE
// ----------------------------------------------------------------------

// Get expenses of direct reports
router.get('/expenses', managerAuth, async (req, res) => {
  try {
    const teamIds = await getTeamMemberIds(req.user);
    if (teamIds.length === 0) return res.json([]);

    const expenses = await ExpenseClaim.findAll({
      where: {
        companyId: req.user.companyId,
        employeeId: { [Op.in]: teamIds }
      }
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Process expense claim (Approve / Reject)
router.put('/expenses/:id', managerAuth, async (req, res) => {
  const { status } = req.body;
  try {
    const teamIds = await getTeamMemberIds(req.user);
    const expense = await ExpenseClaim.findOne({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        employeeId: { [Op.in]: teamIds }
      }
    });

    if (!expense) return res.status(404).json({ error: 'Claim not found' });

    expense.status = status;
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// ASSETS MODULE
// ----------------------------------------------------------------------

// Get assets assigned or requested by team members
router.get('/assets', managerAuth, async (req, res) => {
  try {
    const teamIds = await getTeamMemberIds(req.user);
    if (teamIds.length === 0) return res.json([]);

    const assets = await Asset.findAll({
      where: {
        companyId: req.user.companyId,
        employeeId: { [Op.in]: teamIds }
      }
    });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create asset request/allocation
router.post('/assets', managerAuth, async (req, res) => {
  const { employeeId, employeeName, assetName, assetType, serialNumber, requestComment } = req.body;
  try {
    const asset = await Asset.create({
      id: `AST${Math.floor(100000 + Math.random() * 900000)}`,
      companyId: req.user.companyId,
      employeeId,
      employeeName,
      assetName,
      assetType,
      serialNumber: serialNumber || '',
      status: 'Assigned',
      requestComment: requestComment || '',
      actionComment: 'Allocated by Manager'
    });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve/Reject requests
router.put('/assets/:id', managerAuth, async (req, res) => {
  const { status, actionComment } = req.body;
  try {
    const teamIds = await getTeamMemberIds(req.user);
    const asset = await Asset.findOne({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        employeeId: { [Op.in]: teamIds }
      }
    });

    if (!asset) return res.status(404).json({ error: 'Asset record not found' });

    if (status) asset.status = status;
    if (actionComment) asset.actionComment = actionComment;
    await asset.save();
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// MEETINGS MODULE
// ----------------------------------------------------------------------

// Get meetings
router.get('/meetings', managerAuth, async (req, res) => {
  try {
    const meetings = await Meeting.findAll({
      where: { companyId: req.user.companyId }
    });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create meeting
router.post('/meetings', managerAuth, async (req, res) => {
  const { title, agenda, date, time, platform, link, invitees } = req.body;
  try {
    const meeting = await Meeting.create({
      id: `MTG${Math.floor(100000 + Math.random() * 900000)}`,
      companyId: req.user.companyId,
      hostId: req.user.id,
      title,
      agenda,
      date,
      time,
      platform: platform || 'Google Meet',
      link: link || `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`,
      invitees: invitees ? JSON.stringify(invitees) : '[]',
      notes: '',
      attendance: '[]'
    });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------
// ANNOUNCEMENTS MODULE
// ----------------------------------------------------------------------

// Get team announcements
router.get('/announcements', managerAuth, async (req, res) => {
  try {
    const ann = await Announcement.findAll({
      where: { companyId: req.user.companyId }
    });
    res.json(ann);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create announcement
router.post('/announcements', managerAuth, async (req, res) => {
  const { title, content, type, sendEmail, sendPush } = req.body;
  try {
    const manager = await Employee.findByPk(req.user.id);
    const ann = await Announcement.create({
      id: `ANN${Math.floor(100000 + Math.random() * 900000)}`,
      companyId: req.user.companyId,
      authorId: req.user.id,
      authorName: manager ? manager.name : 'Manager',
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      sendEmail: sendEmail || false,
      sendPush: sendPush || false,
      type: type || 'Announcement'
    });
    res.json(ann);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
