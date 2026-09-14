const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SecuritySetting = sequelize.define('SecuritySetting', {
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: 'global' },
  twoFactor: { type: DataTypes.BOOLEAN, defaultValue: true },
  sessionPinning: { type: DataTypes.BOOLEAN, defaultValue: false },
  ipList: { 
    type: DataTypes.TEXT, 
    get() {
      const rawValue = this.getDataValue('ipList');
      return rawValue ? JSON.parse(rawValue) : [];
    }, 
    set(value) {
      this.setDataValue('ipList', JSON.stringify(value));
    } 
  }
}, {
  tableName: 'security_settings',
  timestamps: true
});

module.exports = SecuritySetting;
