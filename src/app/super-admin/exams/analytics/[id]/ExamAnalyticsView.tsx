"use client";
import { useParams } from 'next/navigation';
import ReportWorkspace from '@/components/reports/ReportWorkspace';
export default function ExamAnalyticsView(_props: Record<string, unknown>) { const {id} = useParams<{id: string}>(); return <ReportWorkspace role="SUPER_ADMIN" examId={id} />; }
