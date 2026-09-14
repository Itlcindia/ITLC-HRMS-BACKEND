const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.STRING, primaryKey: true },
  companyId: { type: DataTypes.STRING, field: 'company_id', allowNull: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { 
    type: DataTypes.STRING, 
    field: 'password_hash', 
    defaultValue: '$2a$10$U7vO9vM2nF1c7x.iP8W1eu3R6s2P6o.G1eK4b4xY0d1y3g4d5v6a.' 
  },
  role: { 
    type: DataTypes.ENUM('Super Owner', 'Company Admin', 'HR', 'Manager', 'Employee'), 
    defaultValue: 'Employee' 
  },
  department: { type: DataTypes.STRING, allowNull: false },
  designation: { type: DataTypes.STRING, allowNull: false },
  salary: { 
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('salary');
      return decrypt(rawValue);
    },
    set(val) {
      this.setDataValue('salary', encrypt(val));
    }
  },
  phone: { 
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('phone');
      return decrypt(rawValue);
    },
    set(val) {
      this.setDataValue('phone', encrypt(val));
    }
  },
  avatar: { type: DataTypes.STRING, defaultValue: '' },
  status: { type: DataTypes.ENUM('Active', 'On Leave', 'Suspended'), defaultValue: 'Active' },
  dob: { 
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('dob');
      return decrypt(rawValue);
    },
    set(val) {
      this.setDataValue('dob', encrypt(val));
    }
  },
  gender: { type: DataTypes.STRING },
  address: { 
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('address');
      return decrypt(rawValue);
    },
    set(val) {
      this.setDataValue('address', encrypt(val));
    }
  },
  joiningDate: { type: DataTypes.STRING, field: 'joining_date' },
  reportingManager: { type: DataTypes.STRING, field: 'reporting_manager' }
}, {
  tableName: 'employees',
  timestamps: false,
  defaultScope: {
    attributes: { exclude: ['passwordHash'] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

module.exports = Employee;
