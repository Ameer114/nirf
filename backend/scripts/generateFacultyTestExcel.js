const XLSX = require('xlsx');
const path = require('path');

const headers = [
  'Sl. No.',
  'Name of the Faculty',
  'Age',
  'Designation',
  'Gender',
  'Qualification',
  'Experience (in Months)',
  'Currently working with institution?',
  'Joining Date',
  'Leaving Date',
  'Association Type (Regular(R) / Contractual(C) / Visitor(V) / Other(O))'
];

const sampleData = [
  [1, 'Dr. Ramesh Kumar', 46, 'Professor', 'Male', 'Ph.D', 180, 'Yes', '2016-07-15', '--', 'Regular'],
  [2, 'Mrs. Ananya Sen', 35, 'Assistant Professor', 'Female', 'M.Tech', 72, 'Yes', '2020-08-01', '--', 'Regular'],
  [3, 'Dr. K. Kalidasu', 42, 'Associate Professor', 'Male', 'Ph.D', 130, 'Yes', '2019-09-07', '--', 'Regular'],
  [4, 'Mr. Rahul Maity', 31, 'Assistant Professor', 'Male', 'M.Tech', 40, 'Yes', '2022-08-07', '--', 'Regular'],
  [5, 'Dr. Vanishree Moji', 39, 'Associate Professor', 'Female', 'Ph.D', 96, 'Yes', '2018-03-08', '--', 'Regular']
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
ws['!cols'] = [{ wch: 8 }, { wch: 24 }, { wch: 8 }, { wch: 22 }, { wch: 10 }, { wch: 16 }, { wch: 22 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 35 }];

XLSX.utils.book_append_sheet(wb, ws, 'Faculty Data');

const outputPath = path.join(__dirname, '..', 'Faculty_Test_Upload.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('Test Excel generated successfully at:', outputPath);
