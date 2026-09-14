const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GlobalSetting = sequelize.define('GlobalSetting', {
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: 'global' },
  platformName: { type: DataTypes.STRING, defaultValue: 'SUPEROWNER HRMS' },
  currency: { type: DataTypes.STRING, defaultValue: 'USD' },
  timezone: { type: DataTypes.STRING, defaultValue: 'UTC-5' },
  maintenanceMode: { type: DataTypes.BOOLEAN, defaultValue: false },
  smtpServer: { type: DataTypes.STRING, defaultValue: 'smtp.mailgun.org' },
  smtpEmail: { type: DataTypes.STRING, defaultValue: 'noreply@superowner.io' },
  brandColor: { type: DataTypes.STRING, defaultValue: '#6366f1' },
  stripeEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  razorpayEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  paypalEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  stripeSecretKey: { type: DataTypes.STRING, defaultValue: '' },
  razorpayKeyId: { type: DataTypes.STRING, defaultValue: '' },
  razorpaySecret: { type: DataTypes.STRING, defaultValue: '' },
  realUpiId: { type: DataTypes.STRING, defaultValue: 'itlc@upi' }
}, {
  tableName: 'global_settings',
  timestamps: true
});

module.exports = GlobalSetting;
