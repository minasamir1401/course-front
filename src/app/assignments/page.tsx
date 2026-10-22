import { redirect } from 'next/navigation';

// Old bookmarks lead to the real assessments workspace.
export default function AssignmentsPage() {
  redirect('/exams');
}
