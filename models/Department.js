const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Department = sequelize.define('Department', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING },
  head: { type: DataTypes.STRING },
  budget: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  companyId: { type: DataTypes.STRING, allowNull: false, field: 'company_id' }
}, {
  tableName: 'departments',
  timestamps: true
});

module.exports = Department;
