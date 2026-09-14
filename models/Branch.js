const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Branch = sequelize.define('Branch', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  country: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  manager: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  count: { type: DataTypes.INTEGER, defaultValue: 0 },
  companyId: { type: DataTypes.STRING, allowNull: false, field: 'company_id' }
}, {
  tableName: 'branches',
  timestamps: true
});

module.exports = Branch;
