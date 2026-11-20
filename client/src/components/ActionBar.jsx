import React from 'react';
import { Volume2, Delete, RotateCcw } from 'lucide-react';

export function ActionBar({
  onSpeak,
  onDeleteLast,
  onClear,
  isSpeaking = false,
  disabled = false
}) {
  const isActionDisabled = disabled || isSpeaking;

  return (
    <div className="flex items-center gap-2">
      {/* Tombol Hapus 1 Kata Terakhir */}
      <button
        type="button"
        onClick={onDeleteLast}
        disabled={isActionDisabled}
        aria-label="Hapus kata terakhir"
        className="btn-clay bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-2xl py-3.5 px-3.5 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-clay disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Delete className="w-4 h-4 stroke-[2.2]" />
        <span>Hapus</span>
      </button>

      {/* Tombol Bersihkan Kalimat */}
      <button
        type="button"
        onClick={onClear}
        disabled={isActionDisabled}
        aria-label="Bersihkan semua kata"
        className="btn-clay bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-2xl py-3.5 px-3.5 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-clay disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <RotateCcw className="w-4 h-4 stroke-[2.2]" />
        <span>Reset</span>
      </button>

      {/* Tombol Utama Bicara (Terbesar) */}
      <button
        type="button"
        onClick={onSpeak}
        disabled={disabled && !isSpeaking}
        aria-label="Ucapkan kalimat"
        className={`btn-clay flex-1 rounded-2xl py-3.5 px-4 font-bold text-sm flex items-center justify-center gap-2 shadow-clay active:shadow-clay-pressed active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
          isSpeaking
            ? 'bg-indigo-500 text-white animate-pulse shadow-clay-pressed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        <Volume2 className={`w-5 h-5 stroke-[2.4] ${isSpeaking ? 'animate-bounce' : ''}`} />
        <span>{isSpeaking ? 'Berbicara...' : 'Bicara'}</span>
      </button>
    </div>
  );
}

export default ActionBar;
