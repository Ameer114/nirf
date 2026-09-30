const connectDB = require('../config/db');
const { DEPARTMENTS, PATENT_DB_NAME, getPatentModel } = require('../models/DepartmentPatent');
const mongoose = require('mongoose');

// Seed patents for CSE department
const CSE_PATENTS = [
  {
    sl_no: 1,
    app_no: '202641001245',
    status: 'Published',
    inventor_name: 'Dr. Chitra K, Dr. Ravi Kumar S',
    title: 'Blockchain-Enabled Decentralized Electronic Health Record Security System',
    applicant_name: 'Dayananda Sagar Academy of Technology and Management',
    filed_date: '12/10/2025',
    pub_granted_date: '16/01/2026',
    pub_granted_no: '03/2026',
    assignee_name: 'Dayananda Sagar Academy of Technology and Management, Bangalore',
    source_proof: 'https://ipindiaservices.gov.in/PublicSearch/PublicationSearch/PatentDetails?AppNo=202641001245',
    pub_month: 'Jan 2026'
  },
  {
    sl_no: 2,
    app_no: '202541088921',
    status: 'Granted',
    inventor_name: 'Dr. Anitha R, Dr. Suresh M',
    title: 'Intelligent IoT Edge Gateway for Predictive Cardiac Health Telemonitoring',
    applicant_name: 'Dayananda Sagar Academy of Technology and Management',
    filed_date: '04/05/2024',
    pub_granted_date: '28/01/2026',
    pub_granted_no: 'IN 524108',
    assignee_name: 'Dayananda Sagar Academy of Technology and Management, Bangalore',
    source_proof: 'https://ipindiaservices.gov.in/PatentSearch/GrantedSearch/PatentDetails?PatentNo=IN524108',
    pub_month: 'Jan 2026'
  },
  {
    sl_no: 3,
    app_no: '202641003412',
    status: 'Published',
    inventor_name: 'Dr. Ravi Kumar, Dr. Priya S',
    title: 'Deep Learning System for Early-Stage Diabetic Retinopathy Detection',
    applicant_name: 'Dayananda Sagar Academy of Technology and Management',
    filed_date: '18/11/2025',
    pub_granted_date: '13/02/2026',
    pub_granted_no: '07/2026',
    assignee_name: 'Dayananda Sagar Academy of Technology and Management, Bangalore',
    source_proof: 'https://ipindia.gov.in/journal-archive/2026/journal_07_2026.pdf',
    pub_month: 'Feb 2026'
  },
  {
    sl_no: 4,
    app_no: '202441065431',
    status: 'Granted',
    inventor_name: 'Dr. Mahesh B, Dr. Chitra K',
    title: 'Adaptive Energy-Harvesting Sensor Node Architecture for Precision Agriculture',
    applicant_name: 'Dayananda Sagar Academy of Technology and Management',
    filed_date: '15/02/2024',
    pub_granted_date: '20/02/2026',
    pub_granted_no: 'IN 530219',
    assignee_name: 'Dayananda Sagar Academy of Technology and Management, Bangalore',
    source_proof: 'https://ipindiaservices.gov.in/PatentSearch/GrantedSearch/PatentDetails?PatentNo=IN530219',
    pub_month: 'Feb 2026'
  },
  {
    sl_no: 5,
    app_no: '202641005678',
    status: 'Published',
    inventor_name: 'Dr. Priya S, Dr. Mahesh B',
    title: 'Autonomous Drone-Assisted Crop Disease Surveillance and Precision Spraying',
    applicant_name: 'Dayananda Sagar Academy of Technology and Management',
    filed_date: '02/01/2026',
    pub_granted_date: '06/03/2026',
    pub_granted_no: '10/2026',
    assignee_name: 'Dayananda Sagar Academy of Technology and Management, Bangalore',
    source_proof: 'https://ipindia.gov.in/journal-archive/2026/journal_10_2026.pdf',
    pub_month: 'March 2026'
  },
  {
    sl_no: 6,
    app_no: '202441077654',
    status: 'Granted',
    inventor_name: 'Dr. Suresh M, Dr. Anitha R',
    title: 'Hardware-Assisted Neural Accelerators for Low-Latency Cyber Intrusion Detection',
    applicant_name: 'Dayananda Sagar Academy of Technology and Management',
    filed_date: '22/03/2024',
    pub_granted_date: '15/03/2026',
    pub_granted_no: 'IN 535890',
    assignee_name: 'Dayananda Sagar Academy of Technology and Management, Bangalore',
    source_proof: 'https://ipindiaservices.gov.in/PatentSearch/GrantedSearch/PatentDetails?PatentNo=IN535890',
    pub_month: 'March 2026'
  },
  {
    sl_no: 7,
    app_no: '202641007890',
    status: 'Published',
    inventor_name: 'Dr. Kavitha R, Dr. Chitra K',
    title: 'Self-Organizing Mesh Network for Post-Disaster Emergency Communication',
    applicant_name: 'Dayananda Sagar Academy of Technology and Management',
    filed_date: '20/01/2026',
    pub_granted_date: '10/04/2026',
    pub_granted_no: '15/2026',
    assignee_name: 'Dayananda Sagar Academy of Technology and Management, Bangalore',
    source_proof: 'https://ipindia.gov.in/journal-archive/2026/journal_15_2026.pdf',
    pub_month: 'April 2026'
  },
  {
    sl_no: 8,
    app_no: '202341098123',
    status: 'Granted',
    inventor_name: 'Dr. Naveen P, Dr. Ravi Kumar',
    title: 'Compact Dual-Polarized Microstrip Antenna for High-Density 5G Base Stations',
    applicant_name: 'Dayananda Sagar Academy of Technology and Management',
    filed_date: '10/11/2023',
    pub_granted_date: '22/04/2026',
    pub_granted_no: 'IN 541002',
    assignee_name: 'Dayananda Sagar Academy of Technology and Management, Bangalore',
    source_proof: 'https://ipindiaservices.gov.in/PatentSearch/GrantedSearch/PatentDetails?PatentNo=IN541002',
    pub_month: 'April 2026'
  }
];

// Helper to generate domain-specific dummy patent records for other departments
function generateDeptPatents(deptId) {
  if (deptId === 'CSE') {
    return CSE_PATENTS.map(p => ({ ...p, department: 'CSE' }));
  }

  const deptPatents = {
    ECE: [
      { app: '202641011001', s: 'Published', inv: 'Dr. Sandesh R S, Dr. Manjula G', t: 'Beamforming Metasurface Antenna Array for 6G Terahertz Communication', f: '10/11/2025', pg: '16/01/2026', no: '03/2026', m: 'Jan 2026' },
      { app: '202441022002', s: 'Granted', inv: 'Dr. Manjula G, Dr. Rashmi S', t: 'Ultra-Low Voltage Level Shifter Circuit for Implantable Medical Devices', f: '15/01/2024', pg: '05/02/2026', no: 'IN 526110', m: 'Feb 2026' },
      { app: '202641033003', s: 'Published', inv: 'Dr. Rashmi S, Dr. Halesh M R', t: 'Photonic Crystal Fiber Sensor for Environmental Chemical Toxin Detection', f: '28/12/2025', pg: '20/03/2026', no: '12/2026', m: 'March 2026' },
      { app: '202341044004', s: 'Granted', inv: 'Dr. Halesh M R, Dr. Sandesh R S', t: 'Cryptographic Accelerator for Lightweight IoT Device Authentication', f: '04/09/2023', pg: '18/04/2026', no: 'IN 539870', m: 'April 2026' }
    ],
    ISE: [
      { app: '202641055001', s: 'Published', inv: 'Dr. Roopa M, Dr. Raghavendra K', t: 'Privacy-Preserving Federated Learning Architecture for Cloud Diagnostics', f: '05/11/2025', pg: '23/01/2026', no: '04/2026', m: 'Jan 2026' },
      { app: '202441066002', s: 'Granted', inv: 'Dr. Raghavendra K, Dr. Shobha B', t: 'Verifiable Zero-Knowledge Computation System for Cloud Storage Proofs', f: '18/03/2024', pg: '12/02/2026', no: 'IN 528990', m: 'Feb 2026' },
      { app: '202641077003', s: 'Published', inv: 'Dr. Shobha B, Dr. Deepa S', t: 'Graph-Theoretic Vulnerability Assessment Tool for Enterprise Software', f: '14/01/2026', pg: '27/03/2026', no: '13/2026', m: 'March 2026' }
    ],
    EEE: [
      { app: '202641088001', s: 'Published', inv: 'Dr. Venkatesh C, Dr. Padma R', t: 'Bidirectional Multi-Port Resonant Converter for Electric Vehicle Fast Charging', f: '15/10/2025', pg: '09/01/2026', no: '02/2026', m: 'Jan 2026' },
      { app: '202441099002', s: 'Granted', inv: 'Dr. Padma R, Dr. Girish B', t: 'Active Cell Balancing Device with Integrated Thermal Runaway Prevention', f: '02/06/2024', pg: '19/02/2026', no: 'IN 531450', m: 'Feb 2026' },
      { app: '202641099111', s: 'Published', inv: 'Dr. Girish B, Dr. Shanthi P', t: 'Hybrid Smart Inverter for Grid-Tied Rooftop Photovoltaic Systems', f: '08/01/2026', pg: '10/04/2026', no: '15/2026', m: 'April 2026' }
    ],
    MECH: [
      { app: '202641012111', s: 'Published', inv: 'Dr. Manjunath T, Dr. Anand Kumar', t: 'Rotary Friction Welding Tool with Adaptive Temperature Feedback', f: '22/10/2025', pg: '16/01/2026', no: '03/2026', m: 'Jan 2026' },
      { app: '202441012222', s: 'Granted', inv: 'Dr. Anand Kumar, Dr. Basavaraj S', t: 'Phase-Change Material Heat Sink for High-Performance CPU Cooling', f: '11/04/2024', pg: '25/02/2026', no: 'IN 532010', m: 'Feb 2026' }
    ],
    CIVIL: [
      { app: '202641013111', s: 'Published', inv: 'Dr. Shivakumar K, Dr. Sowmya V', t: 'Self-Healing Bio-Concrete Composition Utilizing Agricultural By-Products', f: '19/11/2025', pg: '23/01/2026', no: '04/2026', m: 'Jan 2026' },
      { app: '202441013222', s: 'Granted', inv: 'Dr. Sowmya V, Dr. Ramesh N', t: 'Porous Asphalt Pavement Mix for Urban Stormwater Retention and Filtration', f: '20/05/2024', pg: '18/03/2026', no: 'IN 536410', m: 'March 2026' }
    ],
    AIML: [
      { app: '202641014111', s: 'Published', inv: 'Dr. Harish B S, Dr. Shilpa K', t: 'Neuromorphic Spiking Neural Network Accelerator for Speech Synthesis', f: '14/10/2025', pg: '09/01/2026', no: '02/2026', m: 'Jan 2026' },
      { app: '202441014222', s: 'Granted', inv: 'Dr. Shilpa K, Dr. Vinay C', t: 'Automated Real-Time Defect Detection System Using Edge Computer Vision', f: '10/02/2024', pg: '05/03/2026', no: 'IN 534500', m: 'March 2026' }
    ]
  };

  const list = deptPatents[deptId] || [
    { app: `2026410${deptId}01`, s: 'Published', inv: `Dr. Lead ${deptId}, Dr. Senior ${deptId}`, t: `Innovative Engineering Process for Automated ${deptId} Analysis`, f: '15/10/2025', pg: '16/01/2026', no: '03/2026', m: 'Jan 2026' },
    { app: `2024410${deptId}02`, s: 'Granted', inv: `Dr. Head ${deptId}, Dr. Lead ${deptId}`, t: `Apparatus and Method for Enhanced ${deptId} Performance Monitoring`, f: '10/03/2024', pg: '20/02/2026', no: `IN 5309${deptId.length}`, m: 'Feb 2026' }
  ];

  return list.map((item, idx) => ({
    department: deptId,
    sl_no: idx + 1,
    app_no: item.app,
    status: item.s,
    inventor_name: item.inv,
    title: item.t,
    applicant_name: 'Dayananda Sagar Academy of Technology and Management',
    filed_date: item.f,
    pub_granted_date: item.pg,
    pub_granted_no: item.no,
    assignee_name: 'Dayananda Sagar Academy of Technology and Management, Bangalore',
    source_proof: `https://ipindiaservices.gov.in/PatentDetails?AppNo=${item.app}`,
    pub_month: item.m
  }));
}

async function initPatentDatabase() {
  try {
    console.log('====================================================');
    console.log(`Initializing "${PATENT_DB_NAME}" MongoDB Database...`);
    console.log('====================================================');

    await connectDB();
    const patentDb = mongoose.connection.useDb(PATENT_DB_NAME, { useCache: true });
    const db = patentDb.db;

    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map(c => c.name));

    console.log(`\nChecking / Creating ${DEPARTMENTS.length} department tables (collections) in "${PATENT_DB_NAME}":`);

    for (const dept of DEPARTMENTS) {
      const Model = getPatentModel(dept.id);

      if (!existingNames.has(dept.id)) {
        await db.createCollection(dept.id);
        console.log(`  [CREATED] Table "${dept.id}" (${dept.name}) created.`);
      } else {
        console.log(`  [OK] Table "${dept.id}" (${dept.name}) exists.`);
      }

      await Model.deleteMany({});
      const initialData = generateDeptPatents(dept.id);
      await Model.insertMany(initialData);
      console.log(`    -> Seeded ${initialData.length} unique patent records for "${dept.id}".`);
    }

    const finalCollections = await db.listCollections().toArray();
    console.log(`\nAll tables (collections) in database "${PATENT_DB_NAME}":`);
    finalCollections.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.name}`);
    });

    console.log('\nPatent database initialization completed successfully!');
    console.log('====================================================');
  } catch (error) {
    console.error('Patent database initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

initPatentDatabase();
