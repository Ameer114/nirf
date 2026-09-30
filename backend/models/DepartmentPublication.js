const mongoose = require('mongoose');
const { DEPARTMENTS, DEPARTMENT_ALIAS_MAP } = require('./DepartmentStrength');

const PUB_DB_NAME = process.env.PUB_DB_NAME || 'publication_data';

// Schema for individual research publication (Publication-2026)
const publicationSchema = new mongoose.Schema(
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
    faculty_name: {
      type: String,
      required: [true, 'Name of the Faculty is required'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Paper Title is required'],
      trim: true
    },
    authors: {
      type: String,
      default: '',
      trim: true
    },
    claimed_by: {
      type: String,
      default: '',
      trim: true
    },
    indexing: {
      type: String,
      default: 'Scopus',
      trim: true
    },
    quartile: {
      type: String,
      default: 'Q2',
      trim: true
    },
    pub_month: {
      type: String,
      default: '',
      trim: true
    },
    journal_name: {
      type: String,
      default: '',
      trim: true
    },
    doi: {
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

// Helper to get or register Mongoose model for a specific department collection in 'publication_data' database
const getPublicationModel = (deptId) => {
  const normalizedKey = (deptId || '').trim().toUpperCase();
  const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

  // Use the dedicated 'publication_data' database
  const pubDb = mongoose.connection.useDb(PUB_DB_NAME, { useCache: true });

  if (pubDb.models[collectionName]) {
    return pubDb.models[collectionName];
  }
  return pubDb.model(collectionName, publicationSchema, collectionName);
};

module.exports = {
  PUB_DB_NAME,
  publicationSchema,
  getPublicationModel,
  DEPARTMENTS,
  DEPARTMENT_ALIAS_MAP
};
