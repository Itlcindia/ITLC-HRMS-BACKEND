const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

const Company = sequelize.define('Company', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  logo: { type: DataTypes.STRING, defaultValue: '' },
  ownerName: { type: DataTypes.STRING, field: 'owner_name', allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { 
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('phone');
      return decrypt(rawValue);
    },
    set(val) {
      this.setDataValue('phone', encrypt(val));
    }
  },
  gst: { 
    type: DataTypes.TEXT,
    defaultValue: '',
    get() {
      const rawValue = this.getDataValue('gst');
      return decrypt(rawValue);
    },
    set(val) {
      this.setDataValue('gst', encrypt(val));
    }
  },
  address: { 
    type: DataTypes.TEXT, 
    defaultValue: '',
    get() {
      const rawValue = this.getDataValue('address');
      return decrypt(rawValue);
    },
    set(val) {
      this.setDataValue('address', encrypt(val));
    }
  },
  country: { type: DataTypes.STRING, defaultValue: '' },
  state: { type: DataTypes.STRING, defaultValue: '' },
  city: { type: DataTypes.STRING, defaultValue: '' },
  timezone: { type: DataTypes.STRING, defaultValue: 'UTC' },
  currency: { type: DataTypes.STRING, defaultValue: 'USD' },
  subscriptionPlanId: { type: DataTypes.STRING, field: 'subscription_plan_id', defaultValue: 'starter' },
  maxEmployees: { type: DataTypes.INTEGER, field: 'max_employees', defaultValue: 100 },
  storageLimit: { type: DataTypes.FLOAT, field: 'storage_limit', defaultValue: 50.0 },
  storageUsed: { type: DataTypes.FLOAT, field: 'storage_used', defaultValue: 0.0 },
  status: { type: DataTypes.ENUM('active', 'suspended', 'trial', 'expired'), defaultValue: 'trial' },
  createdDate: { type: DataTypes.STRING, field: 'created_date', defaultValue: () => new Date().toISOString().split('T')[0] }
}, {
  tableName: 'companies',
  timestamps: false
});

module.exports = Company;
