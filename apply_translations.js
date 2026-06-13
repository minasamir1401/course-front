const fs = require('fs');

const dict = JSON.parse(fs.readFileSync('translate_dictionary.json', 'utf-8'));
const files = [
  'src/app/super-admin/courses/create/page.tsx',
  'src/app/school-admin/exams/new/page.tsx',
  'src/app/school-admin/courses/edit/page.tsx'
];

// Sort dictionary by length descending to replace longer strings first and avoid partial replacements
const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');

  sortedKeys.forEach(arStr => {
    let enStr = dict[arStr];
    if (!enStr || enStr === arStr) return;
    
    // Fix quotes inside the english string to avoid breaking syntax
    enStr = enStr.replace(/"/g, '\\"').replace(/'/g, "\\'");

    // 1. Replace inside JSX text nodes (e.g. >مصر<)
    // We look for > optional spaces arabic string optional spaces <
    const jsxRegex = new RegExp(`>\\s*${arStr}\\s*<`, 'g');
    content = content.replace(jsxRegex, `>{language === 'ar' ? "${arStr}" : "${enStr}"}<`);

    // 2. Replace inside JSX attributes (e.g. placeholder="مصر" or label="مصر")
    const attrRegex = new RegExp(`="\\s*${arStr}\\s*"`, 'g');
    content = content.replace(attrRegex, `={language === 'ar' ? "${arStr}" : "${enStr}"}`);

    // 3. Replace inside string literals in JS code (e.g. "مصر" or 'مصر')
    // We match "مصر" or 'مصر' where it's not already inside a language ternary
    // This is trickier, but we can just do a basic replace for quotes
    const strRegexDq = new RegExp(`"\\s*${arStr}\\s*"`, 'g');
    content = content.replace(strRegexDq, `(language === 'ar' ? "${arStr}" : "${enStr}")`);

    const strRegexSq = new RegExp(`'\\s*${arStr}\\s*'`, 'g');
    content = content.replace(strRegexSq, `(language === 'ar' ? "${arStr}" : "${enStr}")`);
  });

  // Cleanup potential nested or malformed stuff like ((language === 'ar' ? ...))
  content = content.replace(/\(\(language === 'ar'/g, "(language === 'ar'");
  content = content.replace(/"\)"\)/g, '")');
  content = content.replace(/'\)'\)/g, "')");

  // In JSX text, we might have created >{language === 'ar' ? "(language === 'ar' ? "مصر" : "Egypt")" : "Egypt"}<
  // This happens if rule 3 runs on rule 1's output. Wait! Rule 1 creates "{...}". Rule 3 will match the inner "مصر".
  // Let's avoid that by doing this in a safer way, but for now we will just write it to a temp file and see if it breaks.

  fs.writeFileSync(file, content);
  console.log('Patched', file);
});
