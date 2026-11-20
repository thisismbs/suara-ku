import React from 'react';
import { X } from 'lucide-react';

export function SentenceStrip({ words = [], onRemoveWord }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm min-h-[72px] flex items-center gap-2 overflow-x-auto no-scrollbar">
      {words.length === 0 ? (
        <span className="text-xs text-slate-400 font-medium italic pl-1">
          Sentuh simbol di bawah untuk menyusun kalimat...
        </span>
      ) : (
        words.map((word, index) => (
          <div
            key={`${word.id || word.label}-${index}`}
            className="px-3 py-1.5 bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 animate-in fade-in zoom-in-95 select-none"
          >
            <span>{word.label}</span>
            <button
              type="button"
              aria-label={`Hapus kata ${word.label}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveWord?.(index);
              }}
              className="w-4 h-4 rounded-full bg-indigo-200/70 hover:bg-indigo-300 text-indigo-800 flex items-center justify-center p-0.5 ml-0.5 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default SentenceStrip;
