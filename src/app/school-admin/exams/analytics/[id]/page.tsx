import ReportWorkspace from '@/components/reports/ReportWorkspace';

export default async function ExamReportPage({ params }: PageProps<'/school-admin/exams/analytics/[id]'>) {
  const { id } = await params;
  return <ReportWorkspace role="SCHOOL_ADMIN" examId={id} initialTab="overview" />;
}
