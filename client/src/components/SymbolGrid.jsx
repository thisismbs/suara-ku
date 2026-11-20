import React, { useState } from 'react';
import useSettings from '../hooks/useSettings';
import SymbolCard from './SymbolCard';

const CATEGORIES = ['Semua', 'Kebutuhan', 'Aksi', 'Emosi', 'Sosial', 'Respon'];

export function SymbolGrid({ vocabularies = [], onSelectWord }) {
  const { settings } = useSettings();
  const [activeCategory, setActiveCategory] = useState('Semua');

  const filteredItems = activeCategory === 'Semua'
    ? vocabularies
    : vocabularies.filter(
        (v) => (v.category || '').toLowerCase() === activeCategory.toLowerCase()
      );

  // Sesuaikan tata letak grid dan ukuran kartu secara dinamis
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
              onClick={() => setActiveCategory(cat)}
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

      {/* Grid Simbol Responsif Berdasarkan Pengaturan */}
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
    </div>
  );
}

export default SymbolGrid;
