import React, { useState } from 'react';
import usePWAInstall from '../hooks/usePWAInstall';

export default function Profile() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [installMsg, setInstallMsg] = useState('');
  const [imgError, setImgError] = useState(false);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    const result = await installApp();
    setIsInstalling(false);
    if (result.success) {
      setInstallMsg('Aplikasi SUARA-KU berhasil dipasang ke Layar Utama.');
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Struktur Bagian Atas: Identitas Pengembang */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        {/* Judul paling atas: teks hitam tebal tanpa background warna atau badge */}
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          Tugas Akhir Praktikum PPB 2026
        </h1>

        {/* Wadah Bio Horizontal */}
        <div className="flex items-center gap-4">
          {/* Kotak Foto Profil */}
          {!imgError ? (
            <img
              src="/foto-mavin.jpg"
              alt="Malvin Bima Santiko"
              onError={() => setImgError(true)}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden text-xs font-semibold select-none">
              MBS
            </div>
          )}

          {/* 3 Baris Teks Terpisah */}
          <div className="space-y-0.5 min-w-0">
            <div className="font-bold text-slate-800 text-base leading-snug">
              Malvin Bima Santiko
            </div>
            <div className="text-slate-600 text-sm leading-snug">
              21120124130047
            </div>
            <div className="text-slate-500 text-sm leading-snug">
              Teknik Komputer 2024
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Tentang SUARA-KU */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2.5">
        <h2 className="font-bold text-slate-900 text-sm">
          Tentang SUARA-KU
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          SUARA-KU adalah aplikasi Komunikasi Augmentatif dan Alternatif (AAC) berbasis Progressive Web App (PWA) yang dirancang untuk mendukung individu dengan hambatan motorik dan wicara, seperti Cerebral Palsy dan keterlambatan bicara. Aplikasi mengusung arsitektur offline-first menggunakan penyimpanan lokal IndexedDB, sehingga seluruh fitur papan simbol, pengelolaan kosakata kustom, dan perekaman riwayat tetap dapat beroperasi tanpa sambungan internet.
        </p>
      </div>

      {/* Section 2: Pemasangan Aplikasi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h2 className="font-bold text-slate-900 text-sm">
          Pemasangan Aplikasi
        </h2>

        {isInstalled ? (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
            Aplikasi SUARA-KU sudah terpasang di perangkat Anda dalam mode mandiri (standalone) dan siap digunakan langsung dari layar utama.
          </div>
        ) : (
          <div className="space-y-3">
            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="btn-clay w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-clay active:shadow-clay-pressed cursor-pointer transition-all disabled:opacity-50"
              >
                {isInstalling ? 'Memproses Pemasangan...' : 'Pasang SUARA-KU ke Perangkat Ini'}
              </button>
            )}

            {installMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                {installMsg}
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-xs font-semibold text-slate-700">
                Petunjuk Pemasangan Manual:
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Anda juga dapat memasang aplikasi ini melalui menu peramban (ikon titik tiga di Chrome/Edge atau tombol Bagikan di Safari iOS), lalu pilih <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> (Add to Home screen) atau <strong>&quot;Instal Aplikasi&quot;</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Panduan Penggunaan Singkat */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h2 className="font-bold text-slate-900 text-sm">
          Panduan Penggunaan Singkat
        </h2>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
            <div className="font-semibold text-slate-800">1. Papan Komunikasi</div>
            <p className="text-slate-600 leading-relaxed">
              Sentuh kartu simbol untuk menyusun kalimat pada bilah atas, lalu tekan tombol &quot;Bicara&quot; untuk melafalkan suara jernih dalam bahasa Indonesia.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
            <div className="font-semibold text-slate-800">2. Tambah Kosakata</div>
            <p className="text-slate-600 leading-relaxed">
              Buka menu Kosakata dan tekan tombol (+) untuk menambahkan simbol baru menggunakan pilihan ikon atau foto langsung dari kamera/galeri perangkat.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
            <div className="font-semibold text-slate-800">3. Aksesibilitas Motorik</div>
            <p className="text-slate-600 leading-relaxed">
              Buka menu Pengaturan untuk mengatur jeda anti-tremor (lockout) guna mencegah ketukan ganda tak disengaja, atau aktifkan sentuh-tahan (dwell time) sesuai kenyamanan anak.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
            <div className="font-semibold text-slate-800">4. Riwayat &amp; Sinkronisasi</div>
            <p className="text-slate-600 leading-relaxed">
              Kalimat yang pernah diucapkan tersimpan otomatis di menu Riwayat dan dapat disinkronkan ke server cloud saat perangkat terhubung ke internet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
