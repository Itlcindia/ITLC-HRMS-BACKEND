const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ExpenseClaim = sequelize.define('ExpenseClaim', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: false },
  employeeId: { type: DataTypes.STRING, field: 'employee_id', allowNull: false },
  employeeName: { type: DataTypes.STRING, field: 'employee_name', allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending' }
}, {
  tableName: 'expense_claims',
  timestamps: false
});

module.exports = ExpenseClaim;
