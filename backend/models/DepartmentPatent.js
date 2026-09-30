const mongoose = require('mongoose');
const { DEPARTMENTS, DEPARTMENT_ALIAS_MAP } = require('./DepartmentStrength');

const PATENT_DB_NAME = process.env.PATENT_DB_NAME || 'patent_data';

// Schema for individual IPR & Patent record
const patentSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department identifier is required'],
      trim: true
    },
    sl_no: {
      type: Number,
      default: 1
    },
    app_no: {
      type: String,
      required: [true, 'Patent Application No. is required'],
      trim: true
    },
    status: {
      type: String,
      required: [true, 'Status of Patent (Published / Granted) is required'],
      enum: ['Published', 'Granted'],
      default: 'Published',
      trim: true
    },
    inventor_name: {
      type: String,
      required: [true, 'Inventor/s Name is required'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Title of the Patent is required'],
      trim: true
    },
    applicant_name: {
      type: String,
      default: 'Dayananda Sagar Academy of Technology and Management',
      trim: true
    },
    filed_date: {
      type: String,
      default: '',
      trim: true
    },
    pub_granted_date: {
      type: String,
      default: '',
      trim: true
    },
    pub_granted_no: {
      type: String,
      default: '',
      trim: true
    },
    assignee_name: {
      type: String,
      default: 'Dayananda Sagar Academy of Technology and Management, Bangalore',
      trim: true
    },
    source_proof: {
      type: String,
      default: '',
      trim: true
    },
    pub_month: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Helper to get or register Mongoose model for a specific department collection in 'patent_data' database
const getPatentModel = (deptId) => {
  const normalizedKey = (deptId || '').trim().toUpperCase();
  const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

  // Use the dedicated 'patent_data' database
  const patentDb = mongoose.connection.useDb(PATENT_DB_NAME, { useCache: true });

  if (patentDb.models[collectionName]) {
    return patentDb.models[collectionName];
  }
  return patentDb.model(collectionName, patentSchema, collectionName);
};

module.exports = {
  PATENT_DB_NAME,
  patentSchema,
  getPatentModel,
  DEPARTMENTS,
  DEPARTMENT_ALIAS_MAP
};
