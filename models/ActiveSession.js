const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ActiveSession = sequelize.define('ActiveSession', {
  id: { type: DataTypes.STRING, primaryKey: true },
  device: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
  ip: { type: DataTypes.STRING },
  lastActive: { type: DataTypes.STRING },
  current: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'active_sessions',
  timestamps: true
});

module.exports = ActiveSession;
