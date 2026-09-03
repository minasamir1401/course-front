type ExamEditRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN';

type BuildExamEditRoleFallbackHrefArgs = {
  requestedRole: ExamEditRole;
  examId: string;
  search?: string;
  hasSuperAdminToken: boolean;
  hasSchoolAdminSession: boolean;
};

export const buildExamEditRoleFallbackHref = ({
  requestedRole,
  examId,
  search = '',
  hasSuperAdminToken,
  hasSchoolAdminSession,
}: BuildExamEditRoleFallbackHrefArgs) => {
  if (
    requestedRole === 'SUPER_ADMIN'
    && !hasSuperAdminToken
    && hasSchoolAdminSession
  ) {
    return `/school-admin/exams/edit/${encodeURIComponent(examId)}${search || ''}`;
  }

  return null;
};

export const buildSuperAdminRouteRoleFallbackHref = ({
  pathname,
  search = '',
  hasSuperAdminToken,
  hasSchoolAdminSession,
}: {
  pathname: string;
  search?: string;
  hasSuperAdminToken: boolean;
  hasSchoolAdminSession: boolean;
}) => {
  if (hasSuperAdminToken || !hasSchoolAdminSession) {
    return null;
  }

  const editPrefix = '/super-admin/exams/edit/';
  if (!pathname.startsWith(editPrefix)) {
    return null;
  }

  const examId = pathname.slice(editPrefix.length).split('/')[0];
  if (!examId) {
    return null;
  }

  return buildExamEditRoleFallbackHref({
    requestedRole: 'SUPER_ADMIN',
    examId,
    search,
    hasSuperAdminToken,
    hasSchoolAdminSession,
  });
};
