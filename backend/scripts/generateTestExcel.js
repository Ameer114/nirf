const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const testDir = path.join(__dirname, '..', 'test_data');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 1. Valid Excel file
const validData = [
  ['DEPARTMENT', 'YEAR', 'NT', 'NE', 'NP'],
  ['CSE', '2024-25', 380, 410, 18],
  ['CSE', '2023-24', 360, 400, 0],
  ['CSE', '2022-23', 360, 380, 0],
  ['CSE', '2021-22', 280, 300, 0],
  ['ISE', '2024-25', 370, 395, 12]
];
const wb1 = XLSX.utils.book_new();
const ws1 = XLSX.utils.aoa_to_sheet(validData);
XLSX.utils.book_append_sheet(wb1, ws1, 'StudentStrength');
XLSX.writeFile(wb1, path.join(testDir, 'valid_student_strength.xlsx'));
console.log('Created valid_student_strength.xlsx');

// 2. Invalid Columns Excel file
const invalidColsData = [
  ['Employee_Name', 'Salary', 'Designation'],
  ['John Doe', 50000, 'Developer']
];
const wb2 = XLSX.utils.book_new();
const ws2 = XLSX.utils.aoa_to_sheet(invalidColsData);
XLSX.utils.book_append_sheet(wb2, ws2, 'Sheet1');
XLSX.writeFile(wb2, path.join(testDir, 'invalid_columns.xlsx'));
console.log('Created invalid_columns.xlsx');

// 3. Invalid Values Excel file (non-numeric NT)
const invalidValuesData = [
  ['DEPARTMENT', 'YEAR', 'NT', 'NE', 'NP'],
  ['CSE', '2024-25', 'NOT_A_NUMBER', 400, 0]
];
const wb3 = XLSX.utils.book_new();
const ws3 = XLSX.utils.aoa_to_sheet(invalidValuesData);
XLSX.utils.book_append_sheet(wb3, ws3, 'Sheet1');
XLSX.writeFile(wb3, path.join(testDir, 'invalid_values.xlsx'));
console.log('Created invalid_values.xlsx');
