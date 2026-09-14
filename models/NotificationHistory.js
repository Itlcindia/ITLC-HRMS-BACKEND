const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const NotificationHistory = sequelize.define('NotificationHistory', {
  id: { type: DataTypes.STRING, primaryKey: true },
  title: { type: DataTypes.STRING },
  target: { type: DataTypes.STRING },
  channels: { 
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('channels');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('channels', JSON.stringify(value));
    }
  },
  senderName: { type: DataTypes.STRING },
  companyId: { type: DataTypes.STRING, field: 'company_id', defaultValue: '' }
}, {
  tableName: 'notification_history',
  timestamps: true,
  createdAt: 'timestamp',
  updatedAt: false
});

module.exports = NotificationHistory;
