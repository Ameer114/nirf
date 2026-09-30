const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { getDepartmentModel, DEPARTMENT_ALIAS_MAP, DEPARTMENTS } = require('./models/DepartmentStrength');
const { getFacultyModel, FACULTY_DB_NAME } = require('./models/DepartmentFaculty');
const { getGOModel, GO_DB_NAME } = require('./models/DepartmentGO');
const { getOIModel, OI_DB_NAME } = require('./models/DepartmentOI');
const { getPublicationModel, PUB_DB_NAME } = require('./models/DepartmentPublication');
const { getPatentModel, PATENT_DB_NAME } = require('./models/DepartmentPatent');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins (supports file://, live-server, localhost ports)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files (root directory containing index.html)
app.use(express.static(path.join(__dirname, '..')));

// Connect to MongoDB databases
connectDB();

/**
 * ══════════════════════════════════════════════════
 * FACULTY DATA API ROUTES (Database: faculty_data)
 * ══════════════════════════════════════════════════
 */

/**
 * GET /api/faculty/:deptId
 * Fetch all faculty records from the respective department table in 'faculty_data' database
 */
app.get('/api/faculty/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

    const Model = getFacultyModel(collectionName);
    const records = await Model.find({}, { _id: 0 }).sort({ sl_no: 1, createdAt: 1 });

    return res.json({
      success: true,
      department: rawDeptId,
      collection: collectionName,
      database: FACULTY_DB_NAME,
      data: records
    });
  } catch (error) {
    console.error(`Error fetching faculty for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty records from MongoDB',
      error: error.message
    });
  }
});

/**
 * POST /api/faculty/:deptId
 * Store/Override faculty records in the respective department table in 'faculty_data' database
 */
app.post('/api/faculty/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getFacultyModel(collectionName);

    const { faculty, replaceAll } = req.body;
    if (!Array.isArray(faculty)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: faculty array required' });
    }

    if (replaceAll) {
      await Model.deleteMany({});
    }

    const inserted = [];
    for (let i = 0; i < faculty.length; i++) {
      const f = faculty[i];
      if (!f.name) continue;

      const doc = await Model.create({
        sl_no: f.sl_no !== undefined ? Number(f.sl_no) : (i + 1),
        name: String(f.name).trim(),
        age: f.age ? Number(f.age) : null,
        designation: f.designation ? String(f.designation).trim() : '',
        gender: f.gender ? String(f.gender).trim().toUpperCase() : '',
        qualification: f.qualification ? String(f.qualification).trim().toUpperCase() : '',
        experience: f.experience !== undefined ? Number(f.experience) : 0,
        currently_working: f.currently_working ? String(f.currently_working).trim() : 'Yes',
        joining_date: f.joining_date ? String(f.joining_date).trim() : null,
        leaving_date: f.leaving_date ? String(f.leaving_date).trim() : null,
        association_type: f.association_type ? String(f.association_type).trim() : 'Regular',
        status: f.status || ((String(f.currently_working).toLowerCase() === 'no' || f.leaving_date) ? 'left' : 'active'),
        department: rawDeptId
      });
      inserted.push(doc);
    }

    return res.json({
      success: true,
      message: `Successfully stored ${inserted.length} faculty records in department table "${collectionName}"`,
      department: rawDeptId,
      collection: collectionName,
      database: FACULTY_DB_NAME,
      savedCount: inserted.length
    });
  } catch (error) {
    console.error(`Error saving faculty for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save faculty records to MongoDB',
      error: error.message
    });
  }
});

/**
 * DELETE /api/faculty/:deptId
 * Clear all faculty records for a specific department
 */
app.delete('/api/faculty/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getFacultyModel(collectionName);

    const result = await Model.deleteMany({});
    return res.json({
      success: true,
      message: `Cleared ${result.deletedCount} faculty records from table "${collectionName}"`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(`Error deleting faculty for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear faculty records from MongoDB',
      error: error.message
    });
  }
});

/**
 * PATCH /api/faculty/:deptId/status
 * Update currently_working status and leaving_date for a specific faculty member
 */
app.patch('/api/faculty/:deptId/status', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getFacultyModel(collectionName);

    const { name, sl_no, currently_working, leaving_date, status } = req.body;
    if (!name && sl_no === undefined) {
      return res.status(400).json({ success: false, message: 'Faculty name or sl_no required' });
    }

    const query = {};
    if (sl_no !== undefined && !isNaN(Number(sl_no))) query.sl_no = Number(sl_no);
    if (name) query.name = new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const updateData = {
      currently_working: currently_working || 'No',
      leaving_date: leaving_date || null,
      status: status || (String(currently_working).toLowerCase() === 'no' || leaving_date ? 'left' : 'active')
    };

    let doc = await Model.findOneAndUpdate(query, updateData, { new: true });
    if (!doc && name) {
      doc = await Model.findOneAndUpdate({ name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, updateData, { new: true });
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Faculty record not found' });
    }

    return res.json({
      success: true,
      message: `Updated faculty status for ${doc.name}`,
      data: doc
    });
  } catch (error) {
    console.error(`Error updating faculty status for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update faculty status in MongoDB',
      error: error.message
    });
  }
});

/**
 * POST /api/student-strength/etl-pipeline
 * Validate and override data into respective department tables from Excel ETL pipeline
 * (Placed before /:deptId to avoid route collision)
 */
app.post('/api/student-strength/etl-pipeline', async (req, res) => {
  try {
    const { rows, defaultDeptId } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid excel format: No data rows found' });
    }

    const groupedByDept = {};
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawDept = (row.DEPARTMENT || defaultDeptId || '').trim().toUpperCase();
      const deptId = DEPARTMENT_ALIAS_MAP[rawDept] || rawDept;

      if (!deptId) {
        return res.status(400).json({
          success: false,
          message: `Invalid excel format: Missing department on row ${i + 1}`
        });
      }

      const yr = String(row.YEAR || '').trim();
      const nt = Number(row.NT);
      const ne = Number(row.NE);
      const np = Number(row.NP || 0);

      if (!yr || isNaN(nt) || isNaN(ne) || isNaN(np) || !Number.isInteger(nt) || !Number.isInteger(ne) || !Number.isInteger(np) || nt < 0 || ne < 0 || np < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid excel format: Invalid values on row ${i + 1}`
        });
      }

      if (!groupedByDept[deptId]) groupedByDept[deptId] = [];
      groupedByDept[deptId].push({ YEAR: yr, NT: nt, NE: ne, NP: np, DEPARTMENT: rawDept });
    }

    const results = {};
    for (const [deptId, records] of Object.entries(groupedByDept)) {
      const Model = getDepartmentModel(deptId);
      let count = 0;
      for (const rec of records) {
        await Model.findOneAndUpdate(
          { YEAR: rec.YEAR },
          {
            DEPARTMENT: rec.DEPARTMENT || deptId,
            YEAR: rec.YEAR,
            NT: rec.NT,
            NE: rec.NE,
            NP: rec.NP
          },
          { upsert: true, new: true, runValidators: true }
        );
        count++;
      }
      results[deptId] = count;
    }

    return res.json({
      success: true,
      message: 'ETL Pipeline successfully processed and updated database tables',
      totalRows: rows.length,
      departmentsUpdated: Object.keys(results),
      details: results
    });
  } catch (error) {
    console.error('ETL pipeline processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Invalid excel format or database error: ' + error.message
    });
  }
});

/**
 * GET /api/student-strength/:deptId
 * Fetch student strength records (YEAR, NT, NE, NP) for a specific department
 */
app.get('/api/student-strength/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

    const Model = getDepartmentModel(collectionName);
    const records = await Model.find({}, { _id: 0, YEAR: 1, NT: 1, NE: 1, NP: 1, DEPARTMENT: 1 }).sort({ YEAR: -1 });

    return res.json({
      success: true,
      department: rawDeptId,
      collection: collectionName,
      data: records
    });
  } catch (error) {
    console.error(`Error fetching student strength for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student strength data from MongoDB',
      error: error.message
    });
  }
});

/**
 * POST /api/student-strength/:deptId
 * Update or save student strength records for a specific department
 */
app.post('/api/student-strength/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getDepartmentModel(collectionName);

    const { records } = req.body; // Array of { YEAR, NT, NE, NP }
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: records array required' });
    }

    const updated = [];
    for (const item of records) {
      if (!item.YEAR) continue;
      const doc = await Model.findOneAndUpdate(
        { YEAR: item.YEAR },
        {
          DEPARTMENT: rawDeptId,
          YEAR: item.YEAR,
          NT: Number(item.NT || 0),
          NE: Number(item.NE || 0),
          NP: Number(item.NP || 0)
        },
        { upsert: true, new: true, runValidators: true }
      );
      updated.push(doc);
    }

    return res.json({
      success: true,
      department: rawDeptId,
      collection: collectionName,
      updatedCount: updated.length
    });
  } catch (error) {
    console.error(`Error saving student strength for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save student strength data to MongoDB',
      error: error.message
    });
  }
});

/**
 * ══════════════════════════════════════════════════
 * GO DATA API ROUTES (Database: go_data)
 * ══════════════════════════════════════════════════
 */

/**
 * GET /api/go/:deptId
 * Fetch graduation outcome (GO) data for a specific department from 'go_data' database
 */
app.get('/api/go/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

    const Model = getGOModel(collectionName);
    let record = await Model.findOne({ department: collectionName }, { _id: 0 });
    if (!record) {
      record = await Model.findOne({}, { _id: 0 });
    }

    return res.json({
      success: true,
      department: rawDeptId,
      collection: collectionName,
      database: GO_DB_NAME,
      data: record
    });
  } catch (error) {
    console.error(`Error fetching GO data for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch GO data from MongoDB',
      error: error.message
    });
  }
});

/**
 * POST /api/go/:deptId
 * Save or update graduation outcome (GO) data for a specific department in 'go_data' database
 */
app.post('/api/go/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getGOModel(collectionName);

    const { ug, pg, phd_full, phd_part } = req.body;

    const updateData = {
      department: collectionName,
      ug: Array.isArray(ug) ? ug.map(r => ({
        intakeYr: String(r.intakeYr || '').trim(),
        lateralYr: String(r.lateralYr || '').trim(),
        year: String(r.year || '').trim(),
        intake: Number(r.intake || 0),
        admitted: Number(r.admitted || 0),
        lateral: Number(r.lateral || 0),
        graduated: Number(r.graduated || 0),
        placed: Number(r.placed || 0),
        medSalary: Number(r.medSalary || 0),
        higher: Number(r.higher || 0)
      })) : [],
      pg: Array.isArray(pg) ? pg.map(r => ({
        year: String(r.year || '').trim(),
        intake: Number(r.intake || 0),
        admitted: Number(r.admitted || 0),
        graduated: Number(r.graduated || 0),
        placed: Number(r.placed || 0),
        medSalary: Number(r.medSalary || 0),
        higher: Number(r.higher || 0)
      })) : [],
      phd_full: Number(phd_full || 0),
      phd_part: Number(phd_part || 0)
    };

    const doc = await Model.findOneAndUpdate(
      { department: collectionName },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: `Successfully saved GO data for department "${collectionName}"`,
      department: rawDeptId,
      collection: collectionName,
      database: GO_DB_NAME,
      data: doc
    });
  } catch (error) {
    console.error(`Error saving GO data for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save GO data to MongoDB',
      error: error.message
    });
  }
});

/**
 * DELETE /api/go/:deptId
 * Clear or reset GO data for a specific department
 */
app.delete('/api/go/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getGOModel(collectionName);

    await Model.deleteMany({});
    return res.json({
      success: true,
      message: `Cleared GO data for table "${collectionName}"`,
      department: rawDeptId,
      collection: collectionName
    });
  } catch (error) {
    console.error(`Error clearing GO data for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear GO data from MongoDB',
      error: error.message
    });
  }
});

/**
 * ══════════════════════════════════════════════════
 * OI DATA API ROUTES (Database: oi_data)
 * ══════════════════════════════════════════════════
 */

/**
 * GET /api/oi/:deptId
 * Fetch Outreach & Inclusivity (OI) data for a specific department from 'oi_data' database
 */
app.get('/api/oi/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

    const Model = getOIModel(collectionName);
    let record = await Model.findOne({ department: collectionName }, { _id: 0 });
    if (!record) {
      record = await Model.findOne({}, { _id: 0 });
    }

    return res.json({
      success: true,
      department: rawDeptId,
      collection: collectionName,
      database: OI_DB_NAME,
      data: record
    });
  } catch (error) {
    console.error(`Error fetching OI data for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch OI data from MongoDB',
      error: error.message
    });
  }
});

/**
 * POST /api/oi/:deptId
 * Save or update Outreach & Inclusivity (OI) UG (4-Year Program) data for a specific department in 'oi_data' database
 */
app.post('/api/oi/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getOIModel(collectionName);

    const { ug4, pcs_score } = req.body;

    const updateData = {
      department: collectionName,
      ug4: {
        program: 'UG (4-Year Program)',
        ts: Number(ug4?.ts || 0),
        male: Number(ug4?.male || 0),
        female: Number(ug4?.female || 0),
        os: Number(ug4?.os || 0),
        oc: Number(ug4?.oc || 0),
        ews: Number(ug4?.ews || 0),
        sc_st_obc: Number(ug4?.sc_st_obc || 0),
        govt_sch: Number(ug4?.govt_sch || 0),
        inst_sch: Number(ug4?.inst_sch || 0),
        priv_sch: Number(ug4?.priv_sch || 0)
      },
      pcs_score: Number(pcs_score !== undefined ? pcs_score : 20)
    };

    const doc = await Model.findOneAndUpdate(
      { department: collectionName },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: `Successfully saved OI data for department "${collectionName}"`,
      department: rawDeptId,
      collection: collectionName,
      database: OI_DB_NAME,
      data: doc
    });
  } catch (error) {
    console.error(`Error saving OI data for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save OI data to MongoDB',
      error: error.message
    });
  }
});

/**
 * DELETE /api/oi/:deptId
 * Clear or reset OI data for a specific department in 'oi_data'
 */
app.delete('/api/oi/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getOIModel(collectionName);

    await Model.deleteMany({});
    return res.json({
      success: true,
      message: `Cleared OI data for table "${collectionName}"`,
      department: rawDeptId,
      collection: collectionName
    });
  } catch (error) {
    console.error(`Error clearing OI data for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear OI data from MongoDB',
      error: error.message
    });
  }
});

/**
 * ══════════════════════════════════════════════════
 * PUBLICATION DATA API ROUTES (Database: publication_data)
 * ══════════════════════════════════════════════════
 */

/**
 * GET /api/publications/:deptId
 * Fetch all publication records for a department from 'publication_data'
 */
app.get('/api/publications/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

    const Model = getPublicationModel(collectionName);
    const records = await Model.find({}, { _id: 0 }).sort({ sl_no: 1, createdAt: 1 });

    return res.json({
      success: true,
      department: rawDeptId,
      collection: collectionName,
      database: PUB_DB_NAME,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error(`Error fetching publications for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch publications from MongoDB',
      error: error.message
    });
  }
});

/**
 * POST /api/publications/:deptId
 * Save / replace the entire publication list for a department in 'publication_data'
 */
app.post('/api/publications/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getPublicationModel(collectionName);

    const publications = Array.isArray(req.body.publications) ? req.body.publications : (Array.isArray(req.body) ? req.body : []);

    const cleaned = publications.map((p, idx) => ({
      department: collectionName,
      sl_no: Number(p.sl_no) || (idx + 1),
      faculty_name: String(p.faculty_name || '').trim(),
      title: String(p.title || '').trim(),
      authors: String(p.authors || '').trim(),
      claimed_by: String(p.claimed_by || '').trim(),
      indexing: String(p.indexing || 'Scopus').trim(),
      quartile: String(p.quartile || 'Q2').trim(),
      pub_month: String(p.pub_month || '').trim(),
      journal_name: String(p.journal_name || '').trim(),
      doi: String(p.doi || '').trim()
    }));

    await Model.deleteMany({});
    if (cleaned.length > 0) {
      await Model.insertMany(cleaned);
    }

    const saved = await Model.find({}, { _id: 0 }).sort({ sl_no: 1 });

    return res.json({
      success: true,
      message: `Successfully saved ${saved.length} publications for table "${collectionName}"`,
      department: rawDeptId,
      collection: collectionName,
      database: PUB_DB_NAME,
      count: saved.length,
      data: saved
    });
  } catch (error) {
    console.error(`Error saving publications for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save publications to MongoDB',
      error: error.message
    });
  }
});

/**
 * POST /api/publications/:deptId/row
 * Add or update a single publication row
 */
app.post('/api/publications/:deptId/row', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getPublicationModel(collectionName);

    const p = req.body;
    const slNo = Number(p.sl_no);
    if (!p.faculty_name || !p.title) {
      return res.status(400).json({ success: false, message: 'Faculty Name and Paper Title are required' });
    }

    const rowData = {
      department: collectionName,
      sl_no: slNo || (await Model.countDocuments() + 1),
      faculty_name: String(p.faculty_name || '').trim(),
      title: String(p.title || '').trim(),
      authors: String(p.authors || '').trim(),
      claimed_by: String(p.claimed_by || '').trim(),
      indexing: String(p.indexing || 'Scopus').trim(),
      quartile: String(p.quartile || 'Q2').trim(),
      pub_month: String(p.pub_month || '').trim(),
      journal_name: String(p.journal_name || '').trim(),
      doi: String(p.doi || '').trim()
    };

    if (slNo) {
      await Model.findOneAndUpdate({ sl_no: slNo }, rowData, { upsert: true, new: true });
    } else {
      await Model.create(rowData);
    }

    const records = await Model.find({}, { _id: 0 }).sort({ sl_no: 1 });
    return res.json({
      success: true,
      message: 'Publication saved successfully',
      data: records
    });
  } catch (error) {
    console.error(`Error saving publication row for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save publication row',
      error: error.message
    });
  }
});

/**
 * DELETE /api/publications/:deptId/row/:slNo
 * Delete a single publication by sl_no
 */
app.delete('/api/publications/:deptId/row/:slNo', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const slNo = Number(req.params.slNo);
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getPublicationModel(collectionName);

    await Model.deleteOne({ sl_no: slNo });
    const records = await Model.find({}, { _id: 0 }).sort({ sl_no: 1 });
    return res.json({
      success: true,
      message: `Deleted publication #${slNo}`,
      data: records
    });
  } catch (error) {
    console.error(`Error deleting publication for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete publication',
      error: error.message
    });
  }
});

/**
 * POST /api/publications/:deptId/etl-pipeline
 * Upload and process Excel rows for publication data
 */
app.post('/api/publications/:deptId/etl-pipeline', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getPublicationModel(collectionName);

    const { rows, mode } = req.body; // mode: 'replace' (default) or 'append'
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows provided in Excel payload' });
    }

    const cleaned = rows.map((r, idx) => ({
      department: collectionName,
      sl_no: Number(r.sl_no || r.slNo || r['Sl.No.'] || r['Sl. No.'] || r['SL.NO.']) || (idx + 1),
      faculty_name: String(r.faculty_name || r.name || r['Name of the Faculty'] || r['Faculty Name'] || '').trim(),
      title: String(r.title || r['Paper Title'] || r['Title'] || '').trim(),
      authors: String(r.authors || r['List of Authors'] || r['Authors'] || '').trim(),
      claimed_by: String(r.claimed_by || r['Claim by Faculty (Name)'] || r['Claimed By'] || r['Claim by Faculty'] || '').trim(),
      indexing: String(r.indexing || r['Indexing (Scopus/WoS)'] || r['Indexing'] || 'Scopus').trim(),
      quartile: String(r.quartile || r['Quartile (Q1/Q2/Q3/Q4)'] || r['Quartile'] || 'Q2').trim().toUpperCase(),
      pub_month: String(r.pub_month || r['Publication Month (MonYYYY)'] || r['Publication Month'] || r['Month'] || '').trim(),
      journal_name: String(r.journal_name || r['Journal Name/Conference Name'] || r['Journal Name'] || r['Conference Name'] || '').trim(),
      doi: String(r.doi || r['DOI as link'] || r['DOI'] || '').trim()
    })).filter(r => r.faculty_name || r.title);

    if (cleaned.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid publication rows found (Faculty Name or Title missing)' });
    }

    if (mode !== 'append') {
      await Model.deleteMany({});
    }
    await Model.insertMany(cleaned);

    const allRecords = await Model.find({}, { _id: 0 }).sort({ sl_no: 1 });

    return res.json({
      success: true,
      message: `ETL Pipeline successfully processed and saved ${cleaned.length} publications to table "${collectionName}"`,
      department: rawDeptId,
      collection: collectionName,
      database: PUB_DB_NAME,
      importedCount: cleaned.length,
      totalCount: allRecords.length,
      data: allRecords
    });
  } catch (error) {
    console.error(`Error in publication ETL pipeline for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process publication ETL pipeline: ' + error.message
    });
  }
});

/**
 * DELETE /api/publications/:deptId
 * Clear all publication records for a department
 */
app.delete('/api/publications/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getPublicationModel(collectionName);

    await Model.deleteMany({});
    return res.json({
      success: true,
      message: `Cleared all publications for table "${collectionName}"`,
      department: rawDeptId,
      collection: collectionName
    });
  } catch (error) {
    console.error(`Error clearing publications for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear publications from MongoDB',
      error: error.message
    });
  }
});

/**
 * ══════════════════════════════════════════════════
 * IPR & PATENT DATA API ROUTES (Database: patent_data)
 * ══════════════════════════════════════════════════
 */

/**
 * GET /api/patents/:deptId
 * Fetch all patent records for a department from 'patent_data' database
 */
app.get('/api/patents/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

    const Model = getPatentModel(collectionName);
    const records = await Model.find({}, { _id: 0 }).sort({ sl_no: 1, createdAt: 1 });

    return res.json({
      success: true,
      department: rawDeptId,
      collection: collectionName,
      database: PATENT_DB_NAME,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error(`Error fetching patents for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patents from MongoDB',
      error: error.message
    });
  }
});

/**
 * POST /api/patents/:deptId
 * Save / replace the entire patent list for a department in 'patent_data'
 */
app.post('/api/patents/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getPatentModel(collectionName);

    const patents = Array.isArray(req.body.patents) ? req.body.patents : (Array.isArray(req.body) ? req.body : []);

    const cleaned = patents.map((p, idx) => {
      let pubMonth = String(p.pub_month || '').trim();
      const pubGrantedDate = String(p.pub_granted_date || '').trim();
      if (!pubMonth && pubGrantedDate) {
        const parts = pubGrantedDate.split(/[\/\-\.]/);
        if (parts.length === 3) {
          const mIdx = parseInt(parts[1], 10) - 1;
          const months = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
          const year = parts[2].length === 2 ? ('20' + parts[2]) : parts[2];
          if (mIdx >= 0 && mIdx < 12 && year) {
            pubMonth = `${months[mIdx]} ${year}`;
          }
        }
      }

      return {
        department: collectionName,
        sl_no: Number(p.sl_no) || (idx + 1),
        app_no: String(p.app_no || '').trim(),
        status: (String(p.status || '').toLowerCase().includes('grant')) ? 'Granted' : 'Published',
        inventor_name: String(p.inventor_name || '').trim(),
        title: String(p.title || '').trim(),
        applicant_name: String(p.applicant_name || 'Dayananda Sagar Academy of Technology and Management').trim(),
        filed_date: String(p.filed_date || '').trim(),
        pub_granted_date: pubGrantedDate,
        pub_granted_no: String(p.pub_granted_no || '').trim(),
        assignee_name: String(p.assignee_name || 'Dayananda Sagar Academy of Technology and Management, Bangalore').trim(),
        source_proof: String(p.source_proof || '').trim(),
        pub_month: pubMonth
      };
    });

    await Model.deleteMany({});
    if (cleaned.length > 0) {
      await Model.insertMany(cleaned);
    }

    const saved = await Model.find({}, { _id: 0 }).sort({ sl_no: 1 });

    return res.json({
      success: true,
      message: `Successfully saved ${saved.length} patents for table "${collectionName}"`,
      department: rawDeptId,
      collection: collectionName,
      database: PATENT_DB_NAME,
      count: saved.length,
      data: saved
    });
  } catch (error) {
    console.error(`Error saving patents for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save patents to MongoDB',
      error: error.message
    });
  }
});

/**
 * POST /api/patents/:deptId/row
 * Add or update a single patent row
 */
app.post('/api/patents/:deptId/row', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getPatentModel(collectionName);

    const p = req.body;
    const slNo = Number(p.sl_no);
    if (!p.title && !p.app_no) {
      return res.status(400).json({ success: false, message: 'Patent Title or Application Number is required' });
    }

    let pubMonth = String(p.pub_month || '').trim();
    const pubGrantedDate = String(p.pub_granted_date || '').trim();
    if (!pubMonth && pubGrantedDate) {
      const parts = pubGrantedDate.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const mIdx = parseInt(parts[1], 10) - 1;
        const months = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
        const year = parts[2].length === 2 ? ('20' + parts[2]) : parts[2];
        if (mIdx >= 0 && mIdx < 12 && year) {
          pubMonth = `${months[mIdx]} ${year}`;
        }
      }
    }

    const rowData = {
      department: collectionName,
      sl_no: slNo || (await Model.countDocuments() + 1),
      app_no: String(p.app_no || '').trim(),
      status: (String(p.status || '').toLowerCase().includes('grant')) ? 'Granted' : 'Published',
      inventor_name: String(p.inventor_name || '').trim(),
      title: String(p.title || '').trim(),
      applicant_name: String(p.applicant_name || 'Dayananda Sagar Academy of Technology and Management').trim(),
      filed_date: String(p.filed_date || '').trim(),
      pub_granted_date: pubGrantedDate,
      pub_granted_no: String(p.pub_granted_no || '').trim(),
      assignee_name: String(p.assignee_name || 'Dayananda Sagar Academy of Technology and Management, Bangalore').trim(),
      source_proof: String(p.source_proof || '').trim(),
      pub_month: pubMonth
    };

    if (slNo) {
      await Model.findOneAndUpdate({ sl_no: slNo }, rowData, { upsert: true, new: true });
    } else {
      await Model.create(rowData);
    }

    const records = await Model.find({}, { _id: 0 }).sort({ sl_no: 1 });
    return res.json({
      success: true,
      message: 'Patent record saved successfully',
      data: records
    });
  } catch (error) {
    console.error(`Error saving patent row for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save patent row',
      error: error.message
    });
  }
});

/**
 * DELETE /api/patents/:deptId/row/:slNo
 * Delete a single patent by sl_no
 */
app.delete('/api/patents/:deptId/row/:slNo', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const slNo = Number(req.params.slNo);
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getPatentModel(collectionName);

    await Model.deleteOne({ sl_no: slNo });
    const records = await Model.find({}, { _id: 0 }).sort({ sl_no: 1 });
    return res.json({
      success: true,
      message: `Deleted patent #${slNo}`,
      data: records
    });
  } catch (error) {
    console.error(`Error deleting patent for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete patent',
      error: error.message
    });
  }
});

/**
 * POST /api/patents/:deptId/etl-pipeline
 * Upload and process Excel rows for patent data
 */
app.post('/api/patents/:deptId/etl-pipeline', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getPatentModel(collectionName);

    const { rows, mode } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows provided in Excel payload' });
    }

    const cleaned = rows.map((r, idx) => {
      const sl = Number(r.sl_no || r.slNo || r['Sl. No.'] || r['Sl.No.'] || r['SL.NO.'] || r['Sl No']) || (idx + 1);
      const appNo = String(r.app_no || r['Patent Application No.'] || r['Application No'] || r['Application No.'] || r['Patent Application No'] || '').trim();
      const statusRaw = String(r.status || r['Status of Patent (Published / Granted)'] || r['Status'] || r['Patent Status'] || 'Published').trim();
      const status = statusRaw.toLowerCase().includes('grant') ? 'Granted' : 'Published';
      const inv = String(r.inventor_name || r['Inventor/s Name'] || r['Inventor Name'] || r['Inventors'] || r['Inventor'] || '').trim();
      const title = String(r.title || r['Title of the Patent'] || r['Patent Title'] || r['Title'] || '').trim();
      const applicant = String(r.applicant_name || r['Applicant/s Name'] || r['Applicant Name'] || r['Applicant'] || 'Dayananda Sagar Academy of Technology and Management').trim();
      const filedDate = String(r.filed_date || r['Patent Filed Date (DD/MM/YYYY)'] || r['Patent Filed Date'] || r['Filed Date'] || '').trim();
      const pubGrantedDate = String(r.pub_granted_date || r['Patent Published Date / Granted Date (DD/MM/YYYY)'] || r['Patent Published Date / Granted Date'] || r['Published Date'] || r['Granted Date'] || '').trim();
      const pubGrantedNo = String(r.pub_granted_no || r['Patent Publication Number / Patent Granted Number'] || r['Publication Number'] || r['Granted Number'] || r['Patent No'] || '').trim();
      const assignee = String(r.assignee_name || r['Assignee/s Name (Institute Affiliation/s at time of Appication)'] || r['Assignee/s Name'] || r['Assignee Name'] || r['Assignee'] || 'Dayananda Sagar Academy of Technology and Management, Bangalore').trim();
      const proof = String(r.source_proof || r['Here, attach Source Proof Screenshots/URL/ Website Links, etc.'] || r['Source Proof'] || r['Proof'] || r['URL'] || '').trim();

      let pubMonth = String(r.pub_month || r['Month'] || '').trim();
      if (!pubMonth && pubGrantedDate) {
        const parts = pubGrantedDate.split(/[\/\-\.]/);
        if (parts.length === 3) {
          const mIdx = parseInt(parts[1], 10) - 1;
          const months = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
          const year = parts[2].length === 2 ? ('20' + parts[2]) : parts[2];
          if (mIdx >= 0 && mIdx < 12 && year) {
            pubMonth = `${months[mIdx]} ${year}`;
          }
        }
      }

      return {
        department: collectionName,
        sl_no: sl,
        app_no: appNo,
        status: status,
        inventor_name: inv,
        title: title,
        applicant_name: applicant,
        filed_date: filedDate,
        pub_granted_date: pubGrantedDate,
        pub_granted_no: pubGrantedNo,
        assignee_name: assignee,
        source_proof: proof,
        pub_month: pubMonth
      };
    }).filter(r => r.title || r.app_no || r.inventor_name);

    if (cleaned.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid patent rows found in Excel sheet' });
    }

    if (mode !== 'append') {
      await Model.deleteMany({});
    }
    await Model.insertMany(cleaned);

    const allRecords = await Model.find({}, { _id: 0 }).sort({ sl_no: 1 });

    return res.json({
      success: true,
      message: `ETL Pipeline successfully processed and saved ${cleaned.length} patent records to table "${collectionName}"`,
      department: rawDeptId,
      collection: collectionName,
      database: PATENT_DB_NAME,
      importedCount: cleaned.length,
      totalCount: allRecords.length,
      data: allRecords
    });
  } catch (error) {
    console.error(`Error in patent ETL pipeline for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process patent ETL pipeline: ' + error.message
    });
  }
});

/**
 * DELETE /api/patents/:deptId
 * Clear all patent records for a department
 */
app.delete('/api/patents/:deptId', async (req, res) => {
  try {
    const rawDeptId = req.params.deptId;
    const normalizedKey = (rawDeptId || '').trim().toUpperCase();
    const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;
    const Model = getPatentModel(collectionName);

    await Model.deleteMany({});
    return res.json({
      success: true,
      message: `Cleared all patent records for table "${collectionName}"`,
      department: rawDeptId,
      collection: collectionName
    });
  } catch (error) {
    console.error(`Error clearing patents for ${req.params.deptId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear patent records from MongoDB',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'student_strength', uptime: process.uptime() });
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`[Backend Server] Running on http://localhost:${PORT}`);
  console.log(`[Backend Server] Student strength API: http://localhost:${PORT}/api/student-strength/:deptId`);
  console.log(`[Backend Server] ETL Pipeline API: http://localhost:${PORT}/api/student-strength/etl-pipeline`);
});

module.exports = app;
