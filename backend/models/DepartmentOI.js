const mongoose = require('mongoose');
const { DEPARTMENTS, DEPARTMENT_ALIAS_MAP } = require('./DepartmentStrength');

const OI_DB_NAME = process.env.OI_DB_NAME || 'oi_data';

// Schema for UG (4-Year Program) diversity & support data
const ug4Schema = new mongoose.Schema(
  {
    program: {
      type: String,
      default: 'UG (4-Year Program)',
      trim: true
    },
    ts: {
      type: Number,
      default: 0
    },
    male: {
      type: Number,
      default: 0
    },
    female: {
      type: Number,
      default: 0
    },
    os: {
      type: Number,
      default: 0
    },
    oc: {
      type: Number,
      default: 0
    },
    ews: {
      type: Number,
      default: 0
    },
    sc_st_obc: {
      type: Number,
      default: 0
    },
    govt_sch: {
      type: Number,
      default: 0
    },
    inst_sch: {
      type: Number,
      default: 0
    },
    priv_sch: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

// Main OI Data schema for department table in 'oi_data' database
const departmentOISchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department identifier is required'],
      trim: true
    },
    ug4: ug4Schema,
    pcs_score: {
      type: Number,
      default: 20
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

departmentOISchema.index({ department: 1 }, { unique: true });

// Helper to get or register Mongoose model for a specific department collection in 'oi_data' database
const getOIModel = (deptId) => {
  const normalizedKey = (deptId || '').trim().toUpperCase();
  const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

  // Use the dedicated 'oi_data' database
  const oiDb = mongoose.connection.useDb(OI_DB_NAME, { useCache: true });

  if (oiDb.models[collectionName]) {
    return oiDb.models[collectionName];
  }
  return oiDb.model(collectionName, departmentOISchema, collectionName);
};

module.exports = {
  OI_DB_NAME,
  departmentOISchema,
  getOIModel,
  DEPARTMENTS,
  DEPARTMENT_ALIAS_MAP
};
