import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { populateDefaultVocabularies } from './db';
import Layout from './components/Layout';

// Halaman-halaman SUARA-KU
import Home from './pages/Home';
import VocabList from './pages/VocabList';
import VocabDetail from './pages/VocabDetail';
import HistoryList from './pages/HistoryList';
import HistoryDetail from './pages/HistoryDetail';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

export default function App() {
  useEffect(() => {
    // Inisialisasi seeder kosakata AAC default ke IndexedDB Dexie
    populateDefaultVocabularies();
  }, []);

  return (
    <SettingsProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/kosakata" element={<VocabList />} />
            <Route path="/kosakata/:id" element={<VocabDetail />} />
            <Route path="/riwayat" element={<HistoryList />} />
            <Route path="/riwayat/:id" element={<HistoryDetail />} />
            <Route path="/pengaturan" element={<Settings />} />
            <Route path="/profil" element={<Profile />} />
            {/* Fallback route bersih */}
            <Route
              path="*"
              element={
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm text-center space-y-3">
                  <h3 className="font-bold text-slate-800 text-sm">Halaman Tidak Ditemukan</h3>
                  <p className="text-xs text-slate-500">Rute yang Anda cari tidak tersedia.</p>
                  <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    Kembali ke Papan
                  </Link>
                </div>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </SettingsProvider>
  );
}
