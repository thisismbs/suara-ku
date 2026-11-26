import React from 'react';
import { Plus, Pencil, Trash2, Volume2 } from 'lucide-react';
import useSettings from '../hooks/useSettings';
import SymbolCard from './SymbolCard';

const CATEGORIES = [
  'Semua',
  'Kebutuhan',
  'Aksi',
  'Emosi',
  'Sosial',
  'Respon',
  'Di Rumah',
  'Di Sekolah'
];

const SITUATIONAL_CATEGORIES = ['Di Rumah', 'Di Sekolah'];

export function SymbolGrid({
  vocabularies = [],
  activeCategory = 'Semua',
  onCategoryChange,
  onSelectWord,
  onSpeakPhrase,
  onAddPhrase,
  onEditPhrase,
  onDeletePhrase
}) {
  const { settings } = useSettings();

  const isSituational = SITUATIONAL_CATEGORIES.includes(activeCategory);

  const filteredItems = activeCategory === 'Semua'
    ? vocabularies.filter(
        (v) => !SITUATIONAL_CATEGORIES.some(
          (cat) => cat.toLowerCase() === (v.category || '').toLowerCase()
        )
      )
    : vocabularies.filter(
        (v) => (v.category || '').toLowerCase() === activeCategory.toLowerCase()
      );

  // Sesuaikan tata letak grid dan ukuran kartu secara dinamis untuk kategori umum
  const is2x2 = settings.gridSize === '2x2';
  const gridClass = is2x2 ? 'grid-cols-2 gap-4' : 'grid-cols-3 gap-2.5 sm:gap-3';
  const cardSize = is2x2 ? 'large' : 'normal';

  return (
    <div className="space-y-3">
      {/* Tab Bar Filter Kategori Horizontal */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange?.(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-150 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Mode Khusus Kategori Situasional ("Di Rumah" & "Di Sekolah") */}
      {isSituational ? (
        <div className="space-y-2.5">
          {/* Baris Aksi Tambah Kalimat */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">
              Ketuk kalimat untuk langsung diucapkan
            </p>
            <button
              type="button"
              onClick={onAddPhrase}
              className="btn-clay bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold shadow-clay active:shadow-clay-pressed flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Kalimat</span>
            </button>
          </div>

          {/* Daftar Kartu Kalimat Situasional */}
          {filteredItems.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs font-semibold text-slate-600">
                Belum ada kalimat cepat di kategori {activeCategory}.
              </p>
              <p className="text-[11px] text-slate-400">
                Tekan tombol &quot;+ Tambah Kalimat&quot; untuk menambahkan frasa yang sering digunakan.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItems.map((item) => {
                const phraseText = item.text || item.label || '';
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-clay active:shadow-clay-pressed transition-all flex items-center justify-between gap-2 p-2.5"
                  >
                    {/* Area Utama Kartu: Klik untuk langsung melafalkan kalimat */}
                    <button
                      type="button"
                      onClick={() => onSpeakPhrase?.(item)}
                      className="flex-1 min-w-0 flex items-center gap-3 text-left p-1.5 rounded-xl hover:bg-indigo-50/60 active:bg-indigo-50 transition-colors cursor-pointer touch-manipulation select-none"
                    >
                      <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                        <Volume2 className="w-4 h-4 stroke-[2.2]" />
                      </span>
                      <span className="text-sm font-bold text-slate-800 leading-snug break-words">
                        {phraseText}
                      </span>
                    </button>

                    {/* Tombol Aksi Kecil: Edit & Hapus */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label="Edit kalimat"
                        title="Edit kalimat"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPhrase?.(item);
                        }}
                        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>
                      <button
                        type="button"
                        aria-label="Hapus kalimat"
                        title="Hapus kalimat"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePhrase?.(item);
                        }}
                        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Grid Simbol Responsif Berdasarkan Pengaturan (Kategori Umum) */
        <div className={`grid ${gridClass}`}>
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 font-medium bg-white rounded-2xl border border-slate-100">
              Tidak ada simbol di kategori {activeCategory}.
            </div>
          ) : (
            filteredItems.map((item) => (
              <SymbolCard
                key={item.id}
                item={item}
                size={cardSize}
                onClick={onSelectWord}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SymbolGrid;
