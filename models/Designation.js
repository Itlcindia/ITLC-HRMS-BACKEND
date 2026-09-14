const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Designation = sequelize.define('Designation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING },
  level: { type: DataTypes.STRING },
  salaryBand: { type: DataTypes.STRING, field: 'salary_band' },
  avgSalary: { type: DataTypes.STRING, field: 'avg_salary' },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  companyId: { type: DataTypes.STRING, allowNull: false, field: 'company_id' }
}, {
  tableName: 'designations',
  timestamps: true
});

module.exports = Designation;
