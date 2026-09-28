const connectDB = require('../config/db');
const { DEPARTMENTS } = require('../models/DepartmentStrength');
const mongoose = require('mongoose');

async function initDatabase() {
  try {
    console.log('----------------------------------------------------');
    console.log('Initializing "student_strength" MongoDB Database...');
    console.log('----------------------------------------------------');

    await connectDB();
    const db = mongoose.connection.db;

    // Get list of existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map(c => c.name));

    console.log(`\nChecking / Creating ${DEPARTMENTS.length} department tables (collections):`);

    for (const dept of DEPARTMENTS) {
      if (existingNames.has(dept.id)) {
        console.log(`  [OK] Table "${dept.id}" (${dept.name}) already exists.`);
      } else {
        await db.createCollection(dept.id);
        console.log(`  [CREATED] Table "${dept.id}" (${dept.name}) created successfully.`);
      }
    }

    // List all collections currently in the database
    const finalCollections = await db.listCollections().toArray();
    console.log('\nAll tables (collections) in database:');
    finalCollections.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.name}`);
    });

    console.log('\nDatabase initialization completed successfully!');
    console.log('Ready for ETL pipeline integration.');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

initDatabase();
