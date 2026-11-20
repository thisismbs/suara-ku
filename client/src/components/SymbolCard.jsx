import React, { useState, useRef, useEffect } from 'react';
import useSettings from '../hooks/useSettings';
import VocabIcon from './VocabIcon';

const AAC_CATEGORY_STYLES = {
  kebutuhan: 'border-amber-300 bg-amber-50/70 text-amber-900 hover:border-amber-400',
  aksi: 'border-emerald-300 bg-emerald-50/70 text-emerald-900 hover:border-emerald-400',
  emosi: 'border-pink-300 bg-pink-50/70 text-pink-900 hover:border-pink-400',
  sosial: 'border-blue-300 bg-blue-50/70 text-blue-900 hover:border-blue-400',
  respon: 'border-purple-300 bg-purple-50/70 text-purple-900 hover:border-purple-400',
  subjek: 'border-indigo-300 bg-indigo-50/70 text-indigo-900 hover:border-indigo-400',
  default: 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
};

export function SymbolCard({ item, onClick, size = 'normal' }) {
  const { settings } = useSettings();
  const lockoutMs = settings?.lockoutMs ?? 500;
  const dwellEnabled = Boolean(settings?.dwellEnabled);
  const dwellMs = settings?.dwellMs ?? 1000;

  const [imgError, setImgError] = useState(false);
  const [isDwelling, setIsDwelling] = useState(false);

  // Referensi untuk anti-tremor dan dwell click
  const lastClickTimeRef = useRef(0);
  const dwellTimeoutRef = useRef(null);
  const dwellTriggeredRef = useRef(false);

  // Bersihkan timeout saat komponen unmount
  useEffect(() => {
    return () => {
      if (dwellTimeoutRef.current) {
        clearTimeout(dwellTimeoutRef.current);
      }
    };
  }, []);

  if (!item) return null;

  // Eksekusi pemilihan kartu dengan perlindungan Anti-Tremor
  const triggerClick = () => {
    const now = Date.now();
    if (lockoutMs > 0 && now - lastClickTimeRef.current < lockoutMs) {
      // Abaikan sentuhan tremor yang terlalu cepat
      return;
    }
    lastClickTimeRef.current = now;
    onClick?.(item);
  };

  // Mulai hitung mundur Dwell Click (sentuh tahan)
  const startDwell = () => {
    if (!dwellEnabled) return;

    dwellTriggeredRef.current = false;
    setIsDwelling(true);

    if (dwellTimeoutRef.current) {
      clearTimeout(dwellTimeoutRef.current);
    }

    dwellTimeoutRef.current = setTimeout(() => {
      dwellTriggeredRef.current = true;
      triggerClick();
      setIsDwelling(false);
    }, dwellMs);
  };

  // Batalkan hitung mundur Dwell Click
  const cancelDwell = () => {
    if (!dwellEnabled) return;

    if (dwellTimeoutRef.current) {
      clearTimeout(dwellTimeoutRef.current);
    }
    setIsDwelling(false);
  };

  // Penanganan klik biasa (mouse / touch tap)
  const handleClick = (e) => {
    e?.preventDefault();

    // Jika sudah terpicu otomatis oleh dwell click saat jari dilepas, abaikan klik kedua
    if (dwellTriggeredRef.current) {
      dwellTriggeredRef.current = false;
      return;
    }

    triggerClick();
  };

  const categoryKey = (item.category || '').toLowerCase();
  const themeClass = AAC_CATEGORY_STYLES[categoryKey] || AAC_CATEGORY_STYLES.default;

  const isLarge = size === 'large';
  const minHeightClass = isLarge ? 'min-h-[110px]' : 'min-h-[84px]';
  const mediaBoxSize = isLarge ? 'w-14 h-14' : 'w-10 h-10';
  const labelSize = isLarge ? 'text-sm font-extrabold' : 'text-xs font-bold';

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={startDwell}
      onPointerUp={cancelDwell}
      onPointerLeave={cancelDwell}
      onPointerCancel={cancelDwell}
      className={`touch-manipulation select-none btn-clay w-full rounded-2xl border p-2 relative overflow-hidden flex flex-col items-center justify-between ${minHeightClass} ${themeClass} shadow-clay active:shadow-clay-pressed active:translate-y-1 transition-all duration-150 cursor-pointer group ${
        isDwelling ? 'ring-2 ring-indigo-500 ring-offset-1 scale-[0.98]' : ''
      }`}
    >
      {/* Area Simbol / Gambar / Ikon */}
      <div className={`${mediaBoxSize} rounded-xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 pointer-events-none`}>
        {item.symbolPath && !imgError ? (
          <img
            src={item.symbolPath}
            alt={item.label}
            onError={() => setImgError(true)}
            className={`w-full h-full ${item.symbolPath.startsWith('data:') ? 'object-cover rounded-lg' : 'object-contain p-1'} pointer-events-none`}
            loading="lazy"
          />
        ) : (
          <VocabIcon
            name={item.iconName}
            className={isLarge ? 'w-9 h-9 stroke-[2.2]' : 'w-6 h-6 stroke-[2.2]'}
          />
        )}
      </div>

      {/* Label Kata */}
      <span className={`${labelSize} text-center leading-tight tracking-tight mt-1 line-clamp-2 pointer-events-none`}>
        {item.label}
      </span>

      {/* Indikator Animasi Dwell Progress Bar */}
      {isDwelling && (
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-indigo-100/90 rounded-b-2xl overflow-hidden pointer-events-none">
          <div
            className="h-full bg-indigo-600 animate-dwell"
            style={{ animationDuration: `${dwellMs}ms` }}
          />
        </div>
      )}
    </button>
  );
}

export default SymbolCard;
