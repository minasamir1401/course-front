import CourseDetailsView from './CourseDetailsView';

export default async function CourseDetailsPage({ params, searchParams }: PageProps<'/courses/[id]'>) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <CourseDetailsView id={id} staffRequested={query.staff === '1'} />;
}
