import React, { useState, useRef } from 'react';
import { X, Plus, Sparkles, Check, Camera, Trash2 } from 'lucide-react';
import { db } from '../db';
import VocabIcon from './VocabIcon';
import { AVAILABLE_VOCAB_ICONS } from '../constants/icons';
import useCategories from '../hooks/useCategories';

export function AddVocabModal({ isOpen, onClose }) {
  const { selectableCategories, isSituationalCategory } = useCategories();

  const [label, setLabel] = useState('');
  const [category, setCategory] = useState(() => selectableCategories[0] || 'Kebutuhan');
  const [iconName, setIconName] = useState('Heart');
  const [customImage, setCustomImage] = useState(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const isSituationalSelected = isSituationalCategory(category);
  const maxLabelLength = isSituationalSelected ? 160 : 30;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Berkas harus berupa gambar (JPEG, PNG, WebP).');
      return;
    }

    // Batas 3MB agar performa IndexedDB tetap kencang
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Ukuran gambar maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCustomImage(reader.result);
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca berkas gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setCustomImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setLabel('');
    setCategory(selectableCategories[0] || 'Kebutuhan');
    setIconName('Heart');
    setCustomImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setNote('');
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedLabel = label.trim();

    if (!trimmedLabel) {
      setErrorMsg('Label kata tidak boleh kosong.');
      return;
    }

    if (trimmedLabel.length > maxLabelLength) {
      setErrorMsg(`Label maksimal ${maxLabelLength} karakter.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const vocabId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `vocab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Simpan kategori bawaan umum dalam huruf kecil untuk konsistensi, atau persis sesuai nama untuk situasional/kustom
      const storedCategory = isSituationalSelected
        ? category
        : category.toLowerCase();

      const newVocab = {
        id: vocabId,
        label: trimmedLabel,
        text: trimmedLabel,
        category: storedCategory,
        iconName: iconName || 'HelpCircle',
        symbolPath: customImage || null,
        note: note.trim() || '',
        isCustom: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Simpan ke tabel vocabularies Dexie
      await db.vocabularies.add(newVocab);

      // 2. Catat ke tabel outbox Dexie untuk sinkronisasi offline-first
      const outboxId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      await db.outbox.add({
        id: outboxId,
        action: 'create',
        entity: 'vocabulary',
        payload: newVocab,
        timestamp: new Date().toISOString()
      });

      // Feedback visual sukses
      setSuccessMsg(`"${newVocab.label}" berhasil ditambahkan!`);
      setTimeout(() => {
        handleClose();
        setIsSubmitting(false);
      }, 700);
    } catch (err) {
      console.error('Gagal menambahkan kosakata ke Dexie:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan kosakata.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Wadah Modal Clean Clay-lite */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/90 shadow-clay-float p-5 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Tambah Kosakata</h3>
              <p className="text-[11px] text-slate-400">Buat simbol kata atau frasa kustom baru</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifikasi Status */}
        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {/* Formulir */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Input Label Kata / Kalimat */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700">
                {isSituationalSelected ? 'Isi Kalimat / Frasa' : 'Label Kata'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {label.length}/{maxLabelLength}
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={maxLabelLength}
              placeholder={
                isSituationalSelected
                  ? 'Contoh: Ma, saya mau minum air hangat'
                  : 'Contoh: Mainan Favorit, Mama, Jus...'
              }
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Dropdown Kategori Dinamis (tersinkron dengan localStorage, tanpa "Semua") */}
          <div className="space-y-1">
            <label htmlFor="add-vocab-category" className="font-bold text-slate-700 block">
              Kategori AAC
            </label>
            <select
              id="add-vocab-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors cursor-pointer"
            >
              {selectableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Input Foto Kustom (Kamera / Galeri) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-indigo-500" />
                Foto Simbol (Kamera / Galeri)
              </label>
              <span className="text-[10px] text-slate-400">Opsional</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {customImage ? (
              <div className="flex items-center gap-3 p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-indigo-200 shrink-0 shadow-xs">
                  <img
                    src={customImage}
                    alt="Pratinjau Foto"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-xs truncate">Foto Kustom Terpilih</div>
                  <p className="text-[10px] text-slate-500">Akan tampil di kartu simbol AAC</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl flex items-center justify-center gap-2 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Pilih Foto dari Galeri / Kamera</span>
              </button>
            )}
          </div>

          {/* Pilihan Ikon Lucide (Grid Mini 12 Ikon) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                {customImage ? 'Pilihan Ikon Cadangan' : 'Atau Pilih Ikon Simbol'}
              </label>
              {customImage && (
                <span className="text-[10px] text-indigo-500 font-medium">Cadangan</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-2xl max-h-36 overflow-y-auto no-scrollbar">
              {AVAILABLE_VOCAB_ICONS.map((name) => {
                const isSelected = iconName === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setIconName(name)}
                    className={`h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <VocabIcon name={name} className="w-5 h-5 stroke-[2.2]" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan Tambahan (Opsional) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Catatan Terapis / Pendamping (Opsional)</label>
            <textarea
              rows={2}
              maxLength={100}
              placeholder="Contoh: Digunakan saat waktu bermain di ruang terapi..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white resize-none transition-colors"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !label.trim()}
              className="btn-clay w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-clay active:shadow-clay-pressed disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Kosakata Baru'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default AddVocabModal;
