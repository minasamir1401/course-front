const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/app/super-admin/exams/edit/[id]/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// The file was mangled around `parsedSlides = typeof l.slides === 'string' ? JSON.parse(l.slides) : (l.slides || []);`
// Let's replace the whole chunk from `parsedSlides = ...` down to `return { ...q, explanations: parsedExps };`
const regex = /parsedSlides = typeof l\.slides === 'string' \? JSON\.parse\(l\.slides\) : \(l\.slides \|\| \[\]\);[\s\S]*?return \{ \.\.\.q, explanations: parsedExps \};/m;

const correctChunk = `parsedSlides = typeof l.slides === 'string' ? JSON.parse(l.slides) : (l.slides || []);
              } catch (e) { parsedSlides = [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", sections: [] }]; }

              return {
                ...l,
                isVisible: l.isVisible !== undefined ? l.isVisible : true,
                publishDate: l.publishDate ? new Date(new Date(l.publishDate).getTime() - new Date(l.publishDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
                cutOffDate: l.cutOffDate ? new Date(new Date(l.cutOffDate).getTime() - new Date(l.cutOffDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
                questions: Array.isArray(parsedQuestions) ? parsedQuestions.map(q => {
                  let parsedExps = [""];
                  try {
                    parsedExps = typeof q.explanation === 'string' && q.explanation.startsWith('[') ? JSON.parse(q.explanation) : (q.explanations || [""]);
                    if (!Array.isArray(parsedExps)) parsedExps = [q.explanation || ""];
                  } catch (e) {
                    parsedExps = [q.explanation || ""];
                  }
                  return { ...q, explanations: parsedExps };`;

if (regex.test(content)) {
  content = content.replace(regex, correctChunk);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log("Repaired page.tsx via regex");
} else {
  console.log("Regex did not match");
}
