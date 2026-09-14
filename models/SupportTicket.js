const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SupportTicket = sequelize.define('SupportTicket', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: false },
  companyName: { type: DataTypes.STRING, field: 'company_name', allowNull: false },
  subject: { type: DataTypes.STRING, allowNull: false },
  requesterName: { type: DataTypes.STRING, field: 'requester_name', allowNull: false },
  requesterEmail: { type: DataTypes.STRING, field: 'requester_email', allowNull: false },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  status: { type: DataTypes.ENUM('open', 'pending', 'resolved'), defaultValue: 'open' },
  createdDate: { type: DataTypes.STRING, field: 'created_date' },
  messagesJson: { type: DataTypes.TEXT, field: 'messages_json', defaultValue: '[]' }
}, {
  tableName: 'support_tickets',
  timestamps: false
});

module.exports = SupportTicket;
