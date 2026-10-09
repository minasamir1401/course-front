export default function AdminAuthLoading({ section }: { section: 'school' | 'super' }) {
  const school = section === 'school';
  return (
    <div className={`min-h-screen flex items-center justify-center ${school ? 'bg-emerald-950' : 'bg-[#0a0a14]'}`}>
      <div className="flex flex-col items-center gap-4">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${school ? 'border-emerald-500' : 'border-purple-500'}`} />
        <p className={`font-medium ${school ? 'text-emerald-300' : 'text-purple-300'}`}>جاري التحقق...</p>
      </div>
    </div>
  );
}
