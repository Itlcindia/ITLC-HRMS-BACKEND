const { Op } = require('sequelize');
const sequelize = require('./config/db');
const Company = require('./models/Company');
const Employee = require('./models/Employee');
const Payment = require('./models/Payment');

async function lookup() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Connected successfully.\n");

    const queryEmail = 'info.itlcindia@gmail.com';
    const queryDomain = 'info.itlcindia';

    console.log(`--- Searching Employees matching '%info%' or '${queryDomain}' ---`);
    const employees = await Employee.findAll({
      where: {
        [Op.or]: [
          { email: { [Op.like]: `%info%` } },
          { email: { [Op.like]: `%${queryDomain}%` } }
        ]
      }
    });

    if (employees.length === 0) {
      console.log("No employees found.\n");
    } else {
      for (const emp of employees) {
        console.log(`Employee found:`);
        console.log(`- ID: ${emp.id}`);
        console.log(`- Name: ${emp.name}`);
        console.log(`- Email: ${emp.email}`);
        console.log(`- Role: ${emp.role}`);
        console.log(`- Company ID: ${emp.companyId}`);
        console.log(`- Status: ${emp.status}`);
        console.log('-----------------------------------');
      }
      console.log();
    }

    console.log(`--- Searching Companies matching '%info%' or '${queryDomain}' ---`);
    const companies = await Company.findAll({
      where: {
        [Op.or]: [
          { email: { [Op.like]: `%info%` } },
          { email: { [Op.like]: `%${queryDomain}%` } }
        ]
      }
    });

    const companyIds = new Set(employees.map(e => e.companyId).filter(Boolean));
    for (const c of companies) {
      companyIds.add(c.id);
    }

    if (companyIds.size === 0) {
      console.log("No companies found associated with search query.\n");
    } else {
      for (const cid of companyIds) {
        const comp = await Company.findByPk(cid);
        if (!comp) continue;

        console.log(`Company details for: ${comp.name} (${comp.id})`);
        console.log(`- Owner Email: ${comp.email}`);
        console.log(`- Subscription Plan ID: ${comp.subscriptionPlanId}`);
        console.log(`- Status: ${comp.status}`);
        console.log(`- Max Employees: ${comp.maxEmployees}`);
        console.log(`- Storage Limit: ${comp.storageLimit} GB`);
        
        console.log(`- Searching payments for Company ID: ${cid}`);
        const payments = await Payment.findAll({
          where: { companyId: cid }
        });
        if (payments.length === 0) {
          console.log("  No payments found for this company.");
        } else {
          for (const pay of payments) {
            console.log(`  * Payment ID: ${pay.id}`);
            console.log(`    Plan: ${pay.planId}`);
            console.log(`    Amount: ${pay.amount} ${pay.currency}`);
            console.log(`    Date: ${pay.date}`);
            console.log(`    Gateway: ${pay.gateway}`);
            console.log(`    Status: ${pay.status}`);
          }
        }
        console.log('===================================');
      }
    }
  } catch (err) {
    console.error("Lookup failed:", err);
  } finally {
    await sequelize.close();
  }
}

lookup();
