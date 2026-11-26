import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Plus, Search, X } from 'lucide-react';
import { db } from '../db';
import VocabIcon from '../components/VocabIcon';
import AddVocabModal from '../components/AddVocabModal';
import useCategories from '../hooks/useCategories';

const CATEGORY_STYLES = {
  kebutuhan: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  aksi: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  emosi: { bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200' },
  sosial: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  respon: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  subjek: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  default: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
};

// Komponen baris item dengan penanganan fallback gambar individual
function VocabListItem({ item }) {
  const [imgError, setImgError] = useState(false);
  const catKey = (item.category || '').toLowerCase();
  const catStyle = CATEGORY_STYLES[catKey] || CATEGORY_STYLES.default;

  return (
    <Link
      to={`/kosakata/${item.id}`}
      className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center justify-between shadow-sm hover:border-indigo-300 transition-all cursor-pointer group"
    >
      {/* Sisi Kiri: Ikon wadah pastel seragam, Label, Kategori */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-12 h-12 rounded-2xl ${catStyle.bg} border ${catStyle.border} ${catStyle.text} flex items-center justify-center shrink-0 overflow-hidden shadow-xs group-hover:scale-105 transition-transform`}
        >
          {item.symbolPath && !imgError ? (
            <img
              src={item.symbolPath}
              alt={item.label}
              onError={() => setImgError(true)}
              className={`w-full h-full ${item.symbolPath.startsWith('data:') ? 'object-cover rounded-xl' : 'object-contain p-1'} pointer-events-none`}
              loading="lazy"
            />
          ) : (
            <VocabIcon name={item.iconName} className="w-6 h-6 stroke-[2.2]" />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="font-bold text-sm text-slate-800 leading-snug truncate">
            {item.label}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${catStyle.bg} ${catStyle.text}`}
            >
              {item.category}
            </span>
            {item.note && (
              <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                {item.note}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Badge Kustom & Chevron */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {item.isCustom === 1 && (
          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
            Kustom
          </span>
        )}
        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
          <ChevronRight className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>
    </Link>
  );
}

export default function VocabList() {
  const { allCategories } = useCategories();
  const vocabularies = useLiveQuery(() => db.vocabularies.toArray(), []) || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter kosakata berdasarkan pencarian teks dan chip kategori
  const filteredVocabs = vocabularies.filter((item) => {
    const matchesSearch = (item.label || item.text || '')
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    const matchesCat =
      selectedCategory === 'Semua' ||
      (item.category || '').toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4">
      {/* Header Halaman & Tombol Tambah */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Manajemen Kosakata
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Katalog master kata untuk terapis dan pendamping
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-clay bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-3.5 py-2.5 font-semibold text-xs flex items-center gap-1.5 shadow-clay active:shadow-clay-pressed cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Kata</span>
          </button>
        </div>

        {/* Input Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari simbol atau kata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Chip Filter Kategori */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {allCategories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-150 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Daftar Kartu List Kosakata */}
      <div className="space-y-2">
        {filteredVocabs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-2">
            <p className="text-xs font-semibold text-slate-500">
              Tidak ada kosakata yang cocok dengan "{searchQuery || selectedCategory}".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
              }}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          filteredVocabs.map((item) => (
            <VocabListItem key={item.id} item={item} />
          ))
        )}
      </div>

      {/* Modal Tambah Kosakata */}
      <AddVocabModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
