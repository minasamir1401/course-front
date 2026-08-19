import React from 'react';
import {
  Languages, Calculator, FlaskConical, Globe, Monitor,
  Book, Atom, Beaker, Dna, Map, Milestone, Zap,
  Landmark, Activity, Cpu, Moon, Sparkles, BookOpen
} from 'lucide-react';

export interface SubjectStyle {
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
  shadow: string;
}

export const getSubjectStyle = (subject?: string): SubjectStyle => {
  const s = subject?.toLowerCase() || '';

  // Arabic / Languages
  if (s.includes('عربي') || s.includes('arabic')) {
    return { icon: Languages, bg: 'bg-gradient-to-br from-emerald-400 to-teal-600', text: 'text-white', border: 'border-transparent', shadow: 'shadow-emerald-500/30' };
  }
  if (s.includes('إنجليز') || s.includes('english')) {
    return { icon: Languages, bg: 'bg-gradient-to-br from-sky-400 to-blue-600', text: 'text-white', border: 'border-transparent', shadow: 'shadow-sky-500/30' };
  }
  if (s.includes('فرانس') || s.includes('french') || s.includes('ألمان') || s.includes('إيطال')) {
    return { icon: Globe, bg: 'bg-gradient-to-br from-indigo-400 to-violet-600', text: 'text-white', border: 'border-transparent', shadow: 'shadow-indigo-500/30' };
  }

  // Mathematics
  if (s.includes('رياضيات') || s.includes('math') || s.includes('إحصاء') || s.includes('ميكانيكا')) {
    return { icon: Calculator, bg: 'bg-gradient-to-br from-blue-500 to-indigo-700', text: 'text-white', border: 'border-transparent', shadow: 'shadow-blue-500/30' };
  }

  // Sciences
  if (s.includes('فيزياء') || s.includes('physics')) {
    return { icon: Zap, bg: 'bg-gradient-to-br from-amber-400 to-orange-500', text: 'text-white', border: 'border-transparent', shadow: 'shadow-amber-500/30' };
  }
  if (s.includes('كيمياء') || s.includes('chemistry')) {
    return { icon: Beaker, bg: 'bg-gradient-to-br from-fuchsia-400 to-pink-600', text: 'text-white', border: 'border-transparent', shadow: 'shadow-fuchsia-500/30' };
  }
  if (s.includes('أحياء') || s.includes('biology')) {
    return { icon: Dna, bg: 'bg-gradient-to-br from-lime-400 to-green-600', text: 'text-white', border: 'border-transparent', shadow: 'shadow-lime-500/30' };
  }
  if (s.includes('جيولوجيا') || s.includes('geology') || s.includes('علوم') || s.includes('science')) {
    return { icon: FlaskConical, bg: 'bg-gradient-to-br from-teal-400 to-emerald-600', text: 'text-white', border: 'border-transparent', shadow: 'shadow-teal-500/30' };
  }

  // Humanities
  if (s.includes('تاريخ') || s.includes('history')) {
    return { icon: Landmark, bg: 'bg-gradient-to-br from-orange-400 to-red-500', text: 'text-white', border: 'border-transparent', shadow: 'shadow-orange-500/30' };
  }
  if (s.includes('جغرافيا') || s.includes('geography')) {
    return { icon: Map, bg: 'bg-gradient-to-br from-cyan-400 to-blue-500', text: 'text-white', border: 'border-transparent', shadow: 'shadow-cyan-500/30' };
  }
  if (s.includes('فلسفة') || s.includes('philosophy') || s.includes('نفس') || s.includes('اجتماع')) {
    return { icon: Activity, bg: 'bg-gradient-to-br from-rose-400 to-pink-600', text: 'text-white', border: 'border-transparent', shadow: 'shadow-rose-500/30' };
  }

  // Tech
  if (s.includes('حاسب') || s.includes('computer') || s.includes('تكنولوجيا')) {
    return { icon: Monitor, bg: 'bg-gradient-to-br from-slate-600 to-slate-800', text: 'text-white', border: 'border-transparent', shadow: 'shadow-slate-500/30' };
  }

  // Religion / Ethics
  if (s.includes('دين') || s.includes('إسلامية') || s.includes('وطنية')) {
    return { icon: Moon, bg: 'bg-gradient-to-br from-yellow-400 to-amber-500', text: 'text-white', border: 'border-transparent', shadow: 'shadow-yellow-500/30' };
  }

  // Special / General
  if (s.includes('اكتشف') || s.includes('متعدد')) {
    return { icon: Sparkles, bg: 'bg-gradient-to-br from-violet-400 to-purple-600', text: 'text-white', border: 'border-transparent', shadow: 'shadow-violet-500/30' };
  }

  // Default fallback
  return { icon: BookOpen, bg: 'bg-gradient-to-br from-indigo-500 to-purple-600', text: 'text-white', border: 'border-transparent', shadow: 'shadow-indigo-500/30' };
};
