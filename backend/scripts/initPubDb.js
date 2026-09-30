const connectDB = require('../config/db');
const { DEPARTMENTS, PUB_DB_NAME, getPublicationModel } = require('../models/DepartmentPublication');
const mongoose = require('mongoose');

// CSE provided reference publications (exact 9 rows requested by user)
const CSE_PUBLICATIONS = [
  {
    sl_no: 1,
    faculty_name: 'Dr. Chitra K',
    title: 'Blockchain-Based Secure Data Sharing Framework for Healthcare Applications',
    authors: 'Chitra K, Ravi Kumar S, Anitha R',
    claimed_by: 'Dr. Chitra K',
    indexing: 'Scopus',
    quartile: 'Q2',
    pub_month: 'Jan 2026',
    journal_name: 'International Journal of Information Technology',
    doi: 'https://doi.org/10.1007/s41870-025-00001-1'
  },
  {
    sl_no: 2,
    faculty_name: 'Dr. Anitha R',
    title: 'Machine Learning Approach for Predictive Analytics in Healthcare',
    authors: 'Anitha R, Chitra K, Suresh M',
    claimed_by: 'Dr. Anitha R',
    indexing: 'Scopus/WoS',
    quartile: 'Q1',
    pub_month: 'Jan 2026',
    journal_name: 'Journal of Intelligent & Fuzzy Systems',
    doi: 'https://doi.org/10.3233/JIFS-250001'
  },
  {
    sl_no: 3,
    faculty_name: 'Dr. Ravi Kumar',
    title: 'Deep Learning-Based Image Classification for Medical Diagnosis',
    authors: 'Ravi Kumar, Priya S, Chitra K',
    claimed_by: 'Dr. Ravi Kumar',
    indexing: 'Scopus',
    quartile: 'Q2',
    pub_month: 'Feb 2026',
    journal_name: 'International Journal of Advanced Computer Science and Applications',
    doi: 'https://doi.org/10.14569/IJACSA.2024.0150001'
  },
  {
    sl_no: 4,
    faculty_name: 'Dr. Priya S',
    title: 'An Efficient IoT-Based Smart Agriculture Monitoring System',
    authors: 'Priya S, Ravi Kumar, Mahesh B',
    claimed_by: 'Dr. Priya S',
    indexing: 'Scopus',
    quartile: 'Q3',
    pub_month: 'March 2026',
    journal_name: 'Journal of Ambient Intelligence and Smart Environments',
    doi: 'https://doi.org/10.3233/AIS-240001'
  },
  {
    sl_no: 5,
    faculty_name: 'Dr. Mahesh B',
    title: 'Cloud-Based Resource Allocation Using Machine Learning Techniques',
    authors: 'Mahesh B, Chitra K, Anitha R',
    claimed_by: 'Dr. Mahesh B',
    indexing: 'Scopus/WoS',
    quartile: 'Q2',
    pub_month: 'April 2026',
    journal_name: 'Cluster Computing',
    doi: 'https://doi.org/10.1007/s10586-024-00001-1'
  },
  {
    sl_no: 6,
    faculty_name: 'Dr. Suresh M',
    title: 'Cybersecurity Threat Detection Using Explainable Artificial Intelligence',
    authors: 'Suresh M, Priya S, Ravi Kumar',
    claimed_by: 'Dr. Suresh M',
    indexing: 'Scopus',
    quartile: 'Q1',
    pub_month: 'April 2026',
    journal_name: 'Computers & Security',
    doi: 'https://doi.org/10.1016/j.cose.2024.000001'
  },
  {
    sl_no: 7,
    faculty_name: 'Dr. Kavitha R',
    title: 'Generative AI-Based Framework for Personalized Learning',
    authors: 'Kavitha R, Chitra K, Suresh M',
    claimed_by: 'Dr. Kavitha R',
    indexing: 'Scopus',
    quartile: 'Q2',
    pub_month: 'May 2026',
    journal_name: 'Education and Information Technologies',
    doi: 'https://doi.org/10.1007/s10639-023-00001-1'
  },
  {
    sl_no: 8,
    faculty_name: 'Dr. Naveen P',
    title: 'Edge Computing-Based Optimization of IoT Applications',
    authors: 'Naveen P, Mahesh B, Anitha R',
    claimed_by: 'Dr. Naveen P',
    indexing: 'Scopus',
    quartile: 'Q3',
    pub_month: 'June 2026',
    journal_name: 'International Journal of Communication Systems',
    doi: 'https://doi.org/10.1002/dac.00001'
  },
  {
    sl_no: 9,
    faculty_name: 'Dr. Meena K',
    title: 'Data Analytics Framework for Smart City Applications',
    authors: 'Meena K, Kavitha R, Chitra K',
    claimed_by: 'Dr. Meena K',
    indexing: 'WoS',
    quartile: 'Q4',
    pub_month: 'June 2026',
    journal_name: 'Proceedings of the International Conference on Data Analytics',
    doi: 'https://doi.org/10.1109/ICDA.2023.00001'
  }
];

// Helper to generate department-specific initial publication records
function generateDeptPublications(deptId) {
  if (deptId === 'CSE') {
    return CSE_PUBLICATIONS.map(p => ({ ...p, department: 'CSE' }));
  }

  // Domain topics mapping for unique department values
  const domainThemes = {
    ECE: [
      { f: 'Dr. Sandesh R S', t: 'Design of Reconfigurable Antenna for 6G Wireless Communication', j: 'IEEE Transactions on Antennas and Propagation', q: 'Q1', idx: 'Scopus/WoS', m: 'Jan 2026', doi: '10.1109/TAP.2025.321001' },
      { f: 'Dr. Manjula G', t: 'VLSI Architecture for Low Power DSP Accelerators', j: 'IEEE Transactions on Circuits and Systems', q: 'Q1', idx: 'Scopus', m: 'Feb 2026', doi: '10.1109/TCSI.2025.322002' },
      { f: 'Dr. Rashmi S', t: 'Deep Learning-Assisted Channel Estimation in MIMO-OFDM Systems', j: 'Wireless Networks', q: 'Q2', idx: 'Scopus', m: 'March 2026', doi: '10.1007/s11276-025-001' },
      { f: 'Dr. Halesh M R', t: 'FPGA Implementation of Fault Tolerant Cryptographic Algorithms', j: 'Microprocessors and Microsystems', q: 'Q2', idx: 'Scopus/WoS', m: 'April 2026', doi: '10.1016/j.micpro.2025.104' },
      { f: 'Dr. Raghavendra N', t: 'Energy-Efficient Sensing in Wireless Body Area Networks', j: 'IEEE Sensors Journal', q: 'Q2', idx: 'Scopus', m: 'May 2026', doi: '10.1109/JSEN.2025.325' },
      { f: 'Dr. Savitha C', t: 'Optical Fiber Sensor for Structural Health Monitoring', j: 'Optics & Laser Technology', q: 'Q3', idx: 'WoS', m: 'June 2026', doi: '10.1016/j.optlastec.2025.109' }
    ],
    ISE: [
      { f: 'Dr. Roopa M', t: 'Federated Learning for Privacy-Preserving Collaborative Healthcare', j: 'Information Sciences', q: 'Q1', idx: 'Scopus/WoS', m: 'Jan 2026', doi: '10.1016/j.ins.2025.01.002' },
      { f: 'Dr. Raghavendra K', t: 'Zero-Knowledge Proofs for Verifiable Cloud Data Computation', j: 'Computers & Security', q: 'Q1', idx: 'Scopus', m: 'Feb 2026', doi: '10.1016/j.cose.2025.103001' },
      { f: 'Dr. Shobha B', t: 'Semantic Web-Driven Recommendation System in E-Learning', j: 'Knowledge-Based Systems', q: 'Q2', idx: 'Scopus/WoS', m: 'March 2026', doi: '10.1016/j.knosys.2025.109' },
      { f: 'Dr. Deepa S', t: 'Graph Convolutional Networks for Malicious URL Detection', j: 'IEEE Access', q: 'Q2', idx: 'Scopus', m: 'April 2026', doi: '10.1109/ACCESS.2025.324' },
      { f: 'Dr. Karthik N', t: 'Scalable Microservices Architecture for High-Volume Stream Processing', j: 'Software: Practice and Experience', q: 'Q3', idx: 'Scopus', m: 'May 2026', doi: '10.1002/spe.3250' }
    ],
    EEE: [
      { f: 'Dr. Venkatesh C', t: 'Grid-Connected Solar Inverter Control Under Severe Voltage Sags', j: 'IEEE Transactions on Power Electronics', q: 'Q1', idx: 'Scopus/WoS', m: 'Jan 2026', doi: '10.1109/TPEL.2025.31201' },
      { f: 'Dr. Padma R', t: 'Optimized Battery Management for Electric Vehicle Powertrains', j: 'Journal of Energy Storage', q: 'Q1', idx: 'Scopus', m: 'Feb 2026', doi: '10.1016/j.est.2025.107001' },
      { f: 'Dr. Girish B', t: 'Microgrid Stability Enhancement Using Superconducting Magnetic Storage', j: 'Electric Power Systems Research', q: 'Q2', idx: 'Scopus/WoS', m: 'April 2026', doi: '10.1016/j.epsr.2025.109' },
      { f: 'Dr. Shanthi P', t: 'AI-Based Detection of Incipient Faults in Wind Turbine Generators', j: 'IEEE Transactions on Industrial Informatics', q: 'Q2', idx: 'Scopus', m: 'May 2026', doi: '10.1109/TII.2025.320' }
    ],
    MECH: [
      { f: 'Dr. Manjunath T', t: 'Additive Manufacturing of Inconel 718 Superalloys: Microstructure & Fatigue', j: 'Materials Science and Engineering: A', q: 'Q1', idx: 'Scopus/WoS', m: 'Jan 2026', doi: '10.1016/j.msea.2025.144001' },
      { f: 'Dr. Anand Kumar', t: 'Experimental Investigation of Phase Change Material for Thermal Management', j: 'Applied Thermal Engineering', q: 'Q1', idx: 'Scopus', m: 'March 2026', doi: '10.1016/j.applthermaleng.2025.121' },
      { f: 'Dr. Basavaraj S', t: 'CFD Analysis of Nanofluid Flow in Microchannel Heat Exchangers', j: 'International Journal of Thermal Sciences', q: 'Q2', idx: 'Scopus/WoS', m: 'April 2026', doi: '10.1016/j.ijthermalsci.2025.108' }
    ],
    CIVIL: [
      { f: 'Dr. Shivakumar K', t: 'Geopolymer Concrete with Recycled Demolition Aggregate: Strength & Durability', j: 'Construction and Building Materials', q: 'Q1', idx: 'Scopus/WoS', m: 'Jan 2026', doi: '10.1016/j.conbuildmat.2025.132001' },
      { f: 'Dr. Sowmya V', t: 'Machine Learning Models for Groundwater Level Prediction in Drought Regions', j: 'Journal of Hydrology', q: 'Q1', idx: 'Scopus', m: 'March 2026', doi: '10.1016/j.jhydrol.2025.129' },
      { f: 'Dr. Ramesh N', t: 'Seismic Vulnerability Assessment of Multi-Storey Reinforced Concrete Buildings', j: 'Structures', q: 'Q2', idx: 'Scopus', m: 'May 2026', doi: '10.1016/j.istruc.2025.105' }
    ],
    AIML: [
      { f: 'Dr. Harish B S', t: 'Transformer-Based Multi-Modal Emotion Recognition in Conversation', j: 'Neural Networks', q: 'Q1', idx: 'Scopus/WoS', m: 'Jan 2026', doi: '10.1016/j.neunet.2025.105' },
      { f: 'Dr. Shilpa K', t: 'Robust Adversarial Defense in Deep Neural Networks via Feature Denoising', j: 'Pattern Recognition', q: 'Q1', idx: 'Scopus', m: 'Feb 2026', doi: '10.1016/j.patcog.2025.109' },
      { f: 'Dr. Vinay C', t: 'Self-Supervised Contrastive Learning for Medical CT Scan Segmentation', j: 'Medical Image Analysis', q: 'Q2', idx: 'Scopus/WoS', m: 'April 2026', doi: '10.1016/j.media.2025.102' }
    ]
  };

  const domain = domainThemes[deptId] || [
    { f: `Dr. Head ${deptId}`, t: `Advanced Machine Learning Paradigms in ${deptId} Engineering Systems`, j: 'Expert Systems with Applications', q: 'Q1', idx: 'Scopus/WoS', m: 'Jan 2026', doi: `10.1016/j.eswa.2025.${deptId}01` },
    { f: `Dr. Lead ${deptId}`, t: `Secure IoT and Sensor Integration for Industry 4.0 in ${deptId}`, j: 'IEEE Internet of Things Journal', q: 'Q1', idx: 'Scopus', m: 'Feb 2026', doi: `10.1109/JIOT.2025.${deptId}02` },
    { f: `Dr. Senior ${deptId}`, t: `Optimization Algorithms for Complex Computing Architectures`, j: 'Applied Soft Computing', q: 'Q2', idx: 'Scopus', m: 'April 2026', doi: `10.1016/j.asoc.2025.${deptId}03` },
    { f: `Dr. Research ${deptId}`, t: `Performance Benchmarking in Modern Data-Intensive Environments`, j: 'Journal of Systems Architecture', q: 'Q3', idx: 'Scopus/WoS', m: 'May 2026', doi: `10.1016/j.sysarc.2025.${deptId}04` }
  ];

  return domain.map((item, idx) => ({
    department: deptId,
    sl_no: idx + 1,
    faculty_name: item.f,
    title: item.t,
    authors: `${item.f.replace('Dr. ', '')}, Co-Author A, Co-Author B`,
    claimed_by: item.f,
    indexing: item.idx,
    quartile: item.q,
    pub_month: item.m,
    journal_name: item.j,
    doi: `https://doi.org/${item.doi}`
  }));
}

async function initPublicationDatabase() {
  try {
    console.log('====================================================');
    console.log(`Initializing "${PUB_DB_NAME}" MongoDB Database...`);
    console.log('====================================================');

    await connectDB();
    const pubDb = mongoose.connection.useDb(PUB_DB_NAME, { useCache: true });
    const db = pubDb.db;

    // List existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map(c => c.name));

    console.log(`\nChecking / Creating ${DEPARTMENTS.length} department tables (collections) in "${PUB_DB_NAME}":`);

    for (const dept of DEPARTMENTS) {
      const Model = getPublicationModel(dept.id);

      if (!existingNames.has(dept.id)) {
        await db.createCollection(dept.id);
        console.log(`  [CREATED] Table "${dept.id}" (${dept.name}) created.`);
      } else {
        console.log(`  [OK] Table "${dept.id}" (${dept.name}) exists.`);
      }

      // Clear existing records and re-seed clean baseline
      await Model.deleteMany({});
      const initialData = generateDeptPublications(dept.id);
      await Model.insertMany(initialData);
      console.log(`    -> Seeded ${initialData.length} unique publication records for "${dept.id}".`);
    }

    const finalCollections = await db.listCollections().toArray();
    console.log(`\nAll tables (collections) in database "${PUB_DB_NAME}":`);
    finalCollections.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.name}`);
    });

    console.log('\nPublication database initialization completed successfully!');
    console.log('====================================================');
  } catch (error) {
    console.error('Publication database initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

initPublicationDatabase();
