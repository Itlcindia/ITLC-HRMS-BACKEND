const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.STRING, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  discountType: { type: DataTypes.ENUM('percentage', 'fixed'), field: 'discount_type', defaultValue: 'percentage' },
  discountValue: { type: DataTypes.FLOAT, field: 'discount_value', allowNull: false },
  validUntil: { type: DataTypes.STRING, field: 'valid_until' },
  usageLimit: { type: DataTypes.INTEGER, field: 'usage_limit', defaultValue: 100 },
  usedCount: { type: DataTypes.INTEGER, field: 'used_count', defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
}, {
  tableName: 'coupons',
  timestamps: false
});

module.exports = Coupon;
