const fs = require('fs');

let c = fs.readFileSync('../backend/src/routes/exams.ts', 'utf8');

// 1. Rewrite verify-access
const verifyAccessRegex = /router\.post\('\/api\/exams\/:id\/verify-access'[\s\S]*?\n\}\);\n/m;
const newVerifyAccess = `// Check if student can take the exam (attempts, password, dates)
router.post('/api/exams/:id/verify-access', verifyToken, async (req: any, res: any) => {
  try {
    const { id: examId } = req.params;
    const { password, subExamId } = req.body;
    const userId = req.user.id;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        schools: { select: { id: true } }
      }
    });

    if (!exam) return res.status(404).json({ error: 'الامتحان غير موجود' });
    if (req.user.role === 'STUDENT' && !examMatchesStudent(exam, req.user)) {
      return res.status(403).json({ error: 'هذا الامتحان غير مخصص لك.', type: 'ACCESS_DENIED' });
    }

    // 1. Check Dates (skip for admins and teachers testing)
    const isAdminOrTeacher = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(req.user.role);
    const now = new Date();
    if (!isAdminOrTeacher && exam.startDate && now < new Date(exam.startDate)) {
      return res.status(403).json({ error: 'الامتحان لم يبدأ بعد.', type: 'EARLY_ACCESS' });
    }
    if (!isAdminOrTeacher && exam.endDate && now > new Date(exam.endDate)) {
      return res.status(403).json({ error: 'انتهى موعد الامتحان.', type: 'EXPIRED' });
    }

    // 2. Check Attempts (999 means unlimited)
    let attemptsAllowed = exam.attemptsAllowed;
    if (subExamId) {
      const subExam = await prisma.subExam.findUnique({ where: { id: subExamId } });
      if (subExam && subExam.attemptsAllowed) {
        attemptsAllowed = subExam.attemptsAllowed;
      }
    }

    const submissionsCount = await prisma.examSubmission.count({
      where: { examId, userId, subExamId: subExamId || null }
    });

    if (attemptsAllowed !== 999 && submissionsCount >= attemptsAllowed) {
      return res.status(403).json({ error: 'لقد استنفدت عدد المحاولات المسموح بها.', type: 'ATTEMPTS_EXCEEDED' });
    }

    // 3. Check Password
    if (exam.password && exam.password !== password) {
      return res.status(403).json({ error: 'كلمة السر غير صحيحة.', type: 'INVALID_PASSWORD' });
    }

    res.json({ success: true, message: 'تم التحقق من الوصول بنجاح.' });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في التحقق من الوصول.' });
  }
});
`;

// 2. Rewrite check
const checkRegex = /\/\/ Check if student already took the exam[\s\S]*?router\.get\('\/api\/exams\/:id\/check'[\s\S]*?\n\}\);\n/m;
const newCheck = `// Check if student already took the exam
router.get('/api/exams/:id/check', verifyToken, async (req: any, res: any) => {
  try {
    const { id: examId } = req.params;
    const { subExamId } = req.query;
    const userId = req.user.id;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { attemptsAllowed: true }
    });

    let attemptsAllowed = exam?.attemptsAllowed || 1;
    if (subExamId) {
      const subExam = await prisma.subExam.findUnique({ where: { id: subExamId as string } });
      if (subExam && subExam.attemptsAllowed) attemptsAllowed = subExam.attemptsAllowed;
    }

    const submissionCount = await prisma.examSubmission.count({
      where: { examId, userId, subExamId: (subExamId as string) || null }
    });

    const lastSubmission = await prisma.examSubmission.findFirst({
      where: { examId, userId, subExamId: (subExamId as string) || null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
    });

    res.json({
      taken: submissionCount > 0,
      submissionId: lastSubmission?.id,
      attemptsUsed: submissionCount,
      attemptsAllowed: attemptsAllowed,
      canTakeAgain: submissionCount < attemptsAllowed
    });
  } catch (error) {
    res.status(500).json({ error: 'Error checking exam status' });
  }
});
`;

// 3. Rewrite submit
const submitRegex = /\/\/ 4\. Submit Exam[\s\S]*?router\.post\('\/api\/exams\/:id\/submit'[\s\S]*?\n\}\);\n/m;
const newSubmit = `// 4. Submit Exam
router.post('/api/exams/:id/submit', verifyToken, checkRole(['STUDENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: Request, res: Response) => {
  const { id: examId } = req.params;
  const userId = req.user.id;
  const lockKey = \`submit_exam_\${userId}_\${examId}\`;

  if (!acquireLock(lockKey)) {
    return res.status(429).json({ error: 'جاري تسليم الامتحان... الرجاء الانتظار.' });
  }

  try {
    const { answers, totalTime, password, subExamId } = req.body;
    if (!Array.isArray(answers)) {
      releaseLock(lockKey);
      return res.status(400).json({ error: 'answers array is required.' });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true, attemptsAllowed: true, isCentral: true, schoolId: true,
        startDate: true, endDate: true, resultVisibility: true, password: true,
        grade: true, grades: true,
        schools: { select: { id: true } },
        questions: {
          where: { deletedAt: null },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
          select: { id: true, points: true, correctAnswer: true, type: true, order: true, xpPoints: true, options: true, subExamId: true }
        }
      }
    });

    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (req.user.role === 'STUDENT' && !examMatchesStudent(exam, req.user)) {
      return res.status(403).json({ error: 'هذا الامتحان غير مخصص لك.' });
    }

    const isAdminOrTeacher = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(req.user.role);

    let attemptsAllowed = exam.attemptsAllowed;
    if (subExamId) {
      const subExam = await prisma.subExam.findUnique({ where: { id: subExamId } });
      if (subExam && subExam.attemptsAllowed) attemptsAllowed = subExam.attemptsAllowed;
    }

    const submissionCount = await prisma.examSubmission.count({
      where: { examId, userId, subExamId: subExamId || null }
    });

    if (!isAdminOrTeacher && attemptsAllowed !== 999 && submissionCount >= attemptsAllowed) {
      return res.status(400).json({ error: 'لقد استنفدت عدد المحاولات المسموح بها.' });
    }

    const now = new Date();
    if (!isAdminOrTeacher && exam.startDate && now < new Date(exam.startDate)) {
      return res.status(403).json({ error: 'الامتحان لم يبدأ بعد.' });
    }
    if (!isAdminOrTeacher && exam.endDate && now > new Date(exam.endDate)) {
      return res.status(403).json({ error: 'انتهى موعد الامتحان.' });
    }
    if (exam.password && exam.password !== password) {
      return res.status(403).json({ error: 'كلمة السر غير صحيحة.' });
    }

    let targetQuestions = exam.questions;
    if (subExamId) {
      targetQuestions = exam.questions.filter(q => q.subExamId === subExamId);
    }
    
    if (targetQuestions.length === 0) {
      return res.status(400).json({ error: 'لا يمكن تسليم اختبار بدون أسئلة.' });
    }

    let totalScore = 0;
    let maxPossibleScore = 0;
    const studentAnswersData: any[] = [];

    targetQuestions.forEach(q => {
      maxPossibleScore += q.points;
      const studentAnswer = answers.find((a: any) => a.questionId === q.id);
      const selectedAnswer = studentAnswer?.selectedAnswer;
      const isCorrect = isAnswerCorrect(q, selectedAnswer);

      if (isCorrect) totalScore += q.points;

      studentAnswersData.push({
        userId,
        questionId: q.id,
        selectedAnswer: Array.isArray(selectedAnswer) ? JSON.stringify(selectedAnswer) : (selectedAnswer || ''),
        isCorrect
      });
    });

    if (maxPossibleScore <= 0) {
      return res.status(400).json({ error: 'لا يمكن تصحيح اختبار بدون درجات.' });
    }
    const percentage = (totalScore / maxPossibleScore) * 100;

    const isFirstExamAttempt = submissionCount === 0;
    let regularXP = 0;
    const sortedQuestions = [...targetQuestions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    let hasStreak5 = false;
    let hasStreak10 = false;
    let tempStreak = 0;
    let maxStreak = 0;

    sortedQuestions.forEach(q => {
      const sa = studentAnswersData.find((a: any) => a.questionId === q.id);
      const isCorrect = sa?.isCorrect || false;
      if (isCorrect) {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
        if (tempStreak === 5) hasStreak5 = true;
        if (tempStreak === 10) hasStreak10 = true;
        if (isFirstExamAttempt && q.xpPoints) regularXP += q.xpPoints;
      } else {
        tempStreak = 0;
      }
    });

    let totalEarnedXP = regularXP;
    if (isFirstExamAttempt) {
      if (percentage === 100) totalEarnedXP += 50;
      if (hasStreak5) totalEarnedXP += 20;
      if (hasStreak10) totalEarnedXP += 50;
    }

    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.examSubmission.create({
        data: {
          userId,
          examId,
          subExamId: subExamId || null,
          totalScore,
          totalTime,
          percentage,
          answers: { create: studentAnswersData }
        }
      });

      if (totalEarnedXP > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { xp: { increment: totalEarnedXP } }
        });
        await tx.xPHistory.create({
          data: {
            userId,
            amount: totalEarnedXP,
            source: 'EXAM_SCORE',
            description: \`Score: \${totalScore}/\${maxPossibleScore}\`,
            metadata: JSON.stringify({
              percentage,
              perfectScore: percentage === 100,
              streak5: hasStreak5,
              streak10: hasStreak10,
              subExamId: subExamId || null
            })
          }
        });
      }
      return submission;
    }, { maxWait: 15000, timeout: 30000 });

    res.status(201).json({
      message: 'Exam submitted successfully',
      submissionId: result.id,
      score: totalScore,
      percentage,
      maxPossibleScore,
      xpEarned: totalEarnedXP
    });

  } catch (error: any) {
    console.error('❌ Exam submission error:', error);
    res.status(500).json({ error: 'Error submitting exam', details: error.message });
  } finally {
    releaseLock(lockKey);
  }
});
`;

c = c.replace(verifyAccessRegex, newVerifyAccess);
c = c.replace(checkRegex, newCheck);
c = c.replace(submitRegex, newSubmit);

fs.writeFileSync('../backend/src/routes/exams.ts', c);
console.log('Routes rewritten successfully');
