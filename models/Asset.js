const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Asset = sequelize.define('Asset', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: false },
  employeeId: { type: DataTypes.STRING, field: 'employee_id', allowNull: true },
  employeeName: { type: DataTypes.STRING, field: 'employee_name', defaultValue: '' },
  assetName: { type: DataTypes.STRING, field: 'asset_name', allowNull: false },
  assetType: { type: DataTypes.STRING, field: 'asset_type', allowNull: false }, // Laptop, Phone, Monitor, etc.
  serialNumber: { type: DataTypes.STRING, field: 'serial_number', defaultValue: '' },
  status: { type: DataTypes.ENUM('Requested', 'Assigned', 'Rejected', 'Return Pending', 'Returned'), defaultValue: 'Requested' },
  requestComment: { type: DataTypes.TEXT, field: 'request_comment', defaultValue: '' },
  actionComment: { type: DataTypes.TEXT, field: 'action_comment', defaultValue: '' }
}, {
  tableName: 'assets',
  timestamps: false
});

module.exports = Asset;
