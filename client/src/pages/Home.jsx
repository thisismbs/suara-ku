import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X } from 'lucide-react';
import { db } from '../db';
import { speakSentence } from '../lib/tts';
import useSettings from '../hooks/useSettings';
import useCategories from '../hooks/useCategories';
import SentenceStrip from '../components/SentenceStrip';
import ActionBar from '../components/ActionBar';
import SymbolGrid from '../components/SymbolGrid';

export default function Home() {
  const { settings } = useSettings();
  const speechRate = settings?.speechRate ?? 0.9;

  // Daftar kategori dinamis (bawaan + custom_categories di localStorage)
  const {
    allCategories,
    addCustomCategory,
    isSituationalCategory
  } = useCategories();

  // Ambil data kosakata & frasa cepat realtime dari database lokal Dexie
  const vocabularies = useLiveQuery(() => db.vocabularies.toArray(), []) || [];

  // State kategori aktif, kalimat aktif, dan status audio
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [sentence, setSentence] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // State modal tambah / edit kalimat situasional & kustom
  const [isPhraseModalOpen, setIsPhraseModalOpen] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState(null);
  const [phraseInput, setPhraseInput] = useState('');
  const [phraseError, setPhraseError] = useState('');
  const [isSavingPhrase, setIsSavingPhrase] = useState(false);

  // State modal tambah kategori baru
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Menambahkan simbol kata ke bilah kalimat (untuk kategori umum)
  const handleSelectWord = (word) => {
    if (isSituationalCategory(word?.category)) {
      handleSpeakPhrase(word);
      return;
    }
    setSentence((prev) => [...prev, word]);
  };

  // Menghapus kata tertentu berdasarkan indeks
  const handleRemoveWord = (index) => {
    setSentence((prev) => prev.filter((_, i) => i !== index));
  };

  // Menghapus 1 kata terakhir (backspace)
  const handleDeleteLast = () => {
    setSentence((prev) => prev.slice(0, -1));
  };

  // Mengosongkan seluruh kalimat
  const handleClear = () => {
    setSentence([]);
  };

  // Membunyikan kalimat dari bilah kalimat dan simpan ke riwayat log
  const handleSpeak = async () => {
    if (sentence.length === 0 || isSpeaking) return;

    const fullText = sentence.map((w) => w.label).join(' ');
    setIsSpeaking(true);

    speakSentence(
      fullText,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      speechRate
    );

    // Simpan log ke Dexie IndexedDB
    try {
      const logId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      await db.logs.add({
        id: logId,
        text: fullText,
        words: sentence.map((w) => w.label),
        timestamp: new Date().toISOString(),
        syncStatus: 'pending'
      });
    } catch (err) {
      console.error('Gagal mencatat log percakapan ke Dexie:', err);
    }
  };

  // Melafalkan langsung kalimat situasional / kustom tanpa memasukkannya ke bilah kalimat
  const handleSpeakPhrase = async (item) => {
    const phraseText = (item?.text || item?.label || '').trim();
    if (!phraseText) return;

    setIsSpeaking(true);
    speakSentence(
      phraseText,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      speechRate
    );

    // Catat juga ke riwayat komunikasi lokal
    try {
      const logId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      await db.logs.add({
        id: logId,
        text: phraseText,
        words: phraseText.split(/\s+/).filter(Boolean),
        timestamp: new Date().toISOString(),
        syncStatus: 'pending'
      });
    } catch (err) {
      console.error('Gagal mencatat log frasa cepat ke Dexie:', err);
    }
  };

  // === Pengelolaan Modal Kategori Baru ===
  const handleOpenAddCategory = () => {
    setCategoryInput('');
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCategoryInput('');
    setCategoryError('');
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    const result = addCustomCategory(categoryInput);
    if (!result.success) {
      setCategoryError(result.error);
      return;
    }

    setActiveCategory(result.category);
    handleCloseCategoryModal();
  };

  // === Pengelolaan Modal Tambah / Edit Kalimat ===
  const handleOpenAddPhrase = () => {
    setEditingPhrase(null);
    setPhraseInput('');
    setPhraseError('');
    setIsPhraseModalOpen(true);
  };

  const handleOpenEditPhrase = (item) => {
    setEditingPhrase(item);
    setPhraseInput(item.text || item.label || '');
    setPhraseError('');
    setIsPhraseModalOpen(true);
  };

  const handleClosePhraseModal = () => {
    setIsPhraseModalOpen(false);
    setEditingPhrase(null);
    setPhraseInput('');
    setPhraseError('');
    setIsSavingPhrase(false);
  };

  const handleSavePhrase = async (e) => {
    e.preventDefault();
    const trimmed = phraseInput.trim();
    if (!trimmed) {
      setPhraseError('Isi kalimat tidak boleh kosong.');
      return;
    }

    setIsSavingPhrase(true);
    setPhraseError('');

    try {
      const now = new Date().toISOString();

      if (editingPhrase) {
        await db.vocabularies.update(editingPhrase.id, {
          text: trimmed,
          label: trimmed,
          updatedAt: now
        });
      } else {
        const phraseId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `phrase-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        await db.vocabularies.add({
          id: phraseId,
          text: trimmed,
          label: trimmed,
          category: activeCategory,
          symbolPath: null,
          iconName: 'Volume2',
          note: '',
          isCustom: 1,
          createdAt: now,
          updatedAt: now
        });
      }

      handleClosePhraseModal();
    } catch (err) {
      console.error('Gagal menyimpan kalimat situasional ke Dexie:', err);
      setPhraseError('Gagal menyimpan kalimat. Silakan coba lagi.');
      setIsSavingPhrase(false);
    }
  };

  const handleDeletePhrase = async (item) => {
    const phraseText = item?.text || item?.label || '';
    if (!window.confirm(`Hapus kalimat "${phraseText}"?`)) return;

    try {
      await db.vocabularies.delete(item.id);
    } catch (err) {
      console.error('Gagal menghapus kalimat situasional dari Dexie:', err);
    }
  };

  const activeIsSituational = isSituationalCategory(activeCategory);

  return (
    <div className="space-y-4">
      {/* 1. Bilah Kalimat Aktif */}
      <SentenceStrip
        words={sentence}
        onRemoveWord={handleRemoveWord}
      />

      {/* 2. Bilah Aksi Cepat (Bicara, Hapus, Reset) */}
      <ActionBar
        onSpeak={handleSpeak}
        onDeleteLast={handleDeleteLast}
        onClear={handleClear}
        isSpeaking={isSpeaking}
        disabled={sentence.length === 0}
      />

      {/* 3. Grid Simbol Komunikasi AAC & Frasa Cepat Situasional / Kustom */}
      <SymbolGrid
        vocabularies={vocabularies}
        categories={allCategories}
        activeCategory={activeCategory}
        isSituational={activeIsSituational}
        isSituationalCategory={isSituationalCategory}
        onCategoryChange={setActiveCategory}
        onAddCategory={handleOpenAddCategory}
        onSelectWord={handleSelectWord}
        onSpeakPhrase={handleSpeakPhrase}
        onAddPhrase={handleOpenAddPhrase}
        onEditPhrase={handleOpenEditPhrase}
        onDeletePhrase={handleDeletePhrase}
      />

      {/* 4. Modal Tambah Kategori Baru */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/90 shadow-clay-float p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Tambah Kategori Baru
                </h3>
                <p className="text-[11px] text-slate-400">
                  Buat kategori kalimat cepat sesuai situasi anak
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCategoryModal}
                aria-label="Tutup dialog"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {categoryError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">
                    Nama Kategori
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {categoryInput.length}/25
                  </span>
                </div>
                <input
                  type="text"
                  autoFocus
                  required
                  maxLength={25}
                  placeholder="Contoh: Di Taman, Di Klinik, Terapi..."
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseCategoryModal}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!categoryInput.trim()}
                  className="btn-clay flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-clay active:shadow-clay-pressed disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Tambah / Edit Kalimat Situasional & Kustom */}
      {isPhraseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/90 shadow-clay-float p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingPhrase ? 'Edit Kalimat' : 'Tambah Kalimat'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Kategori: {editingPhrase ? editingPhrase.category : activeCategory}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePhraseModal}
                aria-label="Tutup dialog"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {phraseError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {phraseError}
              </div>
            )}

            <form onSubmit={handleSavePhrase} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Isi Kalimat
                </label>
                <textarea
                  rows={3}
                  autoFocus
                  required
                  maxLength={160}
                  placeholder={
                    activeCategory === 'Di Sekolah'
                      ? 'Contoh: Bu guru, saya izin ke toilet'
                      : 'Contoh: Ma, saya mau minum air putih'
                  }
                  value={phraseInput}
                  onChange={(e) => setPhraseInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white resize-none transition-colors"
                />
                <div className="text-right text-[10px] text-slate-400 font-mono">
                  {phraseInput.length}/160
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClosePhraseModal}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPhrase || !phraseInput.trim()}
                  className="btn-clay flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-clay active:shadow-clay-pressed disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSavingPhrase
                    ? 'Menyimpan...'
                    : editingPhrase
                      ? 'Simpan Perubahan'
                      : 'Simpan Kalimat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
