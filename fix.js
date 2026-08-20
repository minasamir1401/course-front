const fs = require('fs');
const dirs = [
  'src/app/super-admin/exams/edit/[id]', 
  'src/app/school-admin/exams/edit/[id]', 
  'src/app/super-admin/quizzes/edit/[id]', 
  'src/app/school-admin/quizzes/edit/[id]'
];

dirs.forEach(d => {
  const filePath = 'd:/mina/front/' + d + '/hooks/useExamState.ts';
  if (!fs.existsSync(filePath)) return;
  
  let code = fs.readFileSync(filePath, 'utf8');
  
  if (!code.includes('fetchExamData')) {
    const fetchExamDataCode = `
  const fetchExamData = async (token: string, eId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(\`\${API_URL}/exams/\${eId}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.ok) {
        const data = await res.json();
        const exam = data.data || data;
        if (exam) {
          setExamData({
            title: exam.title || "",
            description: exam.description || "",
            coverImage: exam.coverImage || "",
            grades: exam.grades || [],
            subjects: exam.subjects || [],
            country: exam.country || "مصر",
            isCentral: exam.isCentral !== undefined ? exam.isCentral : true,
            schoolIds: exam.schoolIds || [],
            duration: exam.duration || 60,
            password: exam.password || "",
            resultVisibility: exam.resultVisibility || "SHOW_SCORE",
            attemptsAllowed: exam.attemptsAllowed || 1,
            startDate: exam.startDate ? exam.startDate.split('T')[0] : "",
            endDate: exam.endDate ? exam.endDate.split('T')[0] : "",
            passingScore: exam.passingScore || 50,
            courseName: exam.courseName || "",
            section: exam.section || "",
            domain: exam.domain || "",
            learningOutcomes: exam.learningOutcomes || "",
            indicators: exam.indicators || "",
            skills: exam.skills || "",
            gradeTarget: exam.gradeTarget || ""
          });
          if (exam.modules) setModules(exam.modules);
          if (exam.standaloneQuestions) setStandaloneQuestions(exam.standaloneQuestions);
          if (exam._id) setCreatedId(exam._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch exam:", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };
`;

    const fetchSchoolsEffectIndex = code.indexOf('useEffect(() => {\n    const token = localStorage.getItem');
    if (fetchSchoolsEffectIndex !== -1) {
      code = code.slice(0, fetchSchoolsEffectIndex) + fetchExamDataCode + code.slice(fetchSchoolsEffectIndex);
      
      code = code.replace(
        'fetchSchools(token);\n  }, []);',
        'fetchSchools(token);\n    if (examId && isInitialLoad) {\n      fetchExamData(token, examId);\n    }\n  }, [examId, isInitialLoad]);'
      );
      
      fs.writeFileSync(filePath, code);
      console.log('Patched', filePath);
    } else {
      console.log('Could not find injection point in', filePath);
    }
  }
});
