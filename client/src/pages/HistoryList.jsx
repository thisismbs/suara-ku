import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  History,
  RotateCw,
  Trash2,
  Volume2,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  ChevronRight,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { db } from '../db';
import { triggerFullSync } from '../lib/sync';
import { speakSentence } from '../lib/tts';
import useSettings from '../hooks/useSettings';

// Fungsi pembantu menghitung statistik riwayat
function calculateStats(logs) {
  if (!logs || logs.length === 0) {
    return { todayCount: 0, topWord: '-' };
  }

  const todayStr = new Date().toDateString();
  let countToday = 0;
  const wordFrequency = {};

  logs.forEach((log) => {
    if (new Date(log.timestamp).toDateString() === todayStr) {
      countToday++;
    }

    const wordsArr = Array.isArray(log.words) && log.words.length > 0
      ? log.words
      : (log.text || '').split(/\s+/).filter(Boolean);

    wordsArr.forEach((w) => {
      const cleanWord = w.trim().toLowerCase();
      if (cleanWord) {
        wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
      }
    });
  });

  let maxWord = '-';
  let maxCount = 0;
  Object.entries(wordFrequency).forEach(([word, freq]) => {
    if (freq > maxCount) {
      maxCount = freq;
      maxWord = word;
    }
  });

  return {
    todayCount: countToday,
    topWord: maxCount > 0 ? maxWord.charAt(0).toUpperCase() + maxWord.slice(1) : '-'
  };
}

// Fungsi pembantu mengelompokkan log berdasarkan hari/tanggal
function groupLogsByDate(logs) {
  const groups = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  (logs || []).forEach((log) => {
    const d = new Date(log.timestamp);
    const logDateStr = d.toDateString();

    let groupKey = '';
    if (logDateStr === today) {
      groupKey = 'Hari Ini';
    } else if (logDateStr === yesterday) {
      groupKey = 'Kemarin';
    } else {
      groupKey = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(log);
  });

  return groups;
}

export default function HistoryList() {
  const { settings } = useSettings();
  const speechRate = settings?.speechRate ?? 0.9;

  // Ambil data log dari Dexie secara realtime terurut mundur
  const logs = useLiveQuery(() => db.logs.reverse().sortBy('timestamp'), []) || [];

  // State sinkronisasi dan konektivitas
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Pantau status koneksi online/offline secara dinamis
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { todayCount, topWord } = calculateStats(logs);
  const groupedLogs = groupLogsByDate(logs);

  // Aksi sinkronisasi data ke cloud
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('');

    try {
      const result = await triggerFullSync();
      setSyncMessage(result.message);
      setTimeout(() => setSyncMessage(''), 4000);
    } catch (err) {
      setSyncMessage(`Galat sinkronisasi: ${err.message}`);
      setTimeout(() => setSyncMessage(''), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Aksi mengosongkan seluruh riwayat
  const handleClearAll = async () => {
    if (logs.length === 0) return;
    if (confirm('Bersihkan seluruh riwayat komunikasi dari perangkat ini?')) {
      await db.logs.clear();
    }
  };

  // Aksi putar cepat audio tanpa berpindah halaman
  const handleQuickPlay = (e, text) => {
    e.preventDefault();
    e.stopPropagation();
    speakSentence(text, undefined, undefined, speechRate);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Baris Aksi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <History className="w-4 h-4 stroke-[2.2]" />
              </span>
              Riwayat Kalimat
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Log komunikasi offline-first tersimpan lokal
            </p>
          </div>

          {/* Badge Status Jaringan */}
          <div
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Tombol Aksi: Sinkronkan & Bersihkan */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-clay flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-clay active:shadow-clay-pressed flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            disabled={logs.length === 0 || isSyncing}
            className="btn-clay py-2.5 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold shadow-clay active:shadow-clay-pressed flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan</span>
          </button>
        </div>

        {/* Pesan Notifikasi Sinkronisasi */}
        {syncMessage && (
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs font-semibold animate-in fade-in">
            {syncMessage}
          </div>
        )}
      </div>

      {/* 2. Kartu Statistik Ringkas Clean Clay-lite */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            Diucapkan Hari Ini
          </div>
          <div className="text-xl font-black text-slate-800">
            {todayCount} <span className="text-xs font-semibold text-slate-400 font-normal">kalimat</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Kata Terpopuler
          </div>
          <div className="text-xl font-black text-indigo-600 truncate">
            {topWord}
          </div>
        </div>
      </div>

      {/* 3. Tampilan Daftar Log Dikelompokkan Tanggal */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <MessageSquare className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Belum ada riwayat kalimat</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kalimat yang Anda susun dan lafalkan di Papan Komunikasi akan otomatis tercatat di sini.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedLogs).map(([groupTitle, groupItems]) => (
            <div key={groupTitle} className="space-y-2">
              {/* Label Grup Tanggal */}
              <div className="px-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {groupTitle}
              </div>

              {/* Baris-baris Log */}
              <div className="space-y-2">
                {groupItems.map((log) => {
                  const timeStr = new Date(log.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const isSynced = log.syncStatus === 'synced';

                  return (
                    <Link
                      key={log.id}
                      to={`/riwayat/${log.id}`}
                      className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-3.5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer"
                    >
                      {/* Konten Teks & Jam */}
                      <div className="min-w-0 pr-2 space-y-1">
                        <h3 className="font-bold text-sm text-slate-800 leading-snug line-clamp-2">
                          "{log.text}"
                        </h3>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span>{timeStr}</span>
                          <span>•</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                              isSynced
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <CheckCircle className="w-2.5 h-2.5" />
                            {isSynced ? 'Tersinkron' : 'Tersimpan Lokal'}
                          </span>
                        </div>
                      </div>

                      {/* Tombol Putar Cepat & Chevron Navigasi */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <button
                          type="button"
                          aria-label="Putar cepat kalimat"
                          onClick={(e) => handleQuickPlay(e, log.text)}
                          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4 stroke-[2.2]" />
                        </button>

                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                          <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
