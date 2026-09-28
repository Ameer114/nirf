const connectDB = require('../config/db');
const { getDepartmentModel, DEPARTMENT_ALIAS_MAP, DEPARTMENTS } = require('../models/DepartmentStrength');
const mongoose = require('mongoose');

// Tabular dataset provided by user
const RAW_SEED_DATA = [
  // CSE
  { DEPARTMENT: 'CSE', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSE', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSE', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'CSE', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 },

  // ISE
  { DEPARTMENT: 'ISE', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'ISE', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'ISE', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'ISE', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 },

  // CSD
  { DEPARTMENT: 'CSD', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSD', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSD', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'CSD', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 },

  // AIML
  { DEPARTMENT: 'AIML', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'AIML', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'AIML', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'AIML', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 },

  // ECE
  { DEPARTMENT: 'ECE', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'ECE', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'ECE', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'ECE', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 },

  // EEE
  { DEPARTMENT: 'EEE', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'EEE', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'EEE', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'EEE', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 },

  // MECH
  { DEPARTMENT: 'MECH', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'MECH', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'MECH', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'MECH', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 },

  // CIVIL
  { DEPARTMENT: 'CIVIL', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CIVIL', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CIVIL', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'CIVIL', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 },

  // CSE-CYBER (CSCY)
  { DEPARTMENT: 'CSE-CYBER', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSE-CYBER', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSE-CYBER', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'CSE-CYBER', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 },

  // CSE-IOT (CSIOT)
  { DEPARTMENT: 'CSE-IOT', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSE-IOT', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSE-IOT', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'CSE-IOT', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 },

  // CSE-DS (CSDS)
  { DEPARTMENT: 'CSE-DS', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSE-DS', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSE-DS', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'CSE-DS', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 },

  // CSE-AI (CSAI)
  { DEPARTMENT: 'CSE-AI', YEAR: '2024-25', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSE-AI', YEAR: '2023-24', NT: 360, NE: 400, NP: 0 },
  { DEPARTMENT: 'CSE-AI', YEAR: '2022-23', NT: 360, NE: 380, NP: 0 },
  { DEPARTMENT: 'CSE-AI', YEAR: '2021-22', NT: 280, NE: 300, NP: 0 }
];

async function seedData() {
  try {
    console.log('====================================================');
    console.log(' Seeding Student Strength Data into Department Tables');
    console.log('====================================================');

    await connectDB();

    // Group rows by target collection
    const grouped = {};
    for (const row of RAW_SEED_DATA) {
      const targetCollection = DEPARTMENT_ALIAS_MAP[row.DEPARTMENT.toUpperCase()] || row.DEPARTMENT.toUpperCase();
      if (!grouped[targetCollection]) {
        grouped[targetCollection] = [];
      }
      grouped[targetCollection].push(row);
    }

    console.log(`\nFound data for ${Object.keys(grouped).length} departments (${RAW_SEED_DATA.length} total rows).\n`);

    for (const [collectionName, records] of Object.entries(grouped)) {
      const Model = getDepartmentModel(collectionName);
      console.log(`--> Seeding table "${collectionName}" (${records.length} records)...`);

      for (const record of records) {
        await Model.findOneAndUpdate(
          { YEAR: record.YEAR },
          {
            DEPARTMENT: record.DEPARTMENT,
            YEAR: record.YEAR,
            NT: Number(record.NT),
            NE: Number(record.NE),
            NP: Number(record.NP)
          },
          { upsert: true, new: true, runValidators: true }
        );
      }
      console.log(`    [SUCCESS] "${collectionName}" populated.`);
    }

    console.log('\n====================================================');
    console.log(' Verification Summary: Document Count Per Table');
    console.log('====================================================');

    for (const dept of DEPARTMENTS) {
      const Model = getDepartmentModel(dept.id);
      const count = await Model.countDocuments();
      const sample = await Model.find({}, { _id: 0, YEAR: 1, NT: 1, NE: 1, NP: 1 }).sort({ YEAR: -1 });
      const years = sample.map(s => `${s.YEAR} (NT:${s.NT}, NE:${s.NE}, NP:${s.NP})`).join(', ');
      console.log(`  Table [${dept.id}] (${dept.name}): ${count} rows -> ${years}`);
    }

    console.log('\nAll data seeded successfully into all respective department tables!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedData();
