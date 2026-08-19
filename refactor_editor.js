const fs = require('fs');

const files = [
  'src/app/school-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/new/page.tsx',
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/super-admin/exams/new/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
      console.log('Skipping ' + file + ' - does not exist');
      return;
  }
  let content = fs.readFileSync(file, 'utf8');

  if (content.includes('const renderQuestionForm = () =>')) {
    console.log(file + ' already refactored.');
    return;
  }

  const startMarker = '{showQuestionForm && (';
  let startIndex = content.indexOf(startMarker);
  
  if (startIndex === -1) {
    console.log(file + ' not found startMarker');
    return;
  }

  // Find the closing brace for the {showQuestionForm && ( ... )} block
  let openCount = 0;
  let endIndex = -1;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') openCount++;
    if (content[i] === '}') {
      openCount--;
      if (openCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    console.log(file + ' could not find closing brace');
    return;
  }

  const formBlock = content.substring(startIndex, endIndex + 1);
  
  // The block is: {showQuestionForm && ( <JSX> )}
  const innerJSX = formBlock.substring(startMarker.length, formBlock.length - 2).trim();

  // Create the render function definition
  const renderFn = `
  const renderQuestionForm = () => (
    ${innerJSX}
  );
  `;

  // Insert before the return
  const returnMarker = 'return (\n    <DashboardLayout';
  let returnIndex = content.indexOf(returnMarker);
  if (returnIndex === -1) {
      returnIndex = content.indexOf('return (\r\n    <DashboardLayout');
  }

  if (returnIndex === -1) {
    console.log(file + ' could not find return marker');
    return;
  }

  content = content.slice(0, returnIndex) + renderFn + '\n  ' + content.slice(returnIndex);

  // Replace original with null check
  content = content.replace(formBlock, '{showQuestionForm && editingIndex === null && renderQuestionForm()}');

  // Find the map block ending to insert the inline form
  // We look for:
  //                        <Edit3 className="w-5 h-5" />
  //                      </button>
  //                      <button 
  //                        onClick={() => deleteQuestion(index)}
  //                      ...
  //                    </div>
  //                  </div>
  //                </div>
  //              ))}
  // We need to insert the editor inside the mapped div.
  // The mapped div ends with:
  //                 </div>
  //               ))}
  const mapEnd = '                </div>\n              ))}';
  let mapEndIndex = content.indexOf(mapEnd);
  if (mapEndIndex === -1) {
      mapEndIndex = content.indexOf('                </div>\r\n              ))}');
  }
  
  if (mapEndIndex !== -1) {
      const replacement = `
                  {showQuestionForm && editingIndex === index && (
                    <div className="border-t border-slate-100 p-6 bg-slate-50/50">
                      {renderQuestionForm()}
                    </div>
                  )}
                </div>
              ))}`;
      content = content.replace(mapEnd, replacement);
      fs.writeFileSync(file, content);
      console.log(file + ' successfully refactored inline editor!');
  } else {
      console.log(file + ' could not find mapEnd');
  }
});
