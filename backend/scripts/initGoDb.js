const connectDB = require('../config/db');
const { DEPARTMENTS, GO_DB_NAME, getGOModel } = require('../models/DepartmentGO');
const mongoose = require('mongoose');

// Seed data generator for a department
function generateInitialGOData(deptId) {
  // 5 UG cohorts covering both NIRF 2026 (2021-22..2024-25) and NIRF 2027 (2022-23..2025-26)
  const ug = [
    { intakeYr: '2018-19', lateralYr: '2019-20', year: '2021-22', intake: 300, admitted: 270, lateral: 25, graduated: 235, placed: 175, medSalary: 500000, higher: 25 },
    { intakeYr: '2019-20', lateralYr: '2020-21', year: '2022-23', intake: 320, admitted: 290, lateral: 28, graduated: 255, placed: 190, medSalary: 550000, higher: 30 },
    { intakeYr: '2020-21', lateralYr: '2021-22', year: '2023-24', intake: 360, admitted: 325, lateral: 30, graduated: 285, placed: 215, medSalary: 600000, higher: 35 },
    { intakeYr: '2021-22', lateralYr: '2022-23', year: '2024-25', intake: 360, admitted: 330, lateral: 32, graduated: 290, placed: 225, medSalary: 650000, higher: 35 },
    { intakeYr: '2022-23', lateralYr: '2023-24', year: '2025-26', intake: 360, admitted: 340, lateral: 35, graduated: 300, placed: 240, medSalary: 700000, higher: 40 },
  ];

  // PG cohorts
  const pg = [
    { year: '2021-22', intake: 36, admitted: 32, graduated: 30, placed: 24, medSalary: 600000, higher: 4 },
    { year: '2022-23', intake: 36, admitted: 33, graduated: 31, placed: 25, medSalary: 650000, higher: 5 },
    { year: '2023-24', intake: 36, admitted: 34, graduated: 32, placed: 26, medSalary: 700000, higher: 5 },
    { year: '2024-25', intake: 36, admitted: 35, graduated: 33, placed: 27, medSalary: 750000, higher: 5 },
  ];

  const phd_full = 12;
  const phd_part = 6;

  return { department: deptId, ug, pg, phd_full, phd_part };
}

async function initGODatabase() {
  try {
    console.log('====================================================');
    console.log(`Initializing "${GO_DB_NAME}" MongoDB Database...`);
    console.log('====================================================');

    await connectDB();
    const goDb = mongoose.connection.useDb(GO_DB_NAME, { useCache: true });
    const db = goDb.db;

    // List existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map(c => c.name));

    console.log(`\nChecking / Creating ${DEPARTMENTS.length} department tables (collections) in "${GO_DB_NAME}":`);

    for (const dept of DEPARTMENTS) {
      const Model = getGOModel(dept.id);

      if (!existingNames.has(dept.id)) {
        await db.createCollection(dept.id);
        console.log(`  [CREATED] Table "${dept.id}" (${dept.name}) created.`);
      } else {
        console.log(`  [OK] Table "${dept.id}" (${dept.name}) exists.`);
      }

      const initialData = generateInitialGOData(dept.id);
      await Model.findOneAndUpdate(
        { department: dept.id },
        initialData,
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`    -> Seeded / Updated GO data for "${dept.id}" (5 UG cohorts with intake/lateral/grad years, 4 PG cohorts, PhD data).`);
    }

    const finalCollections = await db.listCollections().toArray();
    console.log(`\nAll tables (collections) in database "${GO_DB_NAME}":`);
    finalCollections.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.name}`);
    });

    console.log('\nGO database initialization completed successfully!');
    console.log('====================================================');
  } catch (error) {
    console.error('GO database initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

initGODatabase();
