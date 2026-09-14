const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PerformanceReview = sequelize.define('PerformanceReview', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: false },
  employeeId: { type: DataTypes.STRING, field: 'employee_id', allowNull: false },
  employeeName: { type: DataTypes.STRING, field: 'employee_name', allowNull: false },
  managerId: { type: DataTypes.STRING, field: 'manager_id', allowNull: false },
  kpis: { type: DataTypes.TEXT, defaultValue: '[]' }, // JSON list
  kras: { type: DataTypes.TEXT, defaultValue: '[]' }, // JSON list
  goals: { type: DataTypes.TEXT, defaultValue: '[]' }, // JSON list
  rating: { type: DataTypes.FLOAT, defaultValue: 5.0 },
  reviewPeriod: { type: DataTypes.STRING, field: 'review_period', allowNull: false }, // e.g. "Q2 2026", "Monthly"
  promotionRecommendation: { type: DataTypes.TEXT, field: 'promotion_recommendation', defaultValue: '' },
  appreciation: { type: DataTypes.TEXT, defaultValue: '' },
  warning: { type: DataTypes.TEXT, defaultValue: '' },
  notes: { type: DataTypes.TEXT, defaultValue: '' }
}, {
  tableName: 'performance_reviews',
  timestamps: false
});

module.exports = PerformanceReview;
