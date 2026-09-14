require('dotenv').config();
const sequelize = require('./config/db');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Add columns if they don't exist
    try {
      await sequelize.query("ALTER TABLE companies ADD COLUMN lat FLOAT NULL;");
      console.log("Added lat column");
    } catch (e) {
      console.log("lat column status:", e.message);
    }
    
    try {
      await sequelize.query("ALTER TABLE companies ADD COLUMN lng FLOAT NULL;");
      console.log("Added lng column");
    } catch (e) {
      console.log("lng column status:", e.message);
    }
    
    try {
      await sequelize.query("ALTER TABLE companies ADD COLUMN radius FLOAT DEFAULT 500;");
      console.log("Added radius column");
    } catch (e) {
      console.log("radius column status:", e.message);
    }
    
    const [results] = await sequelize.query("DESCRIBE companies;");
    console.log("Columns in companies table:");
    console.log(results.map(r => `${r.Field} (${r.Type})`));
    
  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    await sequelize.close();
  }
}

run();
