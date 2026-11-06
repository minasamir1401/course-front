import TeachingWorkspace from '@/components/teaching/TeachingWorkspace';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <TeachingWorkspace mode="student" entityId={id}/>; }
