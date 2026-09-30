const connectDB = require('../config/db');
const { DEPARTMENTS, OI_DB_NAME, getOIModel } = require('../models/DepartmentOI');
const mongoose = require('mongoose');

// Seed data generator for department's UG (4-Year Program) OI Data
function generateInitialOIData(deptId) {
  // Tailored baseline counts per department size
  const baseSizeMap = {
    CSE: 960,
    ISE: 720,
    ECE: 720,
    EEE: 480,
    MECH: 480,
    CIVIL: 480,
    AIML: 480,
    CSD: 360,
    CSAI: 360,
    CSDS: 360,
    CSIOT: 360,
    CSCY: 360
  };

  const ts = baseSizeMap[deptId] || 600;
  const male = Math.round(ts * 0.58);
  const female = ts - male;
  const os = Math.round(ts * 0.10); // ~10% outside state
  const oc = Math.round(ts * 0.015); // ~1.5% outside country
  const ews = Math.round(ts * 0.09); // ~9% EWS
  const sc_st_obc = Math.round(ts * 0.38); // ~38% Social diversity
  const govt_sch = Math.round(ts * 0.26); // ~26% Govt scholarship
  const inst_sch = Math.round(ts * 0.12); // ~12% Inst scholarship
  const priv_sch = Math.round(ts * 0.07); // ~7% Private scholarship

  return {
    department: deptId,
    ug4: {
      program: 'UG (4-Year Program)',
      ts,
      male,
      female,
      os,
      oc,
      ews,
      sc_st_obc,
      govt_sch,
      inst_sch,
      priv_sch
    },
    pcs_score: 20
  };
}

async function initOIDatabase() {
  try {
    console.log('====================================================');
    console.log(`Initializing "${OI_DB_NAME}" MongoDB Database...`);
    console.log('====================================================');

    await connectDB();
    const oiDb = mongoose.connection.useDb(OI_DB_NAME, { useCache: true });
    const db = oiDb.db;

    // List existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map(c => c.name));

    console.log(`\nChecking / Creating ${DEPARTMENTS.length} department tables (collections) in "${OI_DB_NAME}":`);

    for (const dept of DEPARTMENTS) {
      const Model = getOIModel(dept.id);

      if (!existingNames.has(dept.id)) {
        await db.createCollection(dept.id);
        console.log(`  [CREATED] Table "${dept.id}" (${dept.name}) created.`);
      } else {
        console.log(`  [OK] Table "${dept.id}" (${dept.name}) exists.`);
      }

      const initialData = generateInitialOIData(dept.id);
      await Model.findOneAndUpdate(
        { department: dept.id },
        initialData,
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`    -> Seeded / Initialized UG (4-Year Program) OI data for "${dept.id}" (TS: ${initialData.ug4.ts}, Male: ${initialData.ug4.male}, Female: ${initialData.ug4.female}, PCS: 20).`);
    }

    const finalCollections = await db.listCollections().toArray();
    console.log(`\nAll tables (collections) in database "${OI_DB_NAME}":`);
    finalCollections.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.name}`);
    });

    console.log('\nOI database initialization completed successfully!');
    console.log('====================================================');
  } catch (error) {
    console.error('OI database initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

initOIDatabase();
