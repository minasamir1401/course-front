const fs = require('fs');

// Copy super-admin to school-admin and replace role string
let content = fs.readFileSync('src/app/super-admin/courses/create/page.tsx', 'utf8');
// There might be some specific strings like 'super_admin_token' vs 'school_admin_token'
content = content.replace(/super-admin/g, 'school-admin');
content = content.replace(/super_admin/g, 'school_admin');

fs.writeFileSync('src/app/school-admin/courses/create/page.tsx', content);
console.log('Restored school-admin from super-admin');
