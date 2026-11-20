import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { speakSentence } from '../lib/tts';
import useSettings from '../hooks/useSettings';
import SentenceStrip from '../components/SentenceStrip';
import ActionBar from '../components/ActionBar';
import SymbolGrid from '../components/SymbolGrid';

export default function Home() {
  const { settings } = useSettings();
  const speechRate = settings?.speechRate ?? 0.9;

  // Ambil data kosakata realtime dari database lokal Dexie
  const vocabularies = useLiveQuery(() => db.vocabularies.toArray(), []) || [];

  // State kalimat aktif dan status audio
  const [sentence, setSentence] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Menambahkan simbol kata ke bilah kalimat
  const handleSelectWord = (word) => {
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

  // Membunyikan kalimat dengan mesin suara dan simpan ke riwayat log
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

      {/* 3. Grid Simbol Komunikasi AAC dengan Filter Kategori & Grid Adaptif */}
      <SymbolGrid
        vocabularies={vocabularies}
        onSelectWord={handleSelectWord}
      />
    </div>
  );
}
