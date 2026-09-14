const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ApiToken = sequelize.define('ApiToken', {
  id: { 
    type: DataTypes.STRING, 
    primaryKey: true 
  },
  token: { 
    type: DataTypes.STRING,
    allowNull: false
  },
  lastRotated: { 
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'api_tokens',
  timestamps: false
});

module.exports = ApiToken;
