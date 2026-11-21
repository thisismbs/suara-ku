import React, { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  MessageSquare,
  BookOpen,
  History,
  Sliders,
  UserCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Papan', icon: MessageSquare, end: true },
  { to: '/kosakata', label: 'Kosakata', icon: BookOpen, end: false },
  { to: '/riwayat', label: 'Riwayat', icon: History, end: false },
  { to: '/pengaturan', label: 'Pengaturan', icon: Sliders, end: false },
  { to: '/profil', label: 'Profil', icon: UserCheck, end: false },
];

export function Layout({ children }) {
  // Pasang listener global event 'beforeinstallprompt'
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.deferredPWAInstallPrompt = e;
      // Beritahu seluruh komponen bahwa prompt instalasi PWA siap digunakan
      window.dispatchEvent(new Event('pwa-prompt-available'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  return (
    <div className="bg-slate-100/70 min-h-screen flex justify-center font-sans antialiased text-slate-800">
      {/* Kontainer Utama terpusat ramah tampilan HP */}
      <div className="w-full max-w-md min-h-screen relative flex flex-col justify-between bg-slate-50 border-x border-slate-200/60 shadow-xl">
        
        {/* Header Bersih & Ringkas (Bebas Ornamen Berlebih) */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center">
          <div className="flex items-center gap-2.5">
            <img
              src="/suaraku-logo.png"
              alt="Logo SUARA-KU"
              className="w-8 h-8 rounded-xl object-contain"
            />
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              SUARA-KU
            </h1>
          </div>
        </header>

        {/* Konten Halaman */}
        <main className="flex-1 w-full p-4 pb-28 overflow-y-auto">
          {children || <Outlet />}
        </main>

        {/* Floating Docked Bottom Navigation Bar (5 Tab, min-h 56px) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <nav
            aria-label="Navigasi Utama"
            className="w-full max-w-md mx-4 mb-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-clay-float p-1.5 pointer-events-auto flex items-center justify-between gap-1"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `min-h-[56px] flex-1 flex flex-col items-center justify-center rounded-xl p-1 transition-all duration-150 select-none ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 font-bold'
                        : 'text-slate-400 hover:text-slate-600 font-medium'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mb-1 stroke-[2.2]" />
                  <span className="text-[11px] tracking-tight leading-tight">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

      </div>
    </div>
  );
}

export default Layout;
