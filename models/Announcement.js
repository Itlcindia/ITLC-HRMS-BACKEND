const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Announcement = sequelize.define('Announcement', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: false },
  authorId: { type: DataTypes.STRING, field: 'author_id', allowNull: false },
  authorName: { type: DataTypes.STRING, field: 'author_name', allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false },
  sendEmail: { type: DataTypes.BOOLEAN, field: 'send_email', defaultValue: false },
  sendPush: { type: DataTypes.BOOLEAN, field: 'send_push', defaultValue: false },
  type: { type: DataTypes.ENUM('Announcement', 'Birthday', 'Anniversary', 'Reminder'), defaultValue: 'Announcement' }
}, {
  tableName: 'announcements',
  timestamps: false
});

module.exports = Announcement;
