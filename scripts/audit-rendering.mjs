import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '../src');
function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}
const files = filesIn(root).filter(file => file.endsWith('.tsx'));
const pages = files.filter(file => file.endsWith(`${path.sep}page.tsx`));
const clientPages = pages.filter(file => /^\s*(?:\/\/[^\n]*\n\s*)*["']use client["'];/m.test(fs.readFileSync(file, 'utf8')));
let nativeImages = 0;
let nextImages = 0;
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imageImports = new Set();
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && statement.moduleSpecifier.text === 'next/image' && statement.importClause?.name) imageImports.add(statement.importClause.name.text);
  }
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tag = node.tagName.getText(source);
      if (tag === 'img') nativeImages++;
      if (imageImports.has(tag)) nextImages++;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
console.log(`Pages: ${pages.length}; client pages: ${clientPages.length} (${(clientPages.length / pages.length * 100).toFixed(1)}%); server pages: ${pages.length - clientPages.length}`);
console.log(`JSX images across app/components: ${nextImages} next/image; ${nativeImages} native img`);
console.log('HTML content images are handled by HtmlRenderer/getImageProps; pages without images do not need next/image.');
