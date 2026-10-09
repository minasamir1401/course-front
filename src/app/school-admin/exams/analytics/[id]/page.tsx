import ExamAnalyticsView from './ExamAnalyticsView';
import { ExamReportLogo, ExamReportTitle, ExamReportLoading, ExamAnalyticsBadge } from '@/components/exams/ExamReportStaticContent';

export default function ExamAnalyticsPage() {
  return (
    <ExamAnalyticsView
      logo={<ExamReportLogo />}
      heading={<ExamReportTitle title="التقارير التحليلية للامتحان" />}
      loadingContent={<ExamReportLoading message="جاري تجميع التقارير التحليلية للامتحان..." />}
      badge={<ExamAnalyticsBadge />}
    />
  );
}
