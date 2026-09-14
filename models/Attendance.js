const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Attendance = sequelize.define('Attendance', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: true },
  employeeId: { type: DataTypes.STRING, field: 'employee_id', allowNull: false },
  employeeName: { type: DataTypes.STRING, field: 'employee_name', allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false },
  checkIn: { type: DataTypes.STRING, field: 'check_in' },
  checkOut: { type: DataTypes.STRING, field: 'check_out' },
  breakDuration: { type: DataTypes.STRING, field: 'break_duration', defaultValue: '00:00:00' },
  workHours: { type: DataTypes.STRING, field: 'work_hours', defaultValue: '00:00:00' },
  status: { type: DataTypes.STRING, defaultValue: 'Present' }
}, {
  tableName: 'attendances',
  timestamps: false
});

module.exports = Attendance;
