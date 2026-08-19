const fs = require('fs');

let c = fs.readFileSync('src/app/exams/page.tsx', 'utf8');

const startBlock = c.indexOf('{/* EXPANDED MODULE CONTENT */}');
const endBlock = c.indexOf('</div>', c.indexOf(')}', startBlock));
c = c.slice(0, startBlock) + c.slice(endBlock + 7);

c = c.replace(/onClick=\{.*?\}\s+className=\{`bg-white rounded-3xl p-6 border-2 transition-all duration-300 cursor-pointer shadow-sm group relative overflow-hidden.*?`\}/s, (match) => {
  return `className="bg-white rounded-3xl p-6 border-2 transition-all duration-300 cursor-pointer shadow-sm group relative overflow-hidden border-slate-100 hover:border-indigo-300 hover:shadow-lg"`;
});

// Replace the <div wrapper with <Link
c = c.replace(/<div\s+key=\{module\.id\}\s+className="bg-white rounded-3xl p-6 border-2/s, '<Link href={`/exams/${module.id}/details`} key={module.id} className="block bg-white rounded-3xl p-6 border-2');

// Find where the </div> is for the card, and replace it with </Link>
// The original code was:
//   </div>
// </div>
// ))}
c = c.replace(/<\/div>\s*<\/div>\s*\)\)}/g, '</Link>))}');
c = c.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\)\)}/g, '</Link>\n                ))}');

// Add import Link
if (!c.includes('import Link from "next/link"')) {
  c = c.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport Link from "next/link";');
}

fs.writeFileSync('src/app/exams/page.tsx', c);
console.log('Updated page.tsx');
