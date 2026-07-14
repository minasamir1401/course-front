const fs = require('fs');
const path = 'd:/pj/porj/corse/lms-platform/frontend/src/components/InteractiveQuestionRenderer.tsx';
let content = fs.readFileSync(path, 'utf8');

const headerRegex = /<div className=\"flex justify-between items-center mb-4 gap-4\">[\s\S]*?<span>\+10 XP<\/span>\s*<\/div>\s*<\/div>/g;

content = content.replace(headerRegex, '<QuestionHeader question={question} language={language} opts={opts} />');

// Special case for matching where the header uses h4 differently
const matchingHeaderRegex = /<h4 className=\"text-lg font-black text-slate-800 leading-snug\">\{translateText\(question\.title, language\)\}<\/h4>[\s\S]*?<span>\+10 XP<\/span>\s*<\/div>\s*<\/div>/g;
content = content.replace(matchingHeaderRegex, '<QuestionHeader question={question} language={language} opts={opts} />');

// Special case for true/false where opts may not be defined
content = content.replace(/function TrueFalseRenderer\({ question, value, onChange, language }: any\) {/g, 'function TrueFalseRenderer({ question, value, onChange, language }: any) {\n  const opts = parseJson(question.options, {});');

const headerComponent = `
function QuestionHeader({ question, language, opts }: any) {
  return (
    <div className="flex flex-col mb-4 gap-3">
      <div className="flex justify-between items-start gap-4">
        {opts?.questionText ? (
          <HtmlRenderer html={translateText(question.title, language)} tag="h4" className="text-sm font-black text-slate-400 uppercase tracking-widest leading-snug" />
        ) : (
          <HtmlRenderer html={translateText(question.title, language)} tag="h4" className="text-lg font-black text-slate-800 leading-snug" />
        )}
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-2xl font-black text-xs shrink-0 select-none shadow-sm animate-pulse">
          <Award className="w-4 h-4 text-amber-500" />
          <span>+10 XP</span>
        </div>
      </div>
      {opts?.questionText && (
        <div className="prose prose-sm max-w-none text-slate-800 font-bold text-base bg-white/50 border border-slate-100 rounded-xl p-4 shadow-sm">
          <HtmlRenderer html={translateText(opts.questionText, language)} />
        </div>
      )}
    </div>
  );
}
`;

if (!content.includes('function QuestionHeader')) {
  // insert before function McqRenderer
  content = content.replace('// -------------------------------------------------------------\n// 📝 1. MCQ', headerComponent + '\n\n// -------------------------------------------------------------\n// 📝 1. MCQ');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Updated Renderers');
