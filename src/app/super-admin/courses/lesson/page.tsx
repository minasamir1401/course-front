import { Suspense } from 'react';
import CourseEditor from '@/components/course-editor/CourseEditor';
export default function Page() { return <Suspense><CourseEditor role="SUPER_ADMIN" lessonPage/></Suspense>; }
