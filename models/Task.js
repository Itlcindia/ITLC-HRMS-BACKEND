const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: false },
  assignedTo: { type: DataTypes.STRING, field: 'assigned_to', allowNull: false },
  assignedToName: { type: DataTypes.STRING, field: 'assigned_to_name', allowNull: false },
  createdBy: { type: DataTypes.STRING, field: 'created_by', allowNull: false },
  createdByName: { type: DataTypes.STRING, field: 'created_by_name', allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('Todo', 'In Progress', 'Completed', 'Blocked', 'Cancelled'), defaultValue: 'Todo' },
  priority: { type: DataTypes.ENUM('Low', 'Medium', 'High'), defaultValue: 'Medium' },
  deadline: { type: DataTypes.STRING, allowNull: false },
  attachments: { type: DataTypes.TEXT, defaultValue: '' },
  comments: { type: DataTypes.TEXT, defaultValue: '[]' } // Stored as serialized JSON string
}, {
  tableName: 'tasks',
  timestamps: false
});

module.exports = Task;
