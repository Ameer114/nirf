const mongoose = require('mongoose');

// The 12 engineering departments from the NIRF portal
const DEPARTMENTS = [
  { id: 'CSE', name: 'Computer Science & Engineering', aliases: ['CSE'] },
  { id: 'ISE', name: 'Information Science & Engineering', aliases: ['ISE'] },
  { id: 'ECE', name: 'Electronics & Communication Engg', aliases: ['ECE'] },
  { id: 'EEE', name: 'Electrical & Electronics Engg', aliases: ['EEE'] },
  { id: 'MECH', name: 'Mechanical Engineering', aliases: ['MECH'] },
  { id: 'CIVIL', name: 'Civil Engineering', aliases: ['CIVIL'] },
  { id: 'AIML', name: 'AI & Machine Learning', aliases: ['AIML'] },
  { id: 'CSD', name: 'Computer Science & Design', aliases: ['CSD'] },
  { id: 'CSAI', name: 'CSE (Artificial Intelligence)', aliases: ['CSE-AI', 'CSAI'] },
  { id: 'CSDS', name: 'CSE (Data Science)', aliases: ['CSE-DS', 'CSDS'] },
  { id: 'CSIOT', name: 'CSE (IOT, CS & BT)', aliases: ['CSE-IOT', 'CSIOT'] },
  { id: 'CSCY', name: 'CSE (Cyber Security)', aliases: ['CSE-CYBER', 'CSCY'] }
];

// Map all department aliases to standard collection ID
const DEPARTMENT_ALIAS_MAP = {
  'CSE': 'CSE',
  'ISE': 'ISE',
  'CSD': 'CSD',
  'AIML': 'AIML',
  'ECE': 'ECE',
  'EEE': 'EEE',
  'MECH': 'MECH',
  'CIVIL': 'CIVIL',
  'CSAI': 'CSAI',
  'CSE-AI': 'CSAI',
  'CSDS': 'CSDS',
  'CSE-DS': 'CSDS',
  'CSIOT': 'CSIOT',
  'CSE-IOT': 'CSIOT',
  'CSCY': 'CSCY',
  'CSE-CYBER': 'CSCY'
};

// Schema for Student Strength in each department table/collection
const studentStrengthSchema = new mongoose.Schema(
  {
    DEPARTMENT: {
      type: String,
      trim: true
    },
    YEAR: {
      type: String,
      required: [true, 'Academic year is required (e.g. 2024-25)'],
      trim: true
    },
    NT: {
      type: Number,
      required: [true, 'NT (Total Sanctioned Intake) is required'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} must be an integer'
      }
    },
    NE: {
      type: Number,
      required: [true, 'NE (Total Enrolled Students) is required'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} must be an integer'
      }
    },
    NP: {
      type: Number,
      required: [true, 'NP (Total PhD Students) is required'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} must be an integer'
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Unique compound index so there are no duplicate entries for the same year in a department
studentStrengthSchema.index({ YEAR: 1 }, { unique: true });

// Helper to get or register Mongoose model for a specific department collection
const getDepartmentModel = (deptId) => {
  const normalizedKey = (deptId || '').trim().toUpperCase();
  const collectionName = DEPARTMENT_ALIAS_MAP[normalizedKey] || normalizedKey;

  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }
  // Passing 3rd argument ensures collection name is strictly preserved (not pluralized)
  return mongoose.model(collectionName, studentStrengthSchema, collectionName);
};

// Pre-register models for all 12 departments
const departmentModels = {};
DEPARTMENTS.forEach((dept) => {
  departmentModels[dept.id] = getDepartmentModel(dept.id);
});

module.exports = {
  DEPARTMENTS,
  DEPARTMENT_ALIAS_MAP,
  studentStrengthSchema,
  getDepartmentModel,
  departmentModels
};
