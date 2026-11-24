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
const files = filesIn(root).filter(file => /\.[cm]?tsx?$/.test(file) && !file.endsWith('.d.ts'));
const pages = new Set(files.filter(file => file.startsWith(path.join(root, 'app') + path.sep) && path.basename(file) === 'page.tsx'));
const dependencies = new Map();
const imageModules = new Set();
let clientPages = 0;
let pagesImportingNextImage = 0;
let nativeImages = 0;
let nextImages = 0;
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
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
  const imports = [];
  let importsNextImage = false;
  for (const statement of source.statements) {
    if ((ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly)
      || (ts.isExportDeclaration(statement) && !statement.isTypeOnly)) {
      if (statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
        imports.push(statement.moduleSpecifier.text);
      }
    }
    if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== 'next/image' || !statement.importClause || statement.importClause.isTypeOnly) continue;
    importsNextImage = true;
    if (statement.importClause.name) imageImports.add(statement.importClause.name.text);
  }
  dependencies.set(file, imports);
  if (importsNextImage) imageModules.add(file);
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
function reachesImageModule(entry) {
  const stack = [entry];
  const seen = new Set();
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    if (imageModules.has(file)) return true;
    for (const name of dependencies.get(file) ?? []) {
      const base = name.startsWith('@/') ? path.join(root, name.slice(2))
        : name.startsWith('.') ? path.resolve(path.dirname(file), name) : null;
      if (!base) continue;
      const resolved = [base, base + '.tsx', base + '.ts', path.join(base, 'index.tsx'), path.join(base, 'index.ts')]
        .find(candidate => dependencies.has(candidate));
      if (resolved) stack.push(resolved);
    }
  }
  return false;
}
const pagesReachingNextImage = [...pages].filter(reachesImageModule).length;
const percentage = (count) => pages.size ? (count / pages.size * 100).toFixed(1) : '0.0';
console.log(`Pages: ${pages.size}; direct client boundaries: ${clientPages} (${percentage(clientPages)}%); server entry points: ${pages.size - clientPages}`);
console.log(`Pages importing next/image directly: ${pagesImportingNextImage}; through their static module graph: ${pagesReachingNextImage} of ${pages.size} (${percentage(pagesReachingNextImage)}%)`);
console.log(`JSX images across app/components: ${nextImages} next/image; ${nativeImages} native img`);
console.log('Static reachability includes shared components. HTML content can use HtmlRenderer/getImageProps.');
