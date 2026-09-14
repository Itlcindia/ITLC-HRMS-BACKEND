const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SalaryComponent = sequelize.define('SalaryComponent', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING, // Earning, Deduction
    allowNull: false
  },
  calculationType: {
    type: DataTypes.STRING, // Percentage, Flat
    defaultValue: 'Percentage'
  },
  value: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
}, {
  tableName: 'salary_components',
  timestamps: true
});

module.exports = SalaryComponent;
