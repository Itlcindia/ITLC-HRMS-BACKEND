const { Sequelize } = require('sequelize');

const dbHost = process.env.DB_HOST || 'localhost';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'u997632379_hrms',
  process.env.DB_USER || 'u997632379_itlchrms',
  process.env.DB_PASS || 'Itlc@1000',
  {
    host: dbHost,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
