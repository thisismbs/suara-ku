import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Volume2,
  Save,
  Trash2,
  Check
} from 'lucide-react';
import { db } from '../db';
import { speakSentence } from '../lib/tts';
import useSettings from '../hooks/useSettings';
import useCategories from '../hooks/useCategories';
import VocabIcon from '../components/VocabIcon';

const AAC_PREVIEW_STYLES = {
  kebutuhan: 'border-amber-300 bg-amber-50/70 text-amber-900',
  aksi: 'border-emerald-300 bg-emerald-50/70 text-emerald-900',
  emosi: 'border-pink-300 bg-pink-50/70 text-pink-900',
  sosial: 'border-blue-300 bg-blue-50/70 text-blue-900',
  respon: 'border-purple-300 bg-purple-50/70 text-purple-900',
  subjek: 'border-indigo-300 bg-indigo-50/70 text-indigo-900',
  default: 'border-slate-200 bg-white text-slate-800'
};

function VocabDetailContent({ item, id }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { selectableCategories, isSituationalCategory } = useCategories();
  const speechRate = settings?.speechRate ?? 0.9;

  // Bangun daftar opsi kategori dinamis (termasuk kategori lama item jika belum ada di daftar)
  const matchedOption = selectableCategories.find(
    (cat) => cat.toLowerCase() === (item.category || '').toLowerCase()
  );
  const categoryOptions = matchedOption || !item.category
    ? selectableCategories
    : [...selectableCategories, item.category];

  // State form terinisialisasi langsung dari data item
  const [editLabel, setEditLabel] = useState(item.label || item.text || '');
  const [editCategory, setEditCategory] = useState(matchedOption || item.category || 'Kebutuhan');
  const [editNote, setEditNote] = useState(item.note || '');
  const [imgError, setImgError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Uji suara pelafalan TTS
  const handleTestVoice = () => {
    const textToSpeak = editLabel.trim() || item.label;
    if (!textToSpeak || isSpeaking) return;

    setIsSpeaking(true);
    speakSentence(
      textToSpeak,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      speechRate
    );
  };

  // Simpan perubahan ke Dexie & Outbox
  const handleSave = async (e) => {
    e.preventDefault();
    const trimmedLabel = editLabel.trim();
    if (!trimmedLabel) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const storedCategory = isSituationalCategory(editCategory)
        ? editCategory
        : editCategory.toLowerCase();

      // 1. Perbarui tabel vocabularies
      await db.vocabularies.update(id, {
        label: trimmedLabel,
        text: trimmedLabel,
        category: storedCategory,
        note: editNote.trim(),
        updatedAt: now
      });

      // 2. Catat riwayat outbox untuk sinkronisasi backend
      const outboxId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `outbox-${Date.now()}`;

      await db.outbox.add({
        id: outboxId,
        action: 'update',
        entity: 'vocabulary',
        payload: {
          id,
          label: trimmedLabel,
          category: storedCategory,
          note: editNote.trim()
        },
        timestamp: now
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Gagal memperbarui kosakata:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus data kosakata dari Dexie & Outbox
  const handleDelete = async () => {
    try {
      await db.vocabularies.delete(id);

      const outboxId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `outbox-${Date.now()}`;

      await db.outbox.add({
        id: outboxId,
        action: 'delete',
        entity: 'vocabulary',
        payload: { id },
        timestamp: new Date().toISOString()
      });

      navigate('/kosakata');
    } catch (err) {
      console.error('Gagal menghapus kosakata:', err);
    }
  };

  const categoryKey = (editCategory || item.category || '').toLowerCase();
  const previewClass = AAC_PREVIEW_STYLES[categoryKey] || AAC_PREVIEW_STYLES.default;
  const isDefaultItem = item.isCustom === 0;

  return (
    <div className="space-y-4 pb-4">
      {/* Tombol Navigasi Kembali */}
      <Link
        to="/kosakata"
        className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        Kembali ke Katalog Kosakata
      </Link>

      {/* 1. Pratinjau Kartu Besar Clay-lite */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 text-center">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Pratinjau Kartu Simbol AAC
        </div>

        <div className="flex justify-center">
          <div
            className={`w-36 h-36 rounded-3xl border-2 p-3 flex flex-col items-center justify-between ${previewClass} shadow-clay transition-all`}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden">
              {item.symbolPath && !imgError ? (
                <img
                  src={item.symbolPath}
                  alt={editLabel || item.label}
                  onError={() => setImgError(true)}
                  className={`w-full h-full ${item.symbolPath.startsWith('data:') ? 'object-cover rounded-2xl' : 'object-contain p-1'} pointer-events-none`}
                  loading="lazy"
                />
              ) : (
                <VocabIcon name={item.iconName} className="w-10 h-10 stroke-[2.2]" />
              )}
            </div>

            <span className="text-sm font-bold text-center leading-tight tracking-tight line-clamp-2">
              {editLabel || item.label}
            </span>
          </div>
        </div>

        {/* Tombol Uji Suara Pelafalan */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleTestVoice}
            disabled={isSpeaking}
            className={`btn-clay w-full max-w-xs mx-auto py-2.5 px-4 font-bold text-xs rounded-xl shadow-clay flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isSpeaking
                ? 'bg-indigo-500 text-white animate-pulse'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            <Volume2 className="w-4 h-4 stroke-[2.4]" />
            <span>{isSpeaking ? 'Mendengarkan...' : `Uji Suara ("${editLabel || item.label}")`}</span>
          </button>
        </div>
      </div>

      {/* 2. Formulir Ubah Kata */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">
            Ubah Informasi Kosakata
          </h3>
          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
            {isDefaultItem ? 'Bawaan' : 'Kustom'}
          </span>
        </div>

        {saveSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            Perubahan berhasil disimpan!
          </div>
        )}

        {/* Edit Label Kata */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="font-bold text-slate-700">Label Kata</label>
            <span className="text-[10px] text-slate-400 font-mono">
              {editLabel.length}/30
            </span>
          </div>
          <input
            type="text"
            required
            maxLength={30}
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Edit Kategori */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700">Kategori AAC</label>
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors cursor-pointer"
          >
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Edit Catatan Tambahan */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700">Catatan Tambahan</label>
          <textarea
            rows={2}
            maxLength={100}
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Catatan penggunaan simbol..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white resize-none transition-colors"
          />
        </div>

        {/* Tombol Simpan Perubahan */}
        <button
          type="submit"
          disabled={isSaving || !editLabel.trim()}
          className="btn-clay w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-clay active:shadow-clay-pressed flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </button>

        {/* Tombol Hapus Kosakata Bersih (Tanpa Kartu Zona Bahaya) */}
        <div className="pt-2 border-t border-slate-100">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Kosakata</span>
            </button>
          ) : (
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2 text-center">
              <p className="text-xs font-semibold text-rose-800">
                Hapus kosakata "{item.label}"?
              </p>
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Meta Informasi Simbol (Tanpa UUID) */}
      {item.createdAt && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm text-xs text-slate-500 flex justify-between items-center">
          <span className="font-medium text-slate-500">Ditambahkan pada</span>
          <span className="font-semibold text-slate-700">
            {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </div>
      )}
    </div>
  );
}

export default function VocabDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Ambil data kosakata dari Dexie IndexedDB
  const item = useLiveQuery(() => db.vocabularies.get(id), [id]);

  if (item === undefined) {
    return (
      <div className="p-8 text-center text-sm font-semibold text-slate-400">
        Memuat detail kosakata...
      </div>
    );
  }

  if (item === null) {
    return (
      <div className="space-y-4">
        <Link
          to="/kosakata"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          Kembali ke Katalog
        </Link>
        <div className="p-8 bg-white border border-slate-200/80 rounded-2xl text-center space-y-3 shadow-sm">
          <p className="text-sm font-semibold text-rose-500">
            Kosakata dengan ID "{id}" tidak ditemukan.
          </p>
          <button
            type="button"
            onClick={() => navigate('/kosakata')}
            className="btn-clay inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-clay"
          >
            Kembali ke Daftar Kosakata
          </button>
        </div>
      </div>
    );
  }

  return <VocabDetailContent key={item.id} item={item} id={id} />;
}
