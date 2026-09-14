const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CorrectionRequest = sequelize.define('CorrectionRequest', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: false },
  employeeId: { type: DataTypes.STRING, field: 'employee_id', allowNull: false },
  employeeName: { type: DataTypes.STRING, field: 'employee_name', allowNull: false },
  attendanceId: { type: DataTypes.STRING, field: 'attendance_id', allowNull: true },
  date: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('Missing Punch', 'Correction', 'Shift Change', 'Overtime'), allowNull: false },
  requestedCheckIn: { type: DataTypes.STRING, field: 'requested_check_in', defaultValue: '' },
  requestedCheckOut: { type: DataTypes.STRING, field: 'requested_check_out', defaultValue: '' },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending' },
  managerComment: { type: DataTypes.TEXT, field: 'manager_comment', defaultValue: '' }
}, {
  tableName: 'correction_requests',
  timestamps: false
});

module.exports = CorrectionRequest;
