import ReportWorkspace from '@/components/reports/ReportWorkspace';

export default async function ExamReportPage({ params }: PageProps<'/super-admin/exams/analytics/[id]'>) {
  const { id } = await params;
  return <ReportWorkspace role="SUPER_ADMIN" examId={id} initialTab="overview" />;
}
