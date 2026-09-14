const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Integration = sequelize.define('Integration', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
  connected: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'integrations',
  timestamps: false
});

module.exports = Integration;
