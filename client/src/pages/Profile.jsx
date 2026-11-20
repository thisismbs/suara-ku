import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ShieldCheck,
  ExternalLink,
  Sparkles,
  BookOpen,
  Download,
  Smartphone,
  CheckCircle2,
  Wifi,
  Database,
  Volume2,
  Cpu,
  GraduationCap,
  MessageSquareHeart,
  Check
} from 'lucide-react';
import { db } from '../db';
import usePWAInstall from '../hooks/usePWAInstall';

export default function Profile() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [installMsg, setInstallMsg] = useState('');

  // Status reaktif koneksi jaringan
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

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

  // Diagnostik Dexie IndexedDB
  const vocabCount = useLiveQuery(() => db.vocabularies.count(), []) ?? 0;
  const logCount = useLiveQuery(() => db.logs.count(), []) ?? 0;
  const outboxCount = useLiveQuery(() => db.outbox.count(), []) ?? 0;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    const result = await installApp();
    setIsInstalling(false);
    if (result.success) {
      setInstallMsg('Aplikasi SUARA-KU berhasil dipasang ke Layar Utama!');
    }
  };

  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Header Identitas Pengembang Proyek */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm text-center space-y-3 relative overflow-hidden">
        {/* Latar Belakang Lembut & Aksen Dekoratif */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50/70 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-50/70 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          {/* Avatar Icon Pengembang */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-clay">
            <GraduationCap className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="mt-3.5 space-y-1">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 tracking-wide uppercase">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Tugas Akhir Praktikum PPB 2026
            </span>

            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight pt-1">
              Malvin Bima Santiko
            </h2>
            <p className="text-xs font-semibold text-indigo-600">
              S1 Teknik Komputer Universitas Diponegoro
            </p>
          </div>

          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-2 leading-relaxed">
            Pengembangan sistem komunikasi augmentatif dan alternatif (AAC) adaptif berbasis Progressive Web App untuk mendukung kemandirian anak dengan disabilitas motorik dan wicara.
          </p>
        </div>
      </div>

      {/* 2. Fitur Smart PWA Install */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            Pemasangan Aplikasi (PWA)
          </h3>
          <span className="text-[10px] font-semibold text-slate-400">Standalone Mode</span>
        </div>

        {isInstalled ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-900 leading-snug">
                SUARA-KU Sudah Terpasang
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Aplikasi ini berjalan dalam mode Standalone PWA di perangkat Anda. Siap digunakan kapan pun tanpa peramban.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Pasang SUARA-KU ke layar beranda HP atau tablet Anda untuk pengalaman layar penuh bebas bilah URL, akses instan satu sentuhan, dan performa offline maksimal.
            </p>

            {installMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {installMsg}
              </div>
            )}

            {isInstallable ? (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="btn-clay w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-clay active:shadow-clay-pressed flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.4]" />
                {isInstalling ? 'Memasang Aplikasi...' : 'Pasang Aplikasi SUARA-KU ke Layar Utama'}
              </button>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                  Petunjuk Pemasangan Manual:
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Buka menu peramban Anda (ikon titik tiga di Chrome/Edge atau ikon Share di Safari iOS), lalu pilih <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> (Add to Home screen) atau <strong>&quot;Install App&quot;</strong>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Kartu 1: Tentang SUARA-KU */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquareHeart className="w-4 h-4 text-pink-600" />
          Tentang SUARA-KU AAC
        </h3>

        <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong>SUARA-KU</strong> adalah aplikasi <em>Augmentative and Alternative Communication</em> (AAC) berbasis Progressive Web App (PWA) yang dirancang khusus untuk memfasilitasi komunikasi ekspresif anak dengan hambatan motorik dan wicara, seperti penderita <strong>Cerebral Palsy</strong> dan keterlambatan bicara (<em>speech delay</em>).
          </p>
          <p>
            Dengan filosofi arsitektur <strong>Offline-First</strong>, seluruh kosakata dan rekaman riwayat komunikasi tersimpan secara lokal di memori peramban (IndexedDB melalui Dexie.js). Aplikasi tetap dapat berfungsi penuh di ruang terapi atau area tanpa sinyal internet, serta secara cerdas melakukan sinkronisasi awan (cloud sync) ke database PostgreSQL ketika koneksi internet tersedia.
          </p>
        </div>
      </div>

      {/* 4. Kartu 2: Panduan Singkat Orang Tua / Terapis */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Panduan Singkat Orang Tua & Terapis
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>1. Papan Komunikasi & Suara</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Sentuh kartu simbol untuk menyusun kalimat pada bilah atas. Tekan tombol ungu &quot;Bicara&quot; untuk melafalkan suara jernih dalam bahasa Indonesia dengan artikulasi yang disesuaikan.
            </p>
          </div>

          <div className="p-3 bg-indigo-50/60 border border-indigo-200/70 rounded-xl space-y-1">
            <div className="font-bold text-indigo-900 flex items-center gap-1.5">
              <span>2. Kosakata Foto Kustom</span>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              Buka menu Kosakata, lalu tekan tombol (+). Orang tua dapat memotret mainan favorit, makanan, atau anggota keluarga langsung dari kamera/galeri untuk kosakata yang lebih personal dan mudah dikenali anak.
            </p>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl space-y-1">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span>3. Kontrol Aksesibilitas Motorik</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Di menu Pengaturan, aktifkan jeda lockout (anti-tremor) untuk menyaring sentuhan ganda tak sengaja akibat kejang otot, atau nyalakan Dwell Time (sentuh-tahan) bagi anak yang kesulitan mengangkat jari.
            </p>
          </div>

          <div className="p-3 bg-purple-50/60 border border-purple-200/70 rounded-xl space-y-1">
            <div className="font-bold text-purple-900 flex items-center gap-1.5">
              <span>4. Riwayat & Sinkronisasi Cloud</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Setiap kalimat yang diucapkan anak tersimpan otomatis di menu Riwayat. Orang tua dan terapis dapat meninjau perkembangan komunikasi anak serta menyinkronkan data ke server terapis secara aman.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Kartu 3: Kepatuhan Sumber Daya & Lisensi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Kepatuhan Sumber Daya & Lisensi Terbuka
        </h3>

        <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
          {/* ARASAAC */}
          <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Simbol Piktogram ARASAAC</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                CC BY-NC-SA 3.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Piktogram simbol yang digunakan dalam sistem ini merupakan hak cipta <strong>Pemerintah Aragón</strong> dan dibuat oleh <strong>Sergio Palao</strong> untuk <strong>ARASAAC</strong>.
            </p>
            <div>
              <a
                href="https://arasaac.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                Kunjungi Portal ARASAAC <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Software Open Source */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
              <div className="font-bold text-slate-800">Lucide Icons</div>
              <div className="text-slate-400">Lisensi ISC / MIT</div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
              <div className="font-bold text-slate-800">Dexie.js</div>
              <div className="text-slate-400">Lisensi Apache 2.0</div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
              <div className="font-bold text-slate-800">Tailwind CSS</div>
              <div className="text-slate-400">Lisensi MIT</div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
              <div className="font-bold text-slate-800">Web Speech API</div>
              <div className="text-slate-400">Standar W3C Native</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Kartu 4: Status Sistem & Diagnostik Real-Time */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-indigo-600" />
          Status Sistem & Diagnostik Real-Time
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Database IndexedDB */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              IndexedDB Dexie
            </div>
            <div className="font-bold text-slate-800 text-xs">
              {vocabCount} Kosakata
            </div>
            <div className="text-[10px] text-slate-500">
              {logCount} Riwayat • {outboxCount} Outbox
            </div>
          </div>

          {/* Service Worker PWA */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              Service Worker PWA
            </div>
            <div className="font-bold text-emerald-700 text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {hasServiceWorker ? 'Aktif & Siap' : 'Tidak Didukung'}
            </div>
            <div className="text-[10px] text-slate-500">
              Offline Cache Ready
            </div>
          </div>

          {/* Jaringan Online / Offline */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-blue-500" />
              Koneksi Jaringan
            </div>
            <div className={`font-bold text-xs flex items-center gap-1 ${isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isOnline ? 'Online (Terhubung)' : 'Mode Offline'}
            </div>
            <div className="text-[10px] text-slate-500">
              {isOnline ? 'Sinkronisasi Siap' : 'Menyimpan Lokal'}
            </div>
          </div>

          {/* Mesin Suara TTS */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-purple-500" />
              Mesin Suara (TTS)
            </div>
            <div className="font-bold text-purple-700 text-xs">
              {hasTTS ? 'id-ID Native Siap' : 'Tidak Didukung'}
            </div>
            <div className="text-[10px] text-slate-500">
              Web Speech Synthesis
            </div>
          </div>
        </div>

        {/* Versi Aplikasi */}
        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 font-medium">
          <span>Versi Aplikasi: v1.0.0</span>
          <span>SUARA-KU PWA 2026</span>
        </div>
      </div>
    </div>
  );
}
