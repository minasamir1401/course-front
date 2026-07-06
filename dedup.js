const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('lucide-react')) {
    const importRegex = /import\s+({[^}]+})\s+from\s+['"]lucide-react['"]/g;
    content = content.replace(importRegex, (match, inner) => {
      const parts = inner.replace(/[\{\}]/g, '').split(',').map(s => s.trim()).filter(s => s);
      const uniqueParts = [...new Set(parts)];
      return `import { ${uniqueParts.join(', ')} } from 'lucide-react'`;
    });
    fs.writeFileSync(file, content, 'utf8');
  }
});
console.log('Done');
