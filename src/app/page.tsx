import type { Metadata } from 'next';
import LandingContent from '@/components/student/LandingContent';
export const metadata: Metadata = { title: 'Klevro | مساحة التعلم والتقييم', description: 'مقرراتك ودروسك واختباراتك وتقارير تقدمك في مكان واحد.' };
export default function LandingPage(){return <LandingContent/>;}
