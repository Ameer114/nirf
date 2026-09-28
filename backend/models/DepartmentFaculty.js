const mongoose = require('mongoose');
const { DEPARTMENTS, DEPARTMENT_ALIAS_MAP } = require('./DepartmentStrength');

const FACULTY_DB_NAME = process.env.FACULTY_DB_NAME || 'faculty_data';

// Schema for Faculty Data matching the specified attributes
const facultySchema = new mongoose.Schema(
  {
    sl_no: {
      type: Number
    },
    name: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true
    },
    age: {
      type: Number
    },
    designation: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      trim: true
    },
    qualification: {
      type: String,
      trim: true
    },
    experience: {
      type: Number,
      default: 0
    },
    currently_working: {
      type: String,
      trim: true
    },
    joining_date: {
      type: String,
      trim: true
    },
    leaving_date: {
      type: String,
      trim: true,
      default: null
    },
    association_type: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'left'],
      default: 'active'
    },
    department: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound index on department collection for efficient querying
facultySchema.index({ name: 1, joining_date: 1 });

// Helper to get or register Mongoose model in the 'faculty_data' database
const getFacultyModel = (deptId) => {
  const normalizedKey = (deptId || '').trim().toUpperCase();
  const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

  // Use the dedicated 'faculty_data' database
  const facultyDb = mongoose.connection.useDb(FACULTY_DB_NAME, { useCache: true });

  if (facultyDb.models[collectionName]) {
    return facultyDb.models[collectionName];
  }
  return facultyDb.model(collectionName, facultySchema, collectionName);
};

module.exports = {
  FACULTY_DB_NAME,
  facultySchema,
  getFacultyModel,
  DEPARTMENTS,
  DEPARTMENT_ALIAS_MAP
};
