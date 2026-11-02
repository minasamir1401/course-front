const fs = require('fs');
let content = fs.readFileSync('d:/mina/front/src/app/super-admin/exams/edit/[id]/hooks/useExamAutosave.ts', 'utf8');

// Replace the payload generation section
content = content.replace(/\s*country: examData\.country,[\s\S]*?questions: allQuestions\s*};\s*/m, `
          }
        }
        
        const targetSchoolIds = (examData.schoolIds || []).filter(Boolean);
        const isCentral = targetSchoolIds.length === 0;

        const allQuestions = [];
        const modulesPayload = finalModules.map((m, index) => {
           const mId = m.id || String(Date.now() + index);
           
           const mQuestions = (m.questions || []).map((q) => ({
               ...q,
               moduleId: mId,
               subExamId: null
           }));
           allQuestions.push(...mQuestions);

           const subExams = (m.subExams || []).map((s, sIdx) => {
               const sId = s.id || String(Date.now() + index * 100 + sIdx);
               const sQuestions = (s.questions || []).map((q) => ({
                   ...q,
                   moduleId: mId,
                   subExamId: sId
               }));
               allQuestions.push(...sQuestions);
               return {
                  id: sId,
                  title: s.title,
                  duration: s.duration || null,
                  passingScore: s.passingScore || null,
                  attemptsAllowed: s.attemptsAllowed || 1,
                  order: s.order !== undefined ? s.order : sIdx
               };
           });

           return {
              id: mId,
              title: m.title,
              description: m.content || null,
              duration: m.duration || null,
              passingScore: m.passingScore || null,
              order: m.order !== undefined ? m.order : index,
              subExams: subExams
           };
        });
        
        allQuestions.push(...(standaloneQuestions || []).map(q => ({ ...q, moduleId: null, subExamId: null })));
        
        const payload = {
          title: examData.title || (language === 'ar' ? 'مسودة امتحان بدون عنوان' : 'Untitled Exam Draft'),
          description: examData.description,
          coverImage: examData.coverImage || null,
          grades: examData.grades,
          subjects: examData.subjects || [],
          country: examData.country,
          isCentral,
          schoolId: targetSchoolIds.length > 0 ? targetSchoolIds[0] : null,
          schoolIds: targetSchoolIds,
          duration: examData.duration || 60,
          passingScore: examData.passingScore || 50,
          password: examData.password || null,
          resultVisibility: examData.resultVisibility || 'SHOW_SCORE',
          attemptsAllowed: examData.attemptsAllowed || 1,
          startDate: examData.startDate || null,
          endDate: examData.endDate || null,
          status: 'DRAFT',
          modules: modulesPayload,
          questions: allQuestions
        };
`);

// Fix the corrupted syntax below
content = content.replace(/assignments: prev\.assignments\.map\(\(a: any, aIdx: number\) => \{[\s\S]*?return pl;\s*}\)\);/m, `assignments: prev.assignments.map((a: any, aIdx: number) => {
                    const serverA = parsedModules[idx].assignments?.[aIdx];
                    return serverA ? { ...a, id: serverA.id } : a;
                  })
                }));
              }
              // Set all modules with backend IDs
              setModules(parsedModules.map((pl: any, plIdx: number) => {
                if (plIdx === idx) {
                  return {
                    ...pl,
                    title: currentModule.title,
                    domain: currentModule.domain,
                    content: currentModule.content,
                    videoUrl: currentModule.videoUrl,
                    summary: currentModule.summary,
                    notes: currentModule.notes,
                    standards: currentModule.standards,
                    indicators: currentModule.indicators,
                    learningOutcomes: currentModule.learningOutcomes,
                    isVisible: currentModule.isVisible,
                    publishDate: currentModule.publishDate,
                    cutOffDate: currentModule.cutOffDate,
                    slides: currentModule.slides.map((s: any, sIdx: number) => {
                      const serverSlide = pl.slides?.[sIdx];
                      return serverSlide ? { ...s, id: serverSlide.id } : s;
                    }),
                    questions: currentModule.questions.map((q: any, qIdx: number) => {
                      const serverQ = pl.questions?.[qIdx];
                      return serverQ ? { ...q, id: serverQ.id } : q;
                    }),
                    assignments: currentModule.assignments.map((a: any, aIdx: number) => {
                      const serverA = pl.assignments?.[aIdx];
                      return serverA ? { ...a, id: serverA.id } : a;
                    })
                  };
                }
                return pl;
              }));`);

fs.writeFileSync('d:/mina/front/src/app/super-admin/exams/edit/[id]/hooks/useExamAutosave.ts', content, 'utf8');
console.log('Fixed useExamAutosave.ts');
