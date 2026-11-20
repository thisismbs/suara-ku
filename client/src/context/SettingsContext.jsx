import React, { createContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'suara_ku_settings';

const DEFAULT_SETTINGS = {
  gridSize: '3x3',     // '2x2' | '3x3'
  lockoutMs: 500,      // rentang 0 - 1500 ms
  dwellEnabled: false, // boolean
  dwellMs: 1000,       // rentang 500 - 2000 ms
  speechRate: 0.9      // rentang 0.7 - 1.2
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Buang properti lawas yang sudah tidak digunakan (theme, scanSpeed)
        delete parsed.theme;
        delete parsed.scanSpeed;
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (err) {
      console.error('Error membaca pengaturan dari localStorage:', err);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Error menyimpan pengaturan ke localStorage:', err);
    }
  }, [settings]);

  const updateSettings = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateSetting: updateSettings, // alias kemudahan kompatibilitas
        resetToDefaults,
        resetSettings: resetToDefaults, // alias kemudahan kompatibilitas
        setSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export default SettingsContext;
