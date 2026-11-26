import { useState, useEffect, useCallback } from 'react';

export const CUSTOM_CATEGORIES_KEY = 'custom_categories';

export const DEFAULT_GENERAL_CATEGORIES = [
  'Kebutuhan',
  'Aksi',
  'Emosi',
  'Sosial',
  'Respon'
];

export const DEFAULT_SITUATIONAL_CATEGORIES = ['Di Rumah', 'Di Sekolah'];

export const DEFAULT_CATEGORIES = [
  'Semua',
  ...DEFAULT_GENERAL_CATEGORIES,
  ...DEFAULT_SITUATIONAL_CATEGORIES
];

export function getCustomCategories() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function saveCustomCategories(categories) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('custom-categories-updated'));
  } catch (err) {
    console.error('Gagal menyimpan kategori kustom ke localStorage:', err);
  }
}

export function isSituationalCategory(categoryName, customCategories = []) {
  const normalized = (categoryName || '').trim().toLowerCase();
  if (!normalized || normalized === 'semua') return false;

  const situationalList = [...DEFAULT_SITUATIONAL_CATEGORIES, ...customCategories];
  return situationalList.some((cat) => cat.toLowerCase() === normalized);
}

export function useCategories() {
  const [customCategories, setCustomCategories] = useState(() => getCustomCategories());

  useEffect(() => {
    const syncFromStorage = () => {
      setCustomCategories(getCustomCategories());
    };

    const handleStorage = (e) => {
      if (e.key === CUSTOM_CATEGORIES_KEY || e.key === null) {
        syncFromStorage();
      }
    };

    window.addEventListener('custom-categories-updated', syncFromStorage);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('custom-categories-updated', syncFromStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.filter(
      (customCat) =>
        !DEFAULT_CATEGORIES.some(
          (defaultCat) => defaultCat.toLowerCase() === customCat.toLowerCase()
        )
    )
  ];

  // Daftar kategori untuk dropdown form (tanpa opsi 'Semua')
  const selectableCategories = allCategories.filter((cat) => cat !== 'Semua');

  const addCustomCategory = useCallback((rawName) => {
    const trimmed = (rawName || '').trim();
    if (!trimmed) {
      return { success: false, error: 'Nama kategori tidak boleh kosong.' };
    }

    if (trimmed.length > 25) {
      return { success: false, error: 'Nama kategori maksimal 25 karakter.' };
    }

    const currentCustom = getCustomCategories();
    const existingAll = [...DEFAULT_CATEGORIES, ...currentCustom];
    const isDuplicate = existingAll.some(
      (cat) => cat.toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      return { success: false, error: `Kategori "${trimmed}" sudah ada.` };
    }

    const updated = [...currentCustom, trimmed];
    saveCustomCategories(updated);
    setCustomCategories(updated);
    return { success: true, category: trimmed };
  }, []);

  const checkIsSituational = useCallback(
    (categoryName) => isSituationalCategory(categoryName, customCategories),
    [customCategories]
  );

  return {
    allCategories,
    selectableCategories,
    customCategories,
    addCustomCategory,
    isSituationalCategory: checkIsSituational
  };
}

export default useCategories;
