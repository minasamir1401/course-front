const fs = require('fs');
const content = fs.readFileSync('src/app/super-admin/exams/edit/[id]/page.tsx', 'utf8');

const layoutMatch = content.match(/<DashboardLayout[^>]*>/);
console.log('Layout start:', layoutMatch ? layoutMatch.index : -1);

const flexCol = content.indexOf('<div className="flex flex-col gap-8">');
console.log('Flex col:', flexCol);

const colSpan8 = content.indexOf('lg:col-span-8');
console.log('colSpan8:', colSpan8);

const qArea = content.indexOf('{/* Questions Content Area */}');
console.log('Questions Area:', qArea);

const sArea = content.indexOf('setShowSettingsModal(true)');
console.log('Settings Modal Trigger:', sArea);
