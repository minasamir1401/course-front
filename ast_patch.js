const fs = require('fs');
const ts = require('typescript');
const path = require('path');

const dict = JSON.parse(fs.readFileSync('translate_dictionary.json', 'utf-8'));

function isInsideConditional(node) {
    let current = node.parent;
    while (current) {
        if (ts.isConditionalExpression(current)) {
            return true;
        }
        current = current.parent;
    }
    return false;
}

function createTransformer() {
    return (context) => (rootNode) => {
        function visit(node) {
            // Check for JSX Text nodes like <div>مصر</div>
            if (ts.isJsxText(node)) {
                const text = node.text.trim();
                if (dict[text] && text !== dict[text] && !isInsideConditional(node)) {
                    return ts.factory.createJsxExpression(
                        undefined,
                        ts.factory.createConditionalExpression(
                            ts.factory.createBinaryExpression(
                                ts.factory.createIdentifier("language"),
                                ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                ts.factory.createStringLiteral("ar")
                            ),
                            ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                            ts.factory.createStringLiteral(text),
                            ts.factory.createToken(ts.SyntaxKind.ColonToken),
                            ts.factory.createStringLiteral(dict[text])
                        )
                    );
                }
            }

            // Check for String Literals
            if (ts.isStringLiteral(node)) {
                const text = node.text.trim();
                if (dict[text] && text !== dict[text] && !isInsideConditional(node)) {
                    const parent = node.parent;
                    if (
                        !ts.isImportDeclaration(parent) &&
                        !ts.isJsxAttribute(parent)
                    ) {
                        return ts.factory.createConditionalExpression(
                            ts.factory.createBinaryExpression(
                                ts.factory.createIdentifier("language"),
                                ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                ts.factory.createStringLiteral("ar")
                            ),
                            ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                            ts.factory.createStringLiteral(text),
                            ts.factory.createToken(ts.SyntaxKind.ColonToken),
                            ts.factory.createStringLiteral(dict[text])
                        );
                    }
                }
            }

            // Check for JSX Attribute string literals: placeholder="مصر"
            if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
                const text = node.initializer.text.trim();
                if (dict[text] && text !== dict[text] && !isInsideConditional(node)) {
                    return ts.factory.updateJsxAttribute(
                        node,
                        node.name,
                        ts.factory.createJsxExpression(
                            undefined,
                            ts.factory.createConditionalExpression(
                                ts.factory.createBinaryExpression(
                                    ts.factory.createIdentifier("language"),
                                    ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                    ts.factory.createStringLiteral("ar")
                                ),
                                ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                                ts.factory.createStringLiteral(text),
                                ts.factory.createToken(ts.SyntaxKind.ColonToken),
                                ts.factory.createStringLiteral(dict[text])
                            )
                        )
                    );
                }
            }

            return ts.visitEachChild(node, visit, context);
        }
        return ts.visitNode(rootNode, visit);
    };
}

const files = [
    'src/app/super-admin/courses/create/page.tsx',
    'src/app/school-admin/exams/new/page.tsx',
    'src/app/school-admin/courses/edit/page.tsx'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf-8');
    const sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
    );

    // Provide parent pointers for our isInsideConditional check
    function bindParents(node, parent) {
        node.parent = parent;
        ts.forEachChild(node, child => bindParents(child, node));
    }
    bindParents(sourceFile, undefined);

    const result = ts.transform(sourceFile, [createTransformer()]);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const newContent = printer.printNode(ts.EmitHint.Unspecified, result.transformed[0], sourceFile);

    fs.writeFileSync(file, newContent);
    console.log('AST Patched', file);
});
