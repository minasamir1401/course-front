const fs = require('fs');
const path = require('path');

const originalPath = 'src/app/exams/page.tsx';
const newDir = 'src/app/exams/[id]/details';
if (!fs.existsSync(newDir)) {
  fs.mkdirSync(newDir, { recursive: true });
}

let content = fs.readFileSync(originalPath, 'utf8');

// 1. Add useParams
content = content.replace(
  'import { useState, useEffect } from "react";',
  'import { useState, useEffect } from "react";\nimport { useParams } from "next/navigation";'
);

// 2. We don't need activeModule anymore, activeModule is just the loaded module.
content = content.replace('const [activeModule, setActiveModule] = useState<any>(null);', 'const { id } = useParams();');
content = content.replace('const [modules, setModules] = useState<any[]>([]);', 'const [activeModule, setActiveModule] = useState<any>(null);');

// 3. Update fetchData to fetch just ONE exam
content = content.replace(
  /fetch\(`\$\{API_URL\}\/exams`, \{ headers: \{ Authorization: `Bearer \$\{token\}` \} \}\)/,
  'fetch(`${API_URL}/exams/${id}`, { headers: { Authorization: `Bearer ${token}` } })'
);

// 4. Update the response handling
content = content.replace(
  /const modulesData = await modulesRes\.json\(\);\s*setModules\(Array\.isArray\(modulesData\) \? modulesData : \[\]\);/,
  'const modulesData = await modulesRes.json();\n        setActiveModule(modulesData);'
);

// 5. Remove the modules list (the grid of cards)
// We need to delete from `<div className="lg:col-span-8 flex flex-col gap-8 transition-all duration-300">`
// up to `{/* EXPANDED MODULE CONTENT */}`
const startGrid = content.indexOf('<div className="lg:col-span-8 flex flex-col gap-8 transition-all duration-300">');
const endGrid = content.indexOf('{/* EXPANDED MODULE CONTENT */}');
const beforeGrid = content.substring(0, startGrid);
const afterGrid = content.substring(endGrid);

content = beforeGrid + '<div className="lg:col-span-8 flex flex-col gap-8 transition-all duration-300">\n' + afterGrid;

// Write it
fs.writeFileSync(path.join(newDir, 'page.tsx'), content);
console.log('Created details page');
