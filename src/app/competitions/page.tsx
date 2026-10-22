import { Suspense } from 'react';
import CompetitionHub from '@/components/competitions/CompetitionHub';
export const metadata = { title: 'المنافسات والترتيب · Competitions' };
export default function Page() { return <Suspense><CompetitionHub/></Suspense>; }
