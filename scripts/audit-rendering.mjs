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
const pages = new Set(files.filter(file => file.startsWith(path.join(root, 'app') + path.sep) && path.basename(file) === 'page.tsx'));
let clientPages = 0;
let pagesImportingNextImage = 0;
let nativeImages = 0;
let nextImages = 0;
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const isPage = pages.has(file);
  if (isPage) {
    for (const statement of source.statements) {
      if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break;
      if (statement.expression.text === 'use client') {
        clientPages++;
        break;
      }
    }
  }
  const imageImports = new Set();
  let importsNextImage = false;
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== 'next/image' || !statement.importClause || statement.importClause.isTypeOnly) continue;
    importsNextImage = true;
    if (statement.importClause.name) imageImports.add(statement.importClause.name.text);
  }
  if (isPage && importsNextImage) pagesImportingNextImage++;
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
const percentage = (count) => pages.size ? (count / pages.size * 100).toFixed(1) : '0.0';
console.log(`Pages: ${pages.size}; client pages: ${clientPages} (${percentage(clientPages)}%); server pages: ${pages.size - clientPages}`);
console.log(`Pages importing next/image: ${pagesImportingNextImage} of ${pages.size} (${percentage(pagesImportingNextImage)}%)`);
console.log(`JSX images across app/components: ${nextImages} next/image; ${nativeImages} native img`);
console.log('HTML content images are handled by HtmlRenderer/getImageProps; pages without images do not need next/image.');
