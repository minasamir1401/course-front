import { Suspense } from 'react';
import CourseEditor from '@/components/course-editor/CourseEditor';
export default function Page() { return <Suspense><CourseEditor role="SCHOOL_ADMIN" lessonPage/></Suspense>; }
