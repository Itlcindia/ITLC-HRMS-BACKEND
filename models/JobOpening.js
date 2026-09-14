const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const JobOpening = sequelize.define('JobOpening', {
  id: { 
    type: DataTypes.STRING,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Remote'
  },
  type: {
    type: DataTypes.STRING, // Full-time, Part-time, Contract
    defaultValue: 'Full-time'
  },
  experience: {
    type: DataTypes.STRING,
    defaultValue: '0-2 Years'
  },
  vacancies: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.STRING, // Active, Closed, Draft
    defaultValue: 'Active'
  },
  postedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'job_openings',
  timestamps: true
});

module.exports = JobOpening;
