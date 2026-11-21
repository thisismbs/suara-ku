import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Volume2,
  Trash2
} from 'lucide-react';
import { db } from '../db';
import { speakSentence } from '../lib/tts';
import useSettings from '../hooks/useSettings';

export default function HistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const speechRate = settings?.speechRate ?? 0.9;

  // Ambil data log secara realtime dari Dexie
  const log = useLiveQuery(() => db.logs.get(id), [id]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Ucapkan ulang kalimat dengan Web Speech API Bahasa Indonesia
  const handleSpeak = () => {
    if (!log?.text || isSpeaking) return;

    setIsSpeaking(true);
    speakSentence(
      log.text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      speechRate
    );
  };

  // Hapus entri log dari IndexedDB
  const handleDelete = async () => {
    try {
      await db.logs.delete(id);
      navigate('/riwayat');
    } catch (err) {
      console.error('Gagal menghapus log:', err);
    }
  };

  if (log === undefined) {
    return (
      <div className="p-8 text-center text-sm font-semibold text-slate-400">
        Memuat detail riwayat...
      </div>
    );
  }

  if (log === null) {
    return (
      <div className="space-y-4">
        <Link
          to="/riwayat"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          Kembali ke Riwayat
        </Link>
        <div className="p-8 bg-white border border-slate-200/80 rounded-2xl text-center space-y-3 shadow-sm">
          <p className="text-sm font-semibold text-rose-500">
            Riwayat tidak ditemukan.
          </p>
          <button
            type="button"
            onClick={() => navigate('/riwayat')}
            className="btn-clay inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-clay cursor-pointer"
          >
            Kembali ke Daftar Riwayat
          </button>
        </div>
      </div>
    );
  }

  const dateStr = new Date(log.timestamp).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isSynced = log.syncStatus === 'synced';

  // Array kata penyusun kalimat
  const wordsList = Array.isArray(log.words) && log.words.length > 0
    ? log.words
    : (log.text || '').split(/\s+/).filter(Boolean);

  return (
    <div className="space-y-4 pb-4">
      {/* Tombol Navigasi Kembali */}
      <Link
        to="/riwayat"
        className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        Kembali ke Daftar Riwayat
      </Link>

      {/* Kartu Utama Riwayat */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        
        {/* Teks Kalimat Utuh */}
        <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1.5">
          <div className="text-xs font-semibold text-slate-500">
            Kalimat yang Diucapkan
          </div>
          <p className="text-xl font-bold text-slate-800 leading-snug">
            "{log.text}"
          </p>
        </div>

        {/* Deretan Chip Kata Penyusun */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500">
            Kata Penyusun
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {wordsList.map((word, idx) => (
              <span
                key={`${word}-${idx}`}
                className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        {/* Tombol Aksi: Ucapkan Ulang */}
        <button
          type="button"
          onClick={handleSpeak}
          disabled={isSpeaking}
          className={`btn-clay w-full py-3.5 px-4 font-bold text-sm rounded-2xl shadow-clay flex items-center justify-center gap-2 cursor-pointer transition-all ${
            isSpeaking
              ? 'bg-indigo-500 text-white animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          <Volume2 className="w-5 h-5 stroke-[2.4]" />
          <span>{isSpeaking ? 'Mendengarkan...' : 'Ucapkan Ulang Kalimat'}</span>
        </button>

        {/* Informasi Detail Waktu & Status Sinkronisasi */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
            <span className="font-medium text-slate-500">Waktu</span>
            <span className="font-semibold text-slate-700 text-right">{dateStr}</span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="font-medium text-slate-500">Status</span>
            <span
              className={`font-semibold px-2.5 py-0.5 rounded-full text-xs border ${
                isSynced
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {isSynced ? 'Tersinkron ke Cloud' : 'Lokal'}
            </span>
          </div>
        </div>
      </div>

      {/* Zona Hapus Riwayat */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="btn-clay w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-xl shadow-clay flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 stroke-[2.2]" />
            <span>Hapus dari Riwayat</span>
          </button>
        ) : (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-center">
            <p className="text-xs font-bold text-rose-800">
              Hapus rekaman kalimat ini dari riwayat?
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
