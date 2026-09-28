const connectDB = require('../config/db');
const { DEPARTMENTS, FACULTY_DB_NAME } = require('../models/DepartmentFaculty');
const mongoose = require('mongoose');

async function initFacultyDatabase() {
  try {
    console.log('====================================================');
    console.log(`Initializing "${FACULTY_DB_NAME}" MongoDB Database...`);
    console.log('====================================================');

    await connectDB();
    const facultyDb = mongoose.connection.useDb(FACULTY_DB_NAME, { useCache: true });
    const db = facultyDb.db;

    // List existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map(c => c.name));

    console.log(`\nChecking / Creating ${DEPARTMENTS.length} department tables (collections) in "${FACULTY_DB_NAME}":`);

    for (const dept of DEPARTMENTS) {
      if (existingNames.has(dept.id)) {
        console.log(`  [OK] Table "${dept.id}" (${dept.name}) already exists.`);
      } else {
        await db.createCollection(dept.id);
        console.log(`  [CREATED] Table "${dept.id}" (${dept.name}) created successfully.`);
      }
    }

    const finalCollections = await db.listCollections().toArray();
    console.log(`\nAll tables (collections) in database "${FACULTY_DB_NAME}":`);
    finalCollections.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.name}`);
    });

    console.log('\nFaculty database initialization completed successfully!');
    console.log('====================================================');
  } catch (error) {
    console.error('Faculty database initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

initFacultyDatabase();
