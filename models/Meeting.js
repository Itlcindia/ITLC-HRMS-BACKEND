const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Meeting = sequelize.define('Meeting', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: false },
  hostId: { type: DataTypes.STRING, field: 'host_id', allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  agenda: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false },
  time: { type: DataTypes.STRING, allowNull: false },
  platform: { type: DataTypes.ENUM('Google Meet', 'Microsoft Teams', 'Zoom'), defaultValue: 'Google Meet' },
  link: { type: DataTypes.STRING, defaultValue: '' },
  invitees: { type: DataTypes.TEXT, defaultValue: '[]' }, // JSON list of employee emails/names
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  attendance: { type: DataTypes.TEXT, defaultValue: '[]' } // JSON list of attendees
}, {
  tableName: 'meetings',
  timestamps: false
});

module.exports = Meeting;
