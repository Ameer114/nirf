const mongoose = require('mongoose');
const { DEPARTMENTS, DEPARTMENT_ALIAS_MAP } = require('./DepartmentStrength');

const GO_DB_NAME = process.env.GO_DB_NAME || 'go_data';

// Schema for UG cohort row (4-Year program)
const ugCohortSchema = new mongoose.Schema(
  {
    intakeYr: {
      type: String,
      default: '',
      trim: true
    },
    lateralYr: {
      type: String,
      default: '',
      trim: true
    },
    year: {
      type: String,
      required: [true, 'Graduating year is required (e.g. 2022-23)'],
      trim: true
    },
    intake: {
      type: Number,
      default: 0
    },
    admitted: {
      type: Number,
      default: 0
    },
    lateral: {
      type: Number,
      default: 0
    },
    graduated: {
      type: Number,
      default: 0
    },
    placed: {
      type: Number,
      default: 0
    },
    medSalary: {
      type: Number,
      default: 0
    },
    higher: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

// Schema for PG cohort row (2-Year program)
const pgCohortSchema = new mongoose.Schema(
  {
    year: {
      type: String,
      required: [true, 'Academic year is required (e.g. 2021-22)'],
      trim: true
    },
    intake: {
      type: Number,
      default: 0
    },
    admitted: {
      type: Number,
      default: 0
    },
    graduated: {
      type: Number,
      default: 0
    },
    placed: {
      type: Number,
      default: 0
    },
    medSalary: {
      type: Number,
      default: 0
    },
    higher: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

// Main GO Data schema for department table in 'GO Data' database
const departmentGOSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department identifier is required'],
      trim: true
    },
    ug: [ugCohortSchema],
    pg: [pgCohortSchema],
    phd_full: {
      type: Number,
      default: 0
    },
    phd_part: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

departmentGOSchema.index({ department: 1 }, { unique: true });

// Helper to get or register Mongoose model for a specific department collection in 'GO Data' database
const getGOModel = (deptId) => {
  const normalizedKey = (deptId || '').trim().toUpperCase();
  const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

  // Use the dedicated 'GO Data' database
  const goDb = mongoose.connection.useDb(GO_DB_NAME, { useCache: true });

  if (goDb.models[collectionName]) {
    return goDb.models[collectionName];
  }
  return goDb.model(collectionName, departmentGOSchema, collectionName);
};

module.exports = {
  GO_DB_NAME,
  departmentGOSchema,
  getGOModel,
  DEPARTMENTS,
  DEPARTMENT_ALIAS_MAP
};
