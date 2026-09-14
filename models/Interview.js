const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Interview = sequelize.define('Interview', {
  id: { 
    type: DataTypes.STRING, 
    primaryKey: true 
  },
  companyId: { 
    type: DataTypes.STRING, 
    field: 'company_id', 
    allowNull: false 
  },
  candidateId: { 
    type: DataTypes.STRING, 
    field: 'candidate_id', 
    allowNull: false 
  },
  candidateName: { 
    type: DataTypes.STRING, 
    field: 'candidate_name', 
    allowNull: false 
  },
  jobTitle: { 
    type: DataTypes.STRING, 
    field: 'job_title', 
    defaultValue: '' 
  },
  interviewerName: { 
    type: DataTypes.STRING, 
    field: 'interviewer_name', 
    defaultValue: '' 
  },
  date: { 
    type: DataTypes.STRING, 
    defaultValue: '' 
  },
  time: { 
    type: DataTypes.STRING, 
    defaultValue: '' 
  },
  type: { 
    type: DataTypes.STRING, 
    defaultValue: 'Technical' 
  },
  status: { 
    type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled'), 
    defaultValue: 'Scheduled' 
  }
}, {
  tableName: 'interviews',
  timestamps: false
});

module.exports = Interview;
