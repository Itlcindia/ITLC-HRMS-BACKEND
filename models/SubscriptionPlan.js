const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  billingCycle: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'monthly'
  },
  trialDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  employeeLimit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  storageLimit: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  aiCreditsLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  features: {
    type: DataTypes.TEXT, // Store as JSON string
    allowNull: false
  }
});

module.exports = SubscriptionPlan;
