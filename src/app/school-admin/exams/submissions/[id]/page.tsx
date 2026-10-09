import ExamSubmissionView from './ExamSubmissionView';
import { ExamReportLogo, ExamReportTitle, ExamReportLoading, ExamSubmissionDescription } from '@/components/exams/ExamReportStaticContent';

export default function ExamSubmissionPage() {
  return (
    <ExamSubmissionView
      logo={<ExamReportLogo />}
      heading={<ExamReportTitle title="تقرير إجابة الطالب" />}
      loadingContent={<ExamReportLoading message="جاري جلب تفاصيل إجابة الطالب..." />}
      description={<ExamSubmissionDescription />}
    />
  );
}
