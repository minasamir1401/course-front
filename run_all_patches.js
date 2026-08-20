const fs = require('fs');

function patchFile(file, scriptFile) {
   if (!fs.existsSync(file)) return;
   let code = fs.readFileSync(scriptFile, 'utf8');
   code = code.replace(/convertSelectToCustomSelect\('.*?'\);/, "convertSelectToCustomSelect('" + file + "');");
   fs.writeFileSync('temp_patch.js', code);
   require('./temp_patch.js');
   delete require.cache[require.resolve('./temp_patch.js')];
}

patchFile('d:/mina/front/src/app/super-admin/exams/new/components/QuestionsBuilder.tsx', './patch_questions_builder_select.js');
patchFile('d:/mina/front/src/app/super-admin/exams/new/components/ModuleModal.tsx', './patch_module_modal_select.js');
patchFile('d:/mina/front/src/app/super-admin/exams/new/components/SettingsPanel.tsx', './patch_settings_panel_select.js');

patchFile('d:/mina/front/src/app/school-admin/exams/new/components/QuestionsBuilder.tsx', './patch_questions_builder_select.js');
patchFile('d:/mina/front/src/app/school-admin/exams/new/components/ModuleModal.tsx', './patch_module_modal_select.js');
patchFile('d:/mina/front/src/app/school-admin/exams/new/components/SettingsPanel.tsx', './patch_settings_panel_select.js');

patchFile('d:/mina/front/src/app/school-admin/exams/edit/[id]/components/QuestionsBuilder.tsx', './patch_questions_builder_select.js');
patchFile('d:/mina/front/src/app/school-admin/exams/edit/[id]/components/ModuleModal.tsx', './patch_module_modal_select.js');
patchFile('d:/mina/front/src/app/school-admin/exams/edit/[id]/components/SettingsPanel.tsx', './patch_settings_panel_select.js');
