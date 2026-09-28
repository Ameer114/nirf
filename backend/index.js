const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { getDepartmentModel, DEPARTMENT_ALIAS_MAP, DEPARTMENTS } = require('./models/DepartmentStrength');
const { getFacultyModel, FACULTY_DB_NAME } = require('./models/DepartmentFaculty');

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
