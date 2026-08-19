const fs = require('fs');

function fix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Normalize line endings to \n temporarily
  content = content.replace(/\r\n/g, '\n');
  
  // Fix the random ) \n } inside the JSX
  content = content.replace(/  \)\n\}\n              <\/div >/g, '              </div >');
  
  // Fix the end of file:
  // )}
  //       </div >
  //     </DashboardLayout >
  content = content.replace(/\)\}\n      <\/div >\n    <\/DashboardLayout >/g, ')}\n    </DashboardLayout >');
  
  // Write back with \n
  fs.writeFileSync(filePath, content);
  console.log("Fixed", filePath);
}

fix('src/app/school-admin/courses/create/page.tsx');
fix('src/app/super-admin/courses/create/page.tsx');
