const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LeavePolicy = sequelize.define('LeavePolicy', {
  id: { 
    type: DataTypes.STRING,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  leaveClass: {
    type: DataTypes.STRING,
    allowNull: false
  },
  annualAllocation: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  carryForwardLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  payoutMode: {
    type: DataTypes.STRING,
    defaultValue: 'Paid'
  }
}, {
  tableName: 'leave_policies',
  timestamps: true
});

module.exports = LeavePolicy;
