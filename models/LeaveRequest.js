const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LeaveRequest = sequelize.define('LeaveRequest', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: false },
  employeeId: { type: DataTypes.STRING, field: 'employee_id', allowNull: false },
  employeeName: { type: DataTypes.STRING, field: 'employee_name', allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  fromDate: { type: DataTypes.STRING, field: 'from_date', allowNull: false },
  toDate: { type: DataTypes.STRING, field: 'to_date', allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'), defaultValue: 'Pending' },
  appliedDate: { type: DataTypes.STRING, field: 'applied_date' },
  totalDays: { type: DataTypes.INTEGER, field: 'total_days', allowNull: false },
  managerStatus: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending', field: 'manager_status' },
  managerComment: { type: DataTypes.TEXT, allowNull: true, field: 'manager_comment' }
}, {
  tableName: 'leave_requests',
  timestamps: false
});

module.exports = LeaveRequest;
