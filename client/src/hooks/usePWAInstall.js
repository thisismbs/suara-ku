import { useState, useEffect } from 'react';

// Simpan event sebelum prompt terlewat di awal pemuatan halaman
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPWAInstallPrompt = e;
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(() => {
    return typeof window !== 'undefined' ? window.deferredPWAInstallPrompt || null : null;
  });
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Cek apakah aplikasi sudah berjalan dalam mode standalone PWA
    const checkIsStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsInstalled(isStandalone);
    };

    checkIsStandalone();

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      window.deferredPWAInstallPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    const promptEvent = deferredPrompt || window.deferredPWAInstallPrompt;
    if (!promptEvent) {
      return { success: false, reason: 'no-prompt' };
    }

    try {
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult?.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        window.deferredPWAInstallPrompt = null;
        return { success: true };
      }
      return { success: false, reason: 'dismissed' };
    } catch (err) {
      console.error('Gagal memicu install prompt PWA:', err);
      return { success: false, error: err };
    }
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    installApp
  };
}

export default usePWAInstall;
