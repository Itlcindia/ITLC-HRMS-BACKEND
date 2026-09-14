const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Candidate = sequelize.define('Candidate', {
  id: { 
    type: DataTypes.STRING, 
    primaryKey: true 
  },
  companyId: { 
    type: DataTypes.STRING, 
    field: 'company_id', 
    allowNull: false 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  phone: { 
    type: DataTypes.STRING, 
    defaultValue: '' 
  },
  jobOpeningId: { 
    type: DataTypes.STRING, 
    field: 'job_opening_id', 
    allowNull: false 
  },
  jobTitle: { 
    type: DataTypes.STRING, 
    field: 'job_title', 
    defaultValue: '' 
  },
  rating: { 
    type: DataTypes.FLOAT, 
    defaultValue: 4.0 
  },
  stage: { 
    type: DataTypes.ENUM('Applied', 'Screening', 'Interview', 'Offered', 'Hired', 'Rejected'), 
    defaultValue: 'Applied' 
  },
  appliedDate: { 
    type: DataTypes.STRING, 
    field: 'applied_date', 
    defaultValue: '' 
  }
}, {
  tableName: 'candidates',
  timestamps: false
});

module.exports = Candidate;
