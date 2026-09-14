const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Webhook = sequelize.define('Webhook', {
  id: { type: DataTypes.STRING, primaryKey: true },
  url: { type: DataTypes.STRING, allowNull: false },
  events: { type: DataTypes.TEXT, get() {
    const rawValue = this.getDataValue('events');
    return rawValue ? JSON.parse(rawValue) : [];
  }, set(value) {
    this.setDataValue('events', JSON.stringify(value));
  } },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
}, {
  tableName: 'webhooks',
  timestamps: false
});

module.exports = Webhook;
