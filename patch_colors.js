const fs = require('fs');

const files = [
    'src/components/InteractiveQuestionRenderer.tsx',
    'src/components/InteractiveQuestionEditor.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace all instances of indigo-650 with indigo-500
    // Replace all instances of indigo-750 with indigo-700
    content = content.replace(/indigo-650/g, 'indigo-500');
    content = content.replace(/indigo-750/g, 'indigo-700');
    
    // The user also said they want the text to be black because they can't read it
    // Wait, if we just use bg-indigo-500 text-white, it's very readable.
    // But since they explicitly asked for it to be black, let's use:
    // bg-indigo-100 border-indigo-400 text-slate-900 
    // This will look like a highlighted selection but with dark text.
    content = content.replace(/bg-indigo-500 border-indigo-500 text-white/g, 'bg-indigo-100 border-indigo-400 text-slate-900');
    
    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
});
