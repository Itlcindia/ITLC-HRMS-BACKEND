const sequelize = require('./config/db');
const Company = require('./models/Company');
const Employee = require('./models/Employee');

async function check() {
  try {
    const companies = await Company.findAll();
    console.log(`=== COMPANIES (${companies.length}) ===`);
    for (const c of companies) {
      console.log(`ID: ${c.id}, Name: ${c.name}, Email: ${c.email}, Owner: ${c.ownerName}`);
    }

    const employees = await Employee.findAll();
    console.log(`\n=== EMPLOYEES (${employees.length}) ===`);
    for (const e of employees) {
      console.log(`ID: ${e.id}, Email: ${e.email}, Role: ${e.role}, CompanyID: ${e.companyId}, Hash: ${e.passwordHash}`);
    }
  } catch (err) {
    console.error("Database query failed:", err.message);
  } finally {
    process.exit(0);
  }
}

check();
