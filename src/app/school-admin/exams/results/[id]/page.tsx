"use client";
import { useParams } from 'next/navigation';
import ReportWorkspace from '@/components/reports/ReportWorkspace';
export default function ExamReportPage() { const { id } = useParams<{ id: string }>(); return <ReportWorkspace role="SCHOOL_ADMIN" examId={id} initialTab="attempts" />; }
