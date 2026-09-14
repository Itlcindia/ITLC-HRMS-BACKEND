const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PayrollRecord = sequelize.define('PayrollRecord', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  companyId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  employeeId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  employeeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  month: {
    type: DataTypes.STRING,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  basic: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  hra: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  allowances: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  deductions: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  netSalary: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  overtime: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  reimbursements: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  profTax: {
    type: DataTypes.FLOAT,
    field: 'prof_tax',
    defaultValue: 0
  },
  type: {
    type: DataTypes.STRING, // Regular, F&F
    defaultValue: 'Regular'
  },
  gratuity: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  leaveEncashment: {
    type: DataTypes.FLOAT,
    field: 'leave_encashment',
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending'
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'payroll_records',
  timestamps: true
});

module.exports = PayrollRecord;
