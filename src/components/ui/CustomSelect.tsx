"use client";
import { useId } from 'react';
interface CustomSelectProps { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder?: string; className?: string }
/** Native selection preserves keyboard navigation, mobile pickers and screen-reader semantics. */
export function CustomSelect({ value, onChange, options, placeholder = 'اختر / Select', className = '' }: CustomSelectProps) {
  const id = useId();
  return <div className={`relative ${className}`}><label className="sr-only" htmlFor={id}>{placeholder}</label><select id={id} value={value} onChange={event => onChange(event.target.value)} className="w-full min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
    {!options.some(option => option.value === value) && <option value="" disabled>{placeholder}</option>}{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select></div>;
}
