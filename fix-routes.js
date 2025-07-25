// This script fixes the double API prefix issue in all controllers
const fs = require('fs');
const path = require('path');

function fixController(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace @Controller('api/...') with @Controller('...')
    content = content.replace(/@Controller\('api\//g, "@Controller('");
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

const controllers = [
  'src/students/student-verification.controller.ts',
  'src/lecturers/lecturer-verification.controller.ts', 
  'src/faculties/faculties.controller.ts',
  'src/internships/internships.controller.ts',
  'src/companies/companies.controller.ts',
  'src/departments/departments.controller.ts',
  'src/daily-tasks/daily-tasks.controller.ts',
  'src/daily_reports/daily_reports.controller.ts',
  'src/check-ins/check-ins.controller.ts',
  'src/company-supervisors/supervisor-verification.controller.ts',
  'src/company-supervisors/company-supervisors.controller.ts'
];

console.log('Fixing controller routes...');
controllers.forEach(fixController);
console.log('Done!');
