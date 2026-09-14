const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TrainingProgram = sequelize.define('TrainingProgram', {
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
  instructor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.STRING,
    defaultValue: '1 Week'
  },
  type: {
    type: DataTypes.STRING, // Technical, Soft Skills, Compliance
    defaultValue: 'Technical'
  },
  enrolledCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING, // Upcoming, Ongoing, Completed
    defaultValue: 'Upcoming'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'training_programs',
  timestamps: true
});

module.exports = TrainingProgram;
