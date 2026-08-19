const fs = require('fs');
const content = fs.readFileSync('src/components/DashboardLayout.tsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(75, 105).join('\n'));
