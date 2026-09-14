const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ActivityLog = sequelize.define('ActivityLog', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: true },
  action: { type: DataTypes.STRING },
  details: { type: DataTypes.TEXT },
  category: { type: DataTypes.STRING },
  actorName: { type: DataTypes.STRING }
}, {
  tableName: 'activity_logs',
  timestamps: true,
  createdAt: 'timestamp',
  updatedAt: false
});

module.exports = ActivityLog;
