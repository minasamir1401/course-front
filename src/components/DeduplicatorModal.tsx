import React, { useState } from 'react';
import { API_URL } from '@/lib/api';

interface DeduplicateGroup {
  title: string;
  original: any;
  duplicates: any[];
}

interface ScanResults {
  courses: DeduplicateGroup[];
  exams: DeduplicateGroup[];
  lessons: DeduplicateGroup[];
  questions: DeduplicateGroup[];
}

interface DeduplicatorModalProps {
  onClose: () => void;
  token: string;
}

export default function DeduplicatorModal({ onClose, token }: DeduplicatorModalProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [selectedIds, setSelectedIds] = useState<{
    courses: string[];
    exams: string[];
    lessons: string[];
    questions: string[];
  }>({
    courses: [],
    exams: [],
    lessons: [],
    questions: [],
  });
  const [successMsg, setSuccessMsg] = useState('');

  const scanDuplicates = async () => {
    setLoading(true);
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/deduplicate/scan`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: ScanResults = await res.json();
        setResults(data);
        
        // Auto-select all duplicates for deletion
        setSelectedIds({
          courses: data.courses.flatMap(g => g.duplicates.map(d => d.id)),
          exams: data.exams.flatMap(g => g.duplicates.map(d => d.id)),
          lessons: data.lessons.flatMap(g => g.duplicates.map(d => d.id)),
          questions: data.questions.flatMap(g => g.duplicates.map(d => d.id)),
        });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const confirmClean = async () => {
    if (Object.values(selectedIds).every(arr => arr.length === 0)) return;
    
    if (!window.confirm("Are you sure you want to permanently delete these duplicated items? This cannot be undone.")) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/deduplicate/clean`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(selectedIds)
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Cleaned successfully! Deleted ${data.deleted.courses} courses, ${data.deleted.exams} exams, ${data.deleted.lessons} lessons, and ${data.deleted.questions} questions.`);
        setResults(null);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleToggle = (type: keyof typeof selectedIds, id: string) => {
    setSelectedIds(prev => {
      const list = prev[type];
      return {
        ...prev,
        [type]: list.includes(id) ? list.filter(x => x !== id) : [...list, id]
      };
    });
  };

  const renderGroup = (title: string, type: keyof typeof selectedIds, groups: DeduplicateGroup[]) => {
    if (!groups || groups.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2 border-b pb-1">{title} ({groups.length} duplicates found)</h3>
        <ul className="space-y-2">
          {groups.map((g, i) => (
            <li key={i} className="bg-slate-50 p-3 rounded border text-sm">
              <div className="font-semibold text-slate-700">Original: {g.title} <span className="text-xs text-slate-400">({new Date(g.original.createdAt).toLocaleString()})</span></div>
              <ul className="mt-2 space-y-1 pl-4 border-l-2 border-red-200">
                {g.duplicates.map(d => (
                  <li key={d.id} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={selectedIds[type].includes(d.id)}
                      onChange={() => handleToggle(type, d.id)}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span className="text-slate-600 line-through">Duplicate (ID: {d.id.substring(0,8)}...)</span>
                    <span className="text-xs text-slate-400">({new Date(d.createdAt).toLocaleString()})</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative" dir="ltr">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">✨</span> System Deduplicator (Secret Tool)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {successMsg && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-center font-bold">
              {successMsg}
            </div>
          )}

          {!results && !loading && (
            <div className="text-center py-12">
              <p className="text-slate-600 mb-6">Click below to scan the entire system for duplicated courses, exams, lessons, and questions that have the exact same title and content.</p>
              <button 
                onClick={scanDuplicates}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Scan System Now
              </button>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
          )}

          {results && !loading && (
            <div>
              {results.courses.length === 0 && results.exams.length === 0 && results.lessons.length === 0 && results.questions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-lg">
                  No duplicates found! Your system is clean.
                </div>
              ) : (
                <>
                  {renderGroup('Courses', 'courses', results.courses)}
                  {renderGroup('Exams', 'exams', results.exams)}
                  {renderGroup('Lessons', 'lessons', results.lessons)}
                  {renderGroup('Questions', 'questions', results.questions)}
                </>
              )}
            </div>
          )}
        </div>

        {results && (results.courses.length > 0 || results.exams.length > 0 || results.lessons.length > 0 || results.questions.length > 0) && !loading && (
          <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
            <button 
              onClick={confirmClean}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow"
              disabled={Object.values(selectedIds).every(arr => arr.length === 0)}
            >
              Delete Selected Duplicates
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
