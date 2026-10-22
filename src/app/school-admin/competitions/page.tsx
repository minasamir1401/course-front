import { Suspense } from 'react';
import CompetitionAdmin from '@/components/competitions/CompetitionAdmin';
export const metadata = { title: 'المسابقات والجوائز · Competitions' };
export default function Page() { return <Suspense><CompetitionAdmin/></Suspense>; }
